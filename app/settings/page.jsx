"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound, RotateCcw, UserCircle, Landmark, ShieldCheck,
  ChevronRight, ArrowLeft,
} from "lucide-react";
import ProfileSettings from "./ProfileSettings";
import TransactionPin from "./TransactionPin";
import ResetPin from "./ResetPin";
import BankDetails from "./BankDetails";
import KycPanel from "./kyc/KycPanel";
import api from "../../utils/api";

const NAV = [
  { id: "profile", label: "Profile",         icon: UserCircle,  desc: "Name, email & password"  },
  { id: "pin",     label: "Transaction PIN", icon: KeyRound,    desc: "Set or update your PIN"  },
  { id: "reset",   label: "Reset PIN",       icon: RotateCcw,   desc: "Forgot your PIN?"        },
  { id: "bank",    label: "Bank Details",    icon: Landmark,    desc: "Payout account"          },
  { id: "kyc",     label: "Identity (KYC)",  icon: ShieldCheck, desc: "Verify your identity"    },
];

function KycBadge({ status }) {
  if (!status || status === "none") return null;

  const map = {
    pending:  { label: "Pending",  cls: "bg-amber-500/20 text-amber-400 border-amber-500/30"   },
    approved: { label: "Verified", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    rejected: { label: "Rejected", cls: "bg-red-500/20 text-red-400 border-red-500/30"         },
    resubmit: { label: "Action",   cls: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  };

  const m = map[status];
  if (!m) return null;

  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 rounded-full leading-none shrink-0 ${m.cls}`}>
      {m.label}
    </span>
  );
}

function NavItem({ item, active, kycStatus, pinIsSet, onClick }) {
  const Icon = item.icon;

  // Show a dot on the PIN nav item if PIN is not set
  const showPinDot = item.id === "pin" && pinIsSet === false;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 touch-manipulation ${
        active
          ? "bg-amber-500/10 border border-amber-500/20"
          : "hover:bg-white/5 border border-transparent"
      }`}
    >
      <div
        className={`relative w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
          active ? "text-[#0D1F1A]" : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/60"
        }`}
        style={active ? { background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" } : {}}
      >
        <Icon size={16} />
        {showPinDot && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-[#0D1F1A]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold leading-none ${active ? "text-amber-400" : "text-white/60 group-hover:text-white/80"}`}>
            {item.label}
          </span>
          {item.id === "kyc" && <KycBadge status={kycStatus} />}
        </div>
        <p className="text-xs text-white/25 mt-1 truncate">{item.desc}</p>
      </div>
      <ChevronRight size={13} className={`shrink-0 ${active ? "text-amber-500" : "text-white/20 group-hover:text-white/40"}`} />
    </button>
  );
}

function PanelHeader({ item }) {
  const Icon = item.icon;
  return (
    <div className="mb-7 pb-5 border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Icon size={15} className="text-amber-500" />
        </div>
        <h2 className="text-xl text-white font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {item.label}
        </h2>
      </div>
      <p className="text-white/30 text-sm mt-2 ml-12 leading-relaxed">{item.desc}</p>
    </div>
  );
}

function HelpCard() {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
      <p className="text-amber-400 text-xs font-bold mb-1">Need help?</p>
      <p className="text-white/30 text-xs leading-relaxed">
        Contact{" "}
        <a href="/support" className="text-amber-400 hover:underline">
          support
        </a>{" "}
        if you run into any issues with your account settings.
      </p>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab]   = useState("profile");
  const [mobilePanel, setMobilePanel] = useState(false);

  const [kycStatus, setKycStatus]   = useState(null);  
  const [pinIsSet, setPinIsSet]     = useState(null);  
  const activeNav = NAV.find((n) => n.id === activeTab);

  // Load KYC + PIN status on mount
  useEffect(() => {
    api.get("/user/account-status")
      .then((res) => {
        const d = res.data?.data ?? {};
        setKycStatus(d.kyc_status ?? "none");
        setPinIsSet(!!d.pin_is_set);
      })
      .catch(() => {
        // Fallback to /me
        api.get("/me")
          .then((res) => {
            const u = res.data?.data ?? {};
            setPinIsSet(u.pin_is_set ?? !!u.transaction_pin);
            setKycStatus(u.kyc_status ?? (u.is_kyc_verified ? "approved" : "none"));
          })
          .catch(() => {
            setKycStatus("none");
            setPinIsSet(false);
          });
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && NAV.find((n) => n.id === tab)) {
      setActiveTab(tab);
      setMobilePanel(true);
    }
  }, []);

  const selectTab = (id) => { setActiveTab(id); setMobilePanel(true); };

  const renderPanel = () => {
    switch (activeTab) {
      case "profile": return <ProfileSettings />;
      case "pin":     return <TransactionPin onPinSet={() => setPinIsSet(true)} />;
      case "reset":   return <ResetPin />;
      case "bank":    return <BankDetails />;
      case "kyc":     return <KycPanel kycStatus={kycStatus} setKycStatus={setKycStatus} />;
      default:        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1F1A] text-white" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* amber top bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50"
        style={{ background: "linear-gradient(90deg, #C8873A, #E8A850, #C8873A)" }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-28 sm:py-12">

        {/* Page heading */}
        <motion.div
          animate={{ opacity: mobilePanel ? 0 : 1, height: mobilePanel ? 0 : "auto" }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden sm:opacity-100! sm:h-auto! mb-6 sm:mb-8"
        >
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2">Account</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Settings
          </h1>
          <p className="text-white/40 text-sm mt-1">Manage your profile, security, and verification</p>
        </motion.div>

        <div className="sm:flex sm:gap-6 sm:items-start">

          {/* Mobile nav */}
          <AnimatePresence>
            {!mobilePanel && (
              <motion.div key="mobile-nav"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
                className="sm:hidden space-y-3"
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 p-2 space-y-0.5">
                  {NAV.map((item) => (
                    <NavItem key={item.id} item={item} active={activeTab === item.id}
                      kycStatus={kycStatus} pinIsSet={pinIsSet}
                      onClick={() => selectTab(item.id)} />
                  ))}
                </div>
                <HelpCard />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile panel */}
          <AnimatePresence>
            {mobilePanel && (
              <motion.div key="mobile-panel"
                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.2 }}
                className="sm:hidden"
              >
                <div className="flex items-center gap-3 mb-5">
                  <button
                    onClick={() => setMobilePanel(false)}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors touch-manipulation shrink-0"
                  >
                    <ArrowLeft size={15} />
                  </button>
                  {activeNav && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                        <activeNav.icon size={13} className="text-amber-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-bold text-white leading-tight truncate"
                          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                          {activeNav.label}
                        </h2>
                        <p className="text-white/30 text-xs truncate">{activeNav.desc}</p>
                      </div>
                    </div>
                  )}
                  {activeTab === "kyc" && <KycBadge status={kycStatus} />}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  {renderPanel()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop sidebar */}
          <aside className="hidden sm:block w-60 shrink-0 sticky top-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2 space-y-0.5">
              {NAV.map((item) => (
                <NavItem key={item.id} item={item} active={activeTab === item.id}
                  kycStatus={kycStatus} pinIsSet={pinIsSet}
                  onClick={() => setActiveTab(item.id)} />
              ))}
            </div>
            <HelpCard />
          </aside>

          {/* Desktop content panel */}
          <main className="hidden sm:block flex-1 min-w-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                  initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.18 }}
                  className="p-6 sm:p-8"
                >
                  {activeTab !== "kyc" && activeNav && <PanelHeader item={activeNav} />}
                  {renderPanel()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}