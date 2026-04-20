"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import toast from "react-hot-toast";

const appname = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";

const links = [
  { name: "Home",        path: "/dashboard"   },
  { name: "Lands",       path: "/lands"       },
  { name: "Wallet",      path: "/wallet"      },
  { name: "Portfolio",   path: "/portfolio"   },
  { name: "Settings",    path: "/settings"    },
  { name: "Support",     path: "/support"     },
  { name: "Referrals",   path: "/referrals"   },
  { name: "Marketplace", path: "/marketplace" },
];

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [menuOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    toast.success("Logged out successfully. See you soon!");
  };

  return (
    <>
      <header
        className="w-full border-b"
        style={{
          fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
          background: "rgba(13, 31, 26, 0.95)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(255,255,255,0.07)",
          position: "relative",
          zIndex: 40,
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 py-3 gap-4">

          {/* Logo */}
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center shrink-0 group"
            aria-label={`${appname} Home`}
          >
           <img
              src="/reu_ng_logo.png"
              alt={`${appname} logo`}
              className="h-16 w-auto transition-opacity group-hover:opacity-80" 
              style={{ maxWidth: "160px", filter: "brightness(2.1)"  }}  
            />
          </Link>

          {user && (
            <>
              <nav
                className="hidden lg:flex items-center gap-0.5 flex-1 justify-center"
                aria-label="Main navigation"
              >
                {links.map((link) => {
                  const active = pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      aria-current={active ? "page" : undefined}
                      className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        active
                          ? "text-white bg-white/8"
                          : "text-white/40 hover:text-white/80 hover:bg-white/5"
                      }`}
                    >
                      {link.name}
                      {active && (
                        <span
                          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                          style={{ background: "#C8873A" }}
                        />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout + bell — desktop only */}
              <div className="hidden lg:flex items-center gap-2 shrink-0">
                <NotificationBell />
                <button
                  onClick={handleLogout}
                  aria-label="Logout"
                  className="flex items-center gap-1.5 text-sm text-white/30 hover:text-red-400 transition-colors px-3 py-2 rounded-lg hover:bg-red-500/8"
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>

              <div className="lg:hidden flex items-center gap-2 shrink-0">
                <div className="hidden sm:block">
                  <NotificationBell />
                </div>
                <button
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                >
                  {menuOpen ? <X size={17} /> : <Menu size={17} />}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Drawer (phones + tablets, below lg) ───────────────────────────── */}
      {user && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/70 backdrop-blur-sm lg:hidden z-40 transition-opacity duration-300 ${
              menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className={`fixed top-0 right-0 h-full w-72 sm:w-80 lg:hidden z-50 flex flex-col transition-transform duration-300 ease-out ${
              menuOpen ? "translate-x-0" : "translate-x-full"
            }`}
            style={{
              background: "#080f0c",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
              <Link
                href={user ? "/dashboard" : "/"}
                onClick={() => setMenuOpen(false)}
                aria-label={`${appname} Home`}
              >
                <img
                  src="/reu_ng_logo.png"
                  alt={`${appname} logo`}
                  className="h-10 w-auto"
                  style={{ maxWidth: "130px", filter: "brightness(2.1)" }}
                />
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Scrollable link list */}
            <nav className="flex-1 overflow-y-auto flex flex-col px-3 py-3 gap-0.5">
              {links.map((link) => {
                const active = pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-white/8 text-white"
                        : "text-white/40 hover:bg-white/5 hover:text-white/70"
                    }`}
                  >
                    <span>{link.name}</span>
                    {active ? (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: "#C8873A" }}
                      />
                    ) : (
                      <ChevronRight size={12} className="text-white/15" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="shrink-0 px-3 pt-4 pb-24 border-t border-white/8 flex items-center justify-between">
              <div className="sm:hidden">
                <NotificationBell />
              </div>
              <div className="hidden sm:block" /> {/* spacer on tablet */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-red-400/60 hover:text-red-400 hover:bg-red-500/8 px-4 py-2.5 rounded-xl transition-all font-medium"
              >
                <LogOut size={13} />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}