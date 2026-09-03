import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { isAuthed, clearAuthedFlag } from "./tokenStore";
import { PUBLIC_ROUTES, isPublicRoute } from "./routes";

// A specific call site doing a genuinely idempotent write can opt in to
// retry via `{ retryable: true }` in its request config — see the retry
// section below.
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  retryable?: boolean;
  _retry?: boolean;
  _retryCount?: number;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 60_000,
  headers: { "Content-Type": "application/json" },
  // Required for the httpOnly cookie auth model: the browser only sends
  // auth_token/user_role/is_authed cookies cross-origin (API is typically
  // on a different subdomain than the app) if the request opts in. The API
  // must respond with a specific Access-Control-Allow-Origin (not "*") and
  // Access-Control-Allow-Credentials: true for this to work.
  withCredentials: true,
  // Sanctum's stateful-SPA CSRF check (added server-side via statefulApi())
  // needs the XSRF-TOKEN cookie echoed back as an X-XSRF-TOKEN header on
  // every mutating request. Axios only does this automatically for
  // same-origin requests — localhost:3000 -> localhost:8000 is cross-origin
  // (different port), so it has to be opted into explicitly.
  withXSRFToken: true,
});

// ── Request interceptor ───────────────────────────────────────────────────────
// No Authorization header to attach anymore — the httpOnly auth_token
// cookie rides along automatically via withCredentials. This interceptor
// now only needs to handle the FormData content-type quirk.

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// ── Refresh state ─────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: { resolve: () => void; reject: (error: unknown) => void }[] = [];

function processQueue(error: unknown) {
  refreshQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve()));
  refreshQueue = [];
}

const SKIP_REFRESH = ["/me", "/login", "/lands", "/refresh", "/logout"];
const shouldSkip = (url = "") => SKIP_REFRESH.some((p) => url.includes(p));

function isPublicPage() {
  if (typeof window === "undefined") return true; // SSR — never redirect
  return isPublicRoute(window.location.pathname, PUBLIC_ROUTES);
}

// ── Transient-failure retry ─────────────────────────────────────────────────
//
// Network blips (dropped connection, timeout) and 5xx responses currently
// fail silently with no recovery — this retries them with backoff. Only GET
// requests are retried by default: a failed POST/PUT for a land purchase,
// sale, or withdrawal must NOT be auto-retried, since the first attempt may
// have actually gone through server-side and a blind retry risks a double
// submission. A specific call site doing a genuinely idempotent write can
// opt in explicitly via `{ retryable: true }` in its request config.

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

function isRetryableError(error: AxiosError): boolean {
  const status = error.response?.status;
  const method = (error.config?.method || "get").toLowerCase();
  const isNetworkError = !error.response; // offline, timeout, DNS, CORS
  const isTransientStatus = typeof status === "number" && status >= 500 && status <= 599;
  const isSafeMethod = method === "get";
  const optedIn = (error.config as RetryableRequestConfig | undefined)?.retryable === true;
  return (isNetworkError || isTransientStatus) && (isSafeMethod || optedIn);
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Shared refresh implementation used by both the reactive 401 interceptor
 * and the proactive pre-expiry timer (see AuthContext). Queues concurrent
 * callers behind a single in-flight request.
 *
 * There's no token to read or attach anymore — the httpOnly auth_token
 * cookie is sent automatically, and the API rotates it via Set-Cookie on
 * the response. Resolves with `expires_at` (epoch ms) from the response
 * body so AuthContext can reschedule the next proactive refresh.
 */
// ── CSRF bootstrap ────────────────────────────────────────────────────────────
//
// Sanctum's stateful-SPA CSRF check requires the XSRF-TOKEN cookie to exist
// before any mutating request (login included) — it isn't set until this
// endpoint is hit once. It lives outside the /api prefix, so it's called
// against the API's root origin rather than the `api` instance's baseURL.

const API_ROOT = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "");

export function fetchCsrfCookie() {
  return axios.get(`${API_ROOT}/sanctum/csrf-cookie`, { withCredentials: true });
}

export function refreshAccessToken(): Promise<number | null> {
  if (!isAuthed()) return Promise.reject(new Error("No session to refresh"));

  if (isRefreshing) {
    return new Promise<void>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    }).then(() => null);
  }

  isRefreshing = true;

  return api
    .post("/refresh", {}, { timeout: 10_000 })
    .then((res) => {
      const expiresAt: number | null = res.data?.expires_at ?? null;
      processQueue(null);
      return expiresAt;
    })
    .catch((refreshError) => {
      processQueue(refreshError);
      clearAuthedFlag();
      throw refreshError;
    })
    .finally(() => {
      isRefreshing = false;
    });
}

// ── Response interceptor ─────────────────────────────────────────────────────

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryableRequestConfig | undefined;
    if (!original) return Promise.reject(error);

    // Retry transient failures first — independent of the 401/refresh flow
    // below, and applies regardless of whether this was a 401 or not.
    if (error.response?.status !== 401 && isRetryableError(error)) {
      original._retryCount = (original._retryCount || 0) + 1;
      if (original._retryCount <= MAX_RETRIES) {
        const backoff = RETRY_BASE_DELAY_MS * 2 ** (original._retryCount - 1);
        await wait(backoff + Math.random() * 100); // jitter, avoid thundering herd
        return api(original);
      }
    }

    if (
      error.response?.status !== 401 ||
      original._retry ||
      shouldSkip(original.url)
    ) {
      return Promise.reject(error);
    }

    // No session → guest user. Only redirect if they're on a protected page.
    if (!isAuthed()) {
      if (!isPublicPage()) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      await refreshAccessToken();
      // The refreshed cookie is attached automatically on retry — no
      // header to set.
      return api(original);
    } catch (refreshError) {
      if (!isPublicPage()) {
        window.location.replace("/login");
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;