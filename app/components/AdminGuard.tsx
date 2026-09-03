"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

type Status = "loading" | "authorized" | "unauthorized";

/**
 * Gates the /admin area to any staff account: either the legacy is_admin
 * flag, or anyone holding at least one RBAC role — matching the backend's
 * AdminMiddleware exactly (is_admin OR roles()->exists()). Which specific
 * admin sections/actions a staff account can use is then decided by
 * `permission` below, checked per-section against user.permissions.
 */
export default function AdminGuard({
  children,
  permission,
}: {
  children: ReactNode;
  /** If provided, also requires this permission (in addition to being staff). */
  permission?: string;
}) {
  const router = useRouter();
  const { user, loading } = useAuth() ?? {};

  const isStaff =
    !!user && (user.is_admin === true || (Array.isArray(user.role_names) && user.role_names.length > 0));

  const hasPermission =
    !permission || (Array.isArray(user?.permissions) && user!.permissions!.includes(permission));

  const status: Status = loading
    ? "loading"
    : isStaff && hasPermission
      ? "authorized"
      : "unauthorized";

  useEffect(() => {
    if (status === "unauthorized") router.replace(isStaff ? "/admin" : "/dashboard");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0D1F1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status !== "authorized") return null;
  return children;
}
