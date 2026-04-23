import axios from "axios";
import { getToken, setToken, clearToken } from "./tokenStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 60_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor ───────────────────────────────────────────────────────

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

// ── Refresh state ─────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  refreshQueue = [];
}

const SKIP_REFRESH = ["/me", "/login", "/lands", "/refresh", "/logout"];
const shouldSkip = (url = "") => SKIP_REFRESH.some((p) => url.includes(p));

// Pages where a 401 should never trigger a redirect to /login.
const PUBLIC_PATHS = [
  "/",
  "/lands",
  "/login",
  "/register",
  "/waitlist",
  "/blog",
  "/support",
  "/terms",
  "/privacy",
  "/verify",
  "/verify-email",
  "/email-verified",
  "/forgot-password",
  "/reset-verify",
  "/set-new-password",
  "/r",
];

function isPublicPage() {
  if (typeof window === "undefined") return true; // SSR — never redirect
  const pathname = window.location.pathname;
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

// ── Response interceptor ─────────────────────────────────────────────────────

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status !== 401 ||
      original._retry ||
      shouldSkip(original.url)
    ) {
      return Promise.reject(error);
    }

    const token = getToken();

    // No token → guest user. Only redirect if they're on a protected page.
    if (!token) {
      if (!isPublicPage()) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // Queue parallel requests while a refresh is in flight.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/refresh`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10_000,
        }
      );

      const newToken = res.data?.access_token ?? res.data?.token;
      if (!newToken) throw new Error("No token in refresh response");

      // Persist to cookie; role stays unchanged so pass undefined.
      setToken(newToken);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearToken();
      delete api.defaults.headers.common.Authorization;
      if (!isPublicPage()) {
        window.location.replace("/login");
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;