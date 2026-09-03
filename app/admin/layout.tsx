"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AdminGuard from "../components/AdminGuard";

/**
 * Maps admin route prefixes to the permission required to view them.
 * Checked against the current user's `permissions` (from /me) via
 * AdminGuard. Routes not listed here (the dashboard itself, and
 * /admin/roles which is informational for any staff member) only require
 * being staff at all — no specific permission.
 */
const ROUTE_PERMISSIONS: [prefix: string, permission: string][] = [
  ["/admin/users", "users.view"],
  ["/admin/lands", "lands.manage"],
  ["/admin/kyc", "kyc.view"],
  ["/admin/compliance", "compliance.view"],
  ["/admin/withdrawals", "withdrawals.view"],
  ["/admin/support", "support.tickets.view"],
  ["/admin/live-chat", "live_chat.manage"],
  ["/admin/blog", "blog.manage"],
  ["/admin/referrals", "referrals.view"],
  ["/admin/waitlist", "waitlist.view"],
];

function permissionFor(pathname: string): string | undefined {
  return ROUTE_PERMISSIONS.find(([prefix]) => pathname.startsWith(prefix))?.[1];
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";

  return (
    <AdminGuard permission={permissionFor(pathname)}>
      {children}
    </AdminGuard>
  );
}