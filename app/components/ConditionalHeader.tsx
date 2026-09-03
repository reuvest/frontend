"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import { NAV_HIDDEN_ROUTES } from "../../utils/routes";

export default function ConditionalHeader() {
  const pathname = usePathname() ?? "/";

  const hideNav = NAV_HIDDEN_ROUTES.some(
    (route: string) => pathname === route || pathname.startsWith(route + "/")
  );

  if (hideNav) return null;
  return <Header />;
}