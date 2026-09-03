"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";
import { NAV_HIDDEN_ROUTES } from "../../utils/routes";

export default function ConditionalFooter() {
  const pathname = usePathname() ?? "/";

  const hideNav = NAV_HIDDEN_ROUTES.some(
    (route: string) => pathname === route || pathname.startsWith(route + "/")
  );

  if (hideNav) return null;
  return <Footer />;
}