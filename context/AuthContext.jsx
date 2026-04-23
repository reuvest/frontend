"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "../utils/api";
import { getToken, setToken, clearToken } from "../utils/tokenStore";
import { resetNotificationCache } from "../services/notificationService";

export const AuthContext = createContext(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveRole(user) {
  if (!user) return "user";
  return user.is_admin === true || user.role === "admin" ? "admin" : "user";
}

const GUEST_ROUTES = [
  "/",
  "/login",
  "/lands",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/email-verified",
  "/reset-verify",
  "/set-new-password",
  "/support",
  "/terms",
  "/privacy",
  "/r",
];

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const router   = useRouter();
  const pathname = usePathname();

  // ── clearSession ────────────────────────────────────────────────────────

  const clearSession = useCallback(() => {
    resetNotificationCache();
    clearToken(); // erases auth_token + user_role cookies
    delete api.defaults.headers.common.Authorization;
    setUser(null);
  }, []);

  // ── applySession ────────────────────────────────────────────────────────

  const applySession = useCallback((token, userData) => {
    setToken(token, deriveRole(userData)); // writes both cookies with correct TTL
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(userData);
  }, []);

  // ── checkAuth ───────────────────────────────────────────────────────────
  const checkAuth = useCallback(async () => {
    const token = getToken(); // cookie read

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Pre-seed axios so the /me call carries the token even before applySession.
    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    try {
      const res      = await api.get("/me");
      const userData = res.data?.data ?? res.data?.user ?? res.data;
      applySession(token, userData);
    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        // Definitively invalid — wipe session and redirect.
        clearSession();

        const isGuest = GUEST_ROUTES.some(
          (r) => pathname === r || pathname.startsWith(r + "/")
        );

        if (!isGuest) {
          sessionStorage.setItem("redirectAfterLogin", pathname);
          router.replace("/login");
        }
      } else if (!err.response) {
        // Network timeout / offline — keep token, surface nothing to the user.
        // The dashboard's own auth timeout fallback handles this gracefully.
        console.warn("Auth check: no network response (offline or timeout).");
      } else {
        // 500 / 503 transient error — do not log the user out.
        console.warn("Auth check: server error", status);
      }
    } finally {
      setLoading(false);
    }
  }, [applySession, clearSession, pathname, router]);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally once on mount

  // ── login ────────────────────────────────────────────────────────────────

  const login = async (email, password) => {
    const res = await api.post("/login", { email, password });

    const token =
      res.data?.token        ??
      res.data?.access_token ??
      res.data?.data?.token;

    if (!token) throw new Error("Token not returned from server");

    let userData;
    try {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      const meRes = await api.get("/me");
      userData    = meRes.data?.data ?? meRes.data?.user ?? meRes.data;
    } catch {
      userData = res.data?.user ?? null;
    }
    applySession(token, userData);
    return userData;
  };

  // ── logout ───────────────────────────────────────────────────────────────

  const logout = () => {
    api.post("/logout").catch(() => {}); // fire-and-forget server invalidation
    clearSession();
    sessionStorage.removeItem("redirectAfterLogin");
    window.location.href = "/login";
  };

  // ── context ──────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);