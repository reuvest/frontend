"use client";

import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "../utils/api";
import { resetNotificationCache } from "../services/notificationService";

export const AuthContext = createContext(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRole(user) {
  if (!user) return "user";
  if (user.is_admin === true) return "admin";
  if (user.role === "admin") return "admin";
  return "user";
}

function setCookie(name, value) {
  const minutes = parseInt(process.env.NEXT_PUBLIC_JWT_TTL_MINUTES ?? "1440", 10);
  const ms = (isNaN(minutes) ? 1440 : minutes) * 60 * 1000;
  const expires = new Date(Date.now() + ms).toUTCString();
  document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Lax`;
}

function clearCookie(name) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GUEST_ROUTES = [
  "/",
  "/login",
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

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const router   = useRouter();
  const pathname = usePathname();

  // ── Internal helpers ──────────────────────────────────────────────────────

  const clearSession = useCallback(() => {
    resetNotificationCache();
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;
    clearCookie("auth_token");
    clearCookie("user_role");
    setUser(null);
  }, []);

  const applySession = useCallback((token, userData) => {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(userData);
    setCookie("auth_token", token);
    setCookie("user_role", getRole(userData));
  }, []);

  // ── checkAuth ─────────────────────────────────────────────────────────────

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    try {
      const res      = await api.get("/me");
      const userData = res.data?.data ?? res.data?.user ?? res.data;
      applySession(token, userData);
    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        // Token is definitively expired / invalid — clear and redirect.
        clearSession();

        const isGuestRoute = GUEST_ROUTES.some(
          (r) => pathname === r || pathname.startsWith(r + "/")
        );

        if (!isGuestRoute) {
          localStorage.setItem("redirectAfterLogin", pathname);
          router.replace("/login");
        }
      } else if (!err.response) {
        console.warn("Auth check failed: no network response (timeout or offline).");
      } else {
        // Transient server error (500, 503, etc.) — do not log the user out.
        console.warn("Auth check returned non-401 error:", status);
      }
    } finally {
      setLoading(false);
    }
  }, [applySession, clearSession, pathname, router]);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only once on mount

  // ── login ─────────────────────────────────────────────────────────────────

  const login = async (email, password) => {
    const res = await api.post("/login", { email, password });

    const token =
      res.data?.token       ||
      res.data?.access_token ||
      res.data?.data?.token;

    if (!token) throw new Error("Token not returned from server");

    localStorage.setItem("token", token);

    try {
      const meRes    = await api.get("/me");
      const userData = meRes.data?.data ?? meRes.data?.user ?? meRes.data;
      applySession(token, userData);
    } catch {
      // Fallback: use whatever the login response returned
      const userData = res.data?.user ?? null;
      applySession(token, userData);
    }
  };

  // ── logout ────────────────────────────────────────────────────────────────

  const logout = () => {
    api.post("/logout").catch(() => {});
    clearSession();
    localStorage.removeItem("redirectAfterLogin");
    router.replace("/login");
  };

  // ── context value ─────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);