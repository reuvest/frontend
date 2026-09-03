"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminRoles, type AdminRole } from "../../../services/adminService";
import toast from "react-hot-toast";
import { ArrowLeft, Shield, KeyRound, Crown } from "lucide-react";

const ROLE_ACCENTS: Record<string, string> = {
  super_admin: "#EF4444",
  compliance_officer: "#8B5CF6",
  finance_officer: "#06B6D4",
  support_agent: "#22C55E",
};

function accentFor(name: string): string {
  return ROLE_ACCENTS[name] ?? "#C8873A";
}

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setRoles(await getAdminRoles());
      } catch (err) {
        console.error("Failed to load roles:", err);
        toast.error("Failed to load roles");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div
      className="min-h-screen bg-[#0D1F1A] relative"
      style={{ fontFamily: "var(--font-dm-sans), 'Helvetica Neue', sans-serif" }}
    >
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />
      <div
        className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white/60 transition-colors mb-6 sm:mb-8"
        >
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        <div className="mb-6 sm:mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-purple-400 mb-2">Admin Panel</p>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Roles &amp; Permissions
          </h1>
          <p className="text-white/60 mt-1 text-sm">
            Staff roles and the permissions each one grants. To assign a role to a
            user, go to their profile from{" "}
            <Link href="/admin/users" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
              Users
            </Link>
            .
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-24 border border-white/10 rounded-2xl">
            <Shield size={40} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/40">No roles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {roles.map((role) => {
              const accent = accentFor(role.name);
              return (
                <div
                  key={role.id}
                  className="rounded-2xl border border-white/10 p-5"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${accent}22`, border: `1px solid ${accent}44` }}
                    >
                      {role.name === "super_admin" ? (
                        <Crown size={18} style={{ color: accent }} />
                      ) : (
                        <Shield size={18} style={{ color: accent }} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-bold text-white text-base leading-snug">{role.label}</h2>
                      {role.description && (
                        <p className="text-xs text-white/55 mt-0.5">{role.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-white/50 mb-2 mt-4">
                    <KeyRound size={12} />
                    <span className="uppercase tracking-wider font-semibold">
                      {role.permissions.length} Permission{role.permissions.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((perm) => (
                      <span
                        key={perm.id}
                        title={perm.label}
                        className="px-2 py-1 rounded-lg text-[11px] font-medium bg-white/5 border border-white/10 text-white/70"
                      >
                        {perm.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}