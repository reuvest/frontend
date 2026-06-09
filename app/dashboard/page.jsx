"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import api from "../../utils/api";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  TrendingUp, Wallet, MapPin, Activity,
  ArrowUpRight, LayoutGrid, ChevronRight,
  ArrowDownLeft, Sparkles, RefreshCw, Star,
  WifiOff,
} from "lucide-react";

const FOUNDING_MEMBER_MAX_ID = 50;
const TX_DISPLAY_LIMIT = 8;

const GOLD_GRADIENT_STYLE = {
  background: "linear-gradient(135deg, #E8A850 0%, #C8873A 50%, #E8A850 100%)",
  backgroundSize: "200% auto",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

const statusCfg = (status = "") => {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("success") || s.includes("complete"))
    return { cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" };
  if (s.includes("pending"))
    return { cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400" };
  return { cls: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" };
};

const amountMeta = (type = "") => {
  const t = type?.toLowerCase() ?? "";
  if (t.includes("deposit") || t.includes("sale"))
    return { sign: "+", color: "text-emerald-400", isCredit: true };
  if (t.includes("withdraw") || t.includes("purchase") || t.includes("invest"))
    return { sign: "−", color: "text-red-400", isCredit: false };
  return { sign: "", color: "text-white/70", isCredit: null };
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString("en-NG", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const isFoundingMember = (user) =>
  user?.id && Number(user.id) <= FOUNDING_MEMBER_MAX_ID;

function useCountUp(target, duration = 1100, enabled = true) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    setValue(0);

    if (!enabled || target === 0) { setValue(target); return; }

    const start = performance.now();
    const tick = (now) => {
      const p    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * ease));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, enabled]);

  return value;
}

function useDashboardData(enabled) {
  const [stats, setStats]                 = useState(null);
  const [statsError, setStatsError]       = useState(false);
  const [transactions, setTransactions]   = useState([]);
  const [txError, setTxError]             = useState(false);
  const [loadingStats, setLoadingStats]   = useState(true);
  const [loadingTx, setLoadingTx]         = useState(true);

  const fetchStats = useCallback(async (signal) => {
    setLoadingStats(true);
    setStatsError(false);
    try {
      const res = await api.get("/user/stats", { signal });
      const s   = res.data?.data ?? {};
      setStats({
        balance:                 (s.balance_kobo                ?? 0) / 100,
        current_portfolio_value: (s.current_portfolio_value_kobo ?? 0) / 100,
        total_invested:          (s.total_invested_kobo           ?? 0) / 100,
        lands_owned:              s.lands_owned                  ?? 0,
        units_owned:              s.units_owned                  ?? 0,
        total_withdrawn:         (s.total_withdrawn_kobo          ?? 0) / 100,
        pending_withdrawals:      s.pending_withdrawals,
      });
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      if (err.response?.status !== 401) setStatsError(true);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (signal) => {
    setLoadingTx(true);
    setTxError(false);
    try {
      const res    = await api.get("/transactions/user", { signal });
      const txList = res.data?.data ?? [];
      setTransactions(Array.isArray(txList) ? txList : []);
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;
      if (err.response?.status !== 401) setTxError(true);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  const cleanupRef = useRef(() => {});

  const loadData = useCallback(() => {
    if (!enabled) return () => {};

    cleanupRef.current();

    const statsCtrl  = new AbortController();
    const txCtrl     = new AbortController();
    const statsTimer = setTimeout(() => statsCtrl.abort(), 8_000);
    const txTimer    = setTimeout(() => txCtrl.abort(),    8_000);

    const cleanup = () => {
      clearTimeout(statsTimer);
      clearTimeout(txTimer);
      statsCtrl.abort();
      txCtrl.abort();
    };
    cleanupRef.current = cleanup;

    fetchStats(statsCtrl.signal);
    fetchTransactions(txCtrl.signal);

    return cleanup;
  }, [enabled, fetchStats, fetchTransactions]);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  const refetch = useCallback(() => {
    loadData();
  }, [loadData]);

  return { stats, statsError, transactions, txError, loadingStats, loadingTx, refetch };
}

export default function Dashboard() {
  const { user, loading: loadingUser } = useAuth();
  const router = useRouter();

  const [mounted, setMounted]           = useState(false);
  const [slowHint, setSlowHint]         = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  const greetingText = useMemo(() => getGreeting(), []);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));

    const hintTimer    = setTimeout(() => setSlowHint(true),    3_000);
    const timeoutTimer = setTimeout(() => setAuthTimedOut(true), 8_000);

    return () => {
      clearTimeout(hintTimer);
      clearTimeout(timeoutTimer);
    };
  }, []);

  const { stats, statsError, transactions, txError, loadingStats, loadingTx, refetch } =
    useDashboardData(!!user);

  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem("justLoggedIn") === "1") {
      sessionStorage.removeItem("justLoggedIn");
      toast.success(`Welcome back, ${user.name?.split(" ")[0] || "Investor"}!`, { duration: 3000 });
    }
  }, [user]);

  useEffect(() => {
    if (!loadingUser && !user) router.replace("/login");
    if (authTimedOut && !loadingUser && !user) router.replace("/login");
  }, [loadingUser, user, router, authTimedOut]);

  if (loadingUser || !user) {
    return (
      <div className="min-h-screen bg-[#0D1F1A] flex flex-col items-center justify-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 w-12 h-12 border-2 border-amber-500/15 rounded-full" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
        {slowHint && (
          <p className="text-white/30 text-xs animate-pulse">
            Still loading… check your connection
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0D1F1A] relative overflow-x-clip"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
       }}
    >
      {/* <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 0 }}>
        <div
          className="absolute -top-[15%] -right-[5%] w-[55vw] h-[55vw] rounded-full"
          style={{ background: "" }}
        />
        <div
          className="absolute -bottom-[10%] -left-[10%] w-[45vw] h-[45vw] rounded-full"
          style={{ background: "" }}
        />
        <div className="absolute top-0 left-0 right-0 h-48 bg-linear-to-b from-black/25 to-transparent" />
        </div> */}

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">

        <header
          className=""
          
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[10px] font-black tracking-[0.28em] uppercase text-amber-500/60">
                  Dashboard
                </span>
                <span className="w-1 h-1 rounded-full bg-amber-500/30" />
                <span className="text-[10px] text-white/20">
                  {new Date().toLocaleDateString("en-NG", {
                    weekday: "short", month: "short", day: "numeric",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <h1
                  className="text-2xl sm:text-4xl font-bold leading-tight"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  <span className="text-white">{greetingText}, </span>
                  <span style={GOLD_GRADIENT_STYLE}>
                    {user?.name?.split(" ")[0] || "Investor"}
                  </span>
                </h1>

                {isFoundingMember(user) && (
                  <>
                    <MobileFoundingBadge />
                    <span
                      className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border"
                      style={{
                        background: "linear-gradient(135deg, rgba(200,135,58,0.15), rgba(232,168,80,0.08))",
                        borderColor: "rgba(200,135,58,0.35)",
                        color: "#E8A850",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      Founding Investor
                    </span>
                  </>
                )}
              </div>

              <p className="text-sm text-white/30 mt-1.5">
                Here's how your investments are performing today.
              </p>
            </div>

            <button
              onClick={refetch}
              className="group self-start flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white/30 border border-white/10 hover:border-white/20 hover:text-white/55 hover:bg-white/5 transition-all"
            >
              <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
              Refresh
            </button>
          </div>
        </header>

        <section
          className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          
        >

          {loadingStats ? (
            [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          ) : statsError ? (
            <StatErrorCard onRetry={refetch} />
          ) : (
            <>
              <StatCard icon={<Wallet size={16} />}     label="Wallet Balance"  value={stats?.balance ?? 0}                  accent="amber"   href="/wallet"    mounted={mounted} />
              <StatCard icon={<TrendingUp size={16} />} label="Portfolio Value" value={stats?.current_portfolio_value ?? 0}  accent="emerald" href="/portfolio" mounted={mounted} />
              <div className="col-span-2 lg:col-span-1">
                <StatCard icon={<MapPin size={16} />}   label="Lands Invested"  value={stats?.lands_owned ?? 0}              accent="blue"    href="/portfolio" mounted={mounted} isCount sub={`${stats?.units_owned ?? 0} units`} />
              </div>
            </>
          )}
        </section>

        <section
          className=""
          
        >
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <QuickCard title="Wallet"    desc="Fund & manage"     href="/wallet"    icon={<Wallet size={17} />}     accent="#C8873A" />
            <QuickCard title="Portfolio" desc="Track investments" href="/portfolio" icon={<LayoutGrid size={17} />} accent="#2D7A55" />
            <QuickCard title="Explore"   desc="New opportunities" href="/lands"     icon={<MapPin size={17} />}     accent="#8B5CF6" />
          </div>
        </section>

        <section
          className=""
          
        >
          <TransactionsSection
            transactions={transactions}
            loading={loadingTx}
            error={txError}
            onRetry={refetch}
          />
        </section>

      </main>
    </div>
  );
}

function MobileFoundingBadge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <div className="relative flex sm:hidden items-center">
      <Star
        size={16}
        className="fill-amber-400 text-amber-400 cursor-pointer shrink-0"
        onClick={() => setShow(v => !v)}
      />
      <span
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-bold border pointer-events-none transition-opacity duration-200 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: "linear-gradient(135deg, rgba(20,40,30,0.98), rgba(15,30,22,0.98))",
          borderColor: "rgba(200,135,58,0.35)",
          color: "#E8A850",
        }}
      >
        Founding Investor
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 min-h-32 relative">
      <div className="absolute inset-0 bg-white/5" />
    </div>
  );
}

function StatErrorCard({ onRetry }) {
  return (
    <div className="col-span-2 lg:col-span-3 rounded-2xl border border-red-500/20 bg-red-500/5 min-h-32 flex flex-col items-center justify-center gap-3 p-5 text-center">
      <WifiOff size={20} className="text-red-400/60" />
      <p className="text-sm text-white/40">Couldn't load stats</p>
      <button
        onClick={onRetry}
        className="px-4 py-1.5 rounded-xl text-xs font-bold border border-red-500/20 text-red-400/70 hover:bg-red-500/10 transition-all"
      >
        Retry
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, accent, href, mounted, isCount, sub }) {
  const palette = {
    amber:   { glow: "rgba(200,135,58,0.14)",  icon: "rgba(200,135,58,1)",  ring: "rgba(200,135,58,0.22)"  },
    emerald: { glow: "rgba(45,122,85,0.14)",   icon: "rgba(74,222,128,1)",  ring: "rgba(45,122,85,0.22)"   },
    blue:    { glow: "rgba(59,130,246,0.14)",  icon: "rgba(96,165,250,1)",  ring: "rgba(59,130,246,0.22)"  },
    purple:  { glow: "rgba(139,92,246,0.14)",  icon: "rgba(167,139,250,1)", ring: "rgba(139,92,246,0.22)"  },
  };
  const a   = palette[accent] ?? palette.amber;
  const num = parseFloat(value) || 0;

  const intPart  = Math.floor(num);
  const fracPart = isCount ? null : (num % 1).toFixed(2).slice(1);
  const animated = useCountUp(intPart, 1000, mounted);

  const display = isCount
    ? animated.toLocaleString()
    : "₦" + animated.toLocaleString("en-NG") + fracPart;

  const inner = (
    <div className="group relative rounded-2xl border border-white/[0.07]  p-4 sm:p-5 hover:bg-white/[0.055] hover:border-white/[0.12] transition-all duration-300 min-h-32 flex flex-col" style={{
    backgroundColor: "#132922"
  }}>      
  <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${a.glow}, transparent 70%)` }}
      />
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-4 shrink-0"
        style={{ background: a.glow, boxShadow: `0 0 0 1px ${a.ring}`, color: a.icon }}
      >
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-1.5 truncate">
        {label}
      </p>
      <p
        className="text-xl sm:text-2xl font-bold text-white leading-none mt-auto"
        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        title={isCount ? String(num) : `₦${num.toLocaleString()}`}
      >
        {display}
      </p>
      {sub && <p className="text-[11px] text-white/25 mt-1.5 truncate">{sub}</p>}
      <ChevronRight
        size={12}
        className="absolute bottom-4 right-4 text-white/15 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300"
      />
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

function QuickCard({ title, desc, href, icon, accent }) {
  return (
    <Link
      href={href}
      className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.055] hover:border-white/[0.12] transition-all duration-300 block"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `` }}
      />
      <div className="relative p-4 sm:p-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-3.5 transition-transform duration-300 group-hover:scale-[1.08]"
          style={{ background: `${accent}16`, color: accent, boxShadow: `0 0 0 1px ${accent}28` }}
        >
          {icon}
        </div>
        <h3 className="font-bold text-white/85 text-sm leading-none">{title}</h3>
        <p className="text-[11px] hover:border-white/[0.27] mt-1 sm:block leading-snug">{desc}</p>
        <div className="hidden sm:flex items-center gap-1 mt-3">
          <span className="text-xs font-bold transition-colors" style={{ color: accent }}>Open</span>
          <ArrowUpRight
            size={11}
            style={{ color: accent }}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200"
          />
        </div>
      </div>
    </Link>
  );
}

function TransactionsSection({ transactions, loading, error, onRetry }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="h-4 w-44 rounded-lg bg-white/[0.07] animate-pulse" />
        </div>
        <div className="divide-y divide-white/5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded bg-white/5 w-2/5" />
                <div className="h-2.5 rounded bg-white/[0.03] w-1/4" />
              </div>
              <div className="h-4 rounded bg-white/5 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
        <div className="flex flex-col items-center text-center px-5 py-10 gap-3">
          <WifiOff size={20} className="text-white/20" />
          <p className="text-sm text-white/40">Couldn't load transactions</p>
          <button
            onClick={onRetry}
            className="px-4 py-1.5 rounded-xl text-xs font-bold border border-white/10 text-white/30 hover:bg-white/5 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!transactions?.length) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(200,135,58,0.1)", boxShadow: "0 0 0 1px rgba(200,135,58,0.18)" }}
            >
              <Activity size={13} className="text-amber-500" />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.22em] hover:border-white/[0.35]">
              Recent Transactions
            </h2>
          </div>
        </div>
        <div className="flex flex-col items-center text-center px-5 py-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "rgba(200,135,58,0.07)", boxShadow: "0 0 0 1px rgba(200,135,58,0.13)" }}
          >
            <Sparkles size={16} className="text-amber-500/50" />
          </div>
          <p
            className="font-bold text-white/60 text-sm mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            No transactions yet
          </p>
          <p className="text-xs text-white/25 mb-5 max-w-50 leading-relaxed">
            Invest in verified land to see activity here.
          </p>
          <Link
            href="/lands"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs text-[#0D1F1A] transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
          >
            Browse Properties <ArrowUpRight size={11} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(200,135,58,0.1)", boxShadow: "0 0 0 1px rgba(200,135,58,0.18)" }}
          >
            <Activity size={13} className="text-amber-500" />
          </div>
          <h2 className="text-[10px] font-black uppercase tracking-[0.22em] hover:border-white/[0.35]">
            Recent Transactions
          </h2>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-white/10 text-white/20">
            {transactions.length}
          </span>
        </div>
        <Link
          href="/wallet"
          className="flex items-center gap-1 text-xs font-bold text-amber-500/65 hover:text-amber-400 transition-colors"
        >
          View all <ChevronRight size={11} />
        </Link>
      </div>

      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {[
                { label: "Type / Asset", align: "text-left"  },
                { label: "Amount",       align: "text-right" },
                { label: "Status",       align: "text-left"  },
                { label: "Date",         align: "text-left"  },
              ].map(({ label, align }) => (
                <th
                  key={label}
                  className={`px-5 py-3 text-[9px] font-black uppercase tracking-[0.22em] text-white/20 ${align}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr:last-child]:border-b-0">
            {transactions.slice(0, TX_DISPLAY_LIMIT).map((tx, idx) => {
              const { sign, color, isCredit } = amountMeta(tx?.type);
              const { cls, dot }              = statusCfg(tx?.status);
              const amountNaira = Number(tx?.amount ?? 0);
              const txDate      = tx?.date ?? tx?.created_at;

              return (
                <tr
                  key={idx}
                  className="border-b border-white/[0.035] hover:bg-white/[0.022] transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-[1.04] ${
                          isCredit === true    ? "bg-emerald-500/10"
                          : isCredit === false ? "bg-red-500/10"
                          : "bg-white/5"
                        }`}
                      >
                        {isCredit === true
                          ? <ArrowDownLeft size={14} className="text-emerald-400" />
                          : isCredit === false
                          ? <ArrowUpRight size={14} className="text-red-400" />
                          : <Activity size={14} className="text-white/25" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold capitalize text-white/75 text-sm leading-none truncate">
                          {tx?.type || "Transaction"}
                        </p>
                        <p className="text-[11px] hover:border-white/[0.22] mt-1 truncate">
                          {tx?.land || "Wallet"}
                          {tx?.units != null && (
                            <span className="ml-1.5 text-white/20">
                              · {tx.units} unit{tx.units !== 1 ? "s" : ""}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span
                      className={`font-bold tabular-nums text-[0.9rem] ${color}`}
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      {sign}₦{amountNaira.toLocaleString("en-NG")}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                      {tx?.status || "—"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-[11px] hover:border-white/[0.22] whitespace-nowrap">
                    {formatDate(txDate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-white/5 [&>div:last-child]:border-b-0">
        {transactions.slice(0, TX_DISPLAY_LIMIT).map((tx, idx) => {
          const { sign, color, isCredit } = amountMeta(tx?.type);
          const { cls, dot }              = statusCfg(tx?.status);
          const amountNaira = Number(tx?.amount ?? 0);
          const txDate      = tx?.date ?? tx?.created_at;

          return (
            <div
              key={idx}
              className="px-4 py-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isCredit === true    ? "bg-emerald-500/10"
                  : isCredit === false ? "bg-red-500/10"
                  : "bg-white/5"
                }`}
              >
                {isCredit === true
                  ? <ArrowDownLeft size={15} className="text-emerald-400" />
                  : isCredit === false
                  ? <ArrowUpRight size={15} className="text-red-400" />
                  : <Activity size={15} className="text-white/25" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm capitalize text-white/75 truncate leading-none">
                  {tx?.type || "Transaction"}
                </p>
                <p className="text-[11px] text-white/40 mt-0.5 truncate">
                  {tx?.land || "Wallet"}
                  {tx?.units != null && (
                    <span className="text-white/20">
                      {" "}· {tx.units} unit{tx.units !== 1 ? "s" : ""}
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-white/20 mt-0.5">{formatDate(txDate)}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`font-bold text-sm tabular-nums ${color}`}>
                  {sign}₦{amountNaira.toLocaleString("en-NG")}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-[0.08em] ${cls}`}>
                  <span className={`w-1 h-1 rounded-full ${dot}`} />
                  {tx?.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {transactions.length > TX_DISPLAY_LIMIT && (
        <div className="px-5 py-2 border-t border-white/5 text-center bg-white/[0.01]">
          <Link
            href="/wallet"
            className="text-xs text-white/20 hover:text-amber-500 transition-colors font-semibold"
          >
            View all {transactions.length} transactions →
          </Link>
        </div>
      )}
    </div>
  );
}