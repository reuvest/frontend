"use client";

import { useEffect, useState, useMemo, useCallback, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AxiosError } from "axios";
import { getMe, getUserTransactions, type Transaction } from "../../services/userService";
import { getPortfolioSummary } from "../../services/portfolioService";
import {
  getUserUnitsForLand,
  getPurchasePreview,
  purchaseLand,
  sellLand,
} from "../../services/landService";
import handleApiError from "../../utils/handleApiError";
import toast from "react-hot-toast";
import {
  TrendingUp, TrendingDown, Layers,
  ChevronLeft, ChevronRight, X, Tag,
  Wallet, ToggleLeft, ToggleRight, AlertCircle,
  Plus, Minus, Award,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

const formatNaira = (v?: number | string) =>
  Number(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const koboToNaira = (k?: number) =>
  (Number(k || 0) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 });

interface PortfolioLand {
  land_id: string | number;
  land_name?: string;
  units_owned: number;
  price_per_unit_kobo?: number;
  current_value?: number;
  available_units?: number;
  cert_number?: string | null;
}

interface PortfolioSummaryDisplay {
  current_portfolio_value?: number;
  total_invested?: number;
  total_profit_loss?: number;
  profit_loss_percent?: number;
}

interface PortfolioTransaction extends Transaction {
  reference?: string | number;
  amount?: number | string;
  units?: number;
  land?: string;
  date?: string;
}

/* Actual /lands/:id/units response shape — the service's declared
   UserLandUnitsResponse (`{ units }`) doesn't match what the API really
   returns here, so this call site asserts its own shape rather than
   widening the shared service type for every other consumer (same pattern
   as the admin service call sites, see todo doc item #17). */
interface UserUnitsPayload {
  data: {
    available_units?: number;
    user_units?: number;
  };
}

/* Same reasoning as above — PurchasePreview is intentionally `unknown`
   in the shared service since the endpoint's shape varies by discount
   scenario; this is the one call site that needs its concrete fields. */
interface PurchasePreviewData {
  discount_label?: string;
  original_cost_naira: number;
  total_discount_kobo?: number;
  referral_discount_kobo?: number;
  referral_discount_naira?: number;
  paid_from_rewards_kobo?: number;
  paid_from_rewards_naira?: number;
  total_due_naira: number;
  sufficient_balance: boolean;
}

type ModalType = "buy" | "sell" | null;

interface ModalState {
  type: ModalType;
  land: PortfolioLand | null;
  units: string;
  pin: string;
  useRewards: boolean;
  processing: boolean;
  availableUnits: number;
  userUnits: number;
}

interface BreakdownRowProps {
  label: string;
  value: string;
  green?: boolean;
  strikethrough?: boolean;
  muted?: boolean;
}

function BreakdownRow({ label, value, green, strikethrough, muted }: BreakdownRowProps) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className={`text-xs ${muted ? "text-white/55" : "text-white/50"}`}>{label}</span>
      <span className={`text-xs font-semibold ${
        strikethrough ? "line-through text-white/55" :
        green         ? "text-emerald-400"           :
        "text-white"
      }`}>{value}</span>
    </div>
  );
}

export default function Portfolio() {
  const [lands, setLands]               = useState<PortfolioLand[]>([]);
  const [transactions, setTransactions] = useState<PortfolioTransaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [hasPin, setHasPin]             = useState(false);
  const [summary, setSummary]           = useState<PortfolioSummaryDisplay | null>(null);
  const [currentPage, setCurrentPage]   = useState(1);

  const MODAL_DEFAULTS: ModalState = {
    type: null, land: null, units: "", pin: "",
    useRewards: true, processing: false,
    availableUnits: 0,
    userUnits: 0,
  };

  const [modal, setModal]       = useState<ModalState>(MODAL_DEFAULTS);
  const [preview, setPreview]               = useState<PurchasePreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewTimer                        = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();

  // ── Derived caps ───────────────────────────────────────────────────────────
  const maxUnits = modal.type === "sell" ? modal.userUnits : modal.availableUnits;

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchPortfolioAndUser = useCallback(async () => {
    try {
      const u = await getMe();
      setHasPin(!!u.pin_is_set);
    } catch (err) {
      handleApiError(err as Error);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [d, txList] = await Promise.all([
        getPortfolioSummary(),
        getUserTransactions(),
      ]);

      setSummary({
        current_portfolio_value: d.current_portfolio_value_naira,
        total_invested:          d.total_invested_naira,
        total_profit_loss:       d.total_profit_loss_naira,
        profit_loss_percent:     d.profit_loss_percent,
      });

      setLands(
        (d.lands || [])
          .filter((l) => l.units > 0)
          .map((l) => ({
            land_id:             l.land_id,
            land_name:           l.land_name,
            units_owned:         l.units,
            price_per_unit_kobo: l.price_per_unit_kobo,
            current_value:       l.total_portfolio_value_naira,
            available_units:     l.available_units,
            cert_number:         l.cert_number ?? null,
          }))
      );

      setTransactions(
        txList.filter((t) => t.type === "Purchase" || t.type === "Sale")
      );
    } catch (err) {
      handleApiError(err as Error);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchPortfolioAndUser(), fetchAnalytics()]).finally(() =>
      setLoading(false)
    );
  }, [fetchPortfolioAndUser, fetchAnalytics]);

  // ── Preview fetch — debounced, only for buy modal ─────────────────────────
  useEffect(() => {
    if (modal.type !== "buy" || !modal.land) return;

    const units = Number(modal.units);
    if (!units || units <= 0) {
      setPreview(null);
      return;
    }

    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const preview = await getPurchasePreview(modal.land!.land_id, units, modal.useRewards);
        setPreview(preview as unknown as PurchasePreviewData);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [modal.units, modal.useRewards, modal.type, modal.land]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages  = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const paginatedTx = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return transactions.slice(start, start + ITEMS_PER_PAGE);
  }, [transactions, currentPage]);

  useEffect(() => setCurrentPage(1), [transactions]);

  const safePage = Math.min(currentPage, Math.max(1, totalPages));
  useEffect(() => {
    if (safePage !== currentPage) setCurrentPage(safePage);
  }, [safePage, currentPage]);

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const openModal = async (type: "buy" | "sell", land: PortfolioLand) => {
    if (!hasPin) {
      toast.error("Please set a transaction PIN first");
      setTimeout(() => router.push("/settings"), 1500);
      return;
    }

    let userUnits      = 0;
    let availableUnits = land.available_units ?? 0;

    if (type === "sell") {
      userUnits = land.units_owned ?? 0;
    } else {
      try {
        const payload  = await getUserUnitsForLand(land.land_id) as unknown as UserUnitsPayload;
        availableUnits = payload.data.available_units ?? 0;
        userUnits      = payload.data.user_units      ?? 0;
      } catch {
        toast.error("Failed to fetch land units");
        return;
      }
    }

    setPreview(null);
    setModal({
      ...MODAL_DEFAULTS,
      type, land,
      availableUnits,
      userUnits,
    });
  };

  const closeModal = () => {
    setPreview(null);
    setModal(MODAL_DEFAULTS);
  };

  // ── Stepper helpers ────────────────────────────────────────────────────────
  const setUnits = (val: string | number) => {
    const clamped = Math.min(Math.max(1, Math.floor(Number(val))), maxUnits);
    setModal((p) => ({ ...p, units: String(clamped) }));
  };

  const stepDown = () => {
    const cur = Number(modal.units) || 0;
    if (cur <= 1) return;
    setModal((p) => ({ ...p, units: String(cur - 1) }));
  };

  const stepUp = () => {
    const cur = Number(modal.units) || 0;
    if (cur >= maxUnits) return;
    setModal((p) => ({ ...p, units: String(cur + 1) }));
  };

  const handleInputDblClick = () => {
    if (maxUnits > 0) setModal((p) => ({ ...p, units: String(maxUnits) }));
  };

  // ── Transaction submit ─────────────────────────────────────────────────────
  const handleTransaction = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const units = Number(modal.units);

    if (!Number.isInteger(units) || units <= 0)
      return toast.error("Units must be a whole number greater than 0");
    if (modal.type === "sell" && units > modal.userUnits)
      return toast.error(`Cannot sell more than ${modal.userUnits} owned unit${modal.userUnits !== 1 ? "s" : ""}`);
    if (modal.type === "buy" && units > modal.availableUnits)
      return toast.error(`Cannot buy more than ${modal.availableUnits} available unit${modal.availableUnits !== 1 ? "s" : ""}`);
    if (modal.pin.length !== 4)
      return toast.error("Enter 4-digit PIN");

    setModal((p) => ({ ...p, processing: true }));

    try {
      if (modal.type === "buy") {
        const d = await purchaseLand(modal.land!.land_id, units, modal.pin, modal.useRewards);
        const savings = (d.total_discount_kobo ?? 0) + (d.paid_from_rewards_kobo ?? 0);
        let msg = "Purchase successful";
        if (savings > 0) msg += ` · Saved ₦${(savings / 100).toLocaleString()}`;
        toast.success(msg);

        // Show certificate toast if issued
        if (d.certificate?.cert_number) {
          const certNum = d.certificate.cert_number;
          setTimeout(() => {
            toast(
              (t) => (
                <span className="flex items-center gap-2 text-sm">
                  <span>🏅 Certificate issued!</span>
                  <a
                    href={`/portfolio/certificate/${certNum}`}
                    className="underline font-bold text-amber-500 hover:text-amber-400"
                    onClick={() => toast.dismiss(t.id)}
                  >
                    View →
                  </a>
                </span>
              ),
              { duration: 8000 }
            );
          }, 800);
        }
      } else {
        await sellLand(modal.land!.land_id, units, modal.pin);
        toast.success("Units sold successfully");
      }

      await Promise.all([fetchPortfolioAndUser(), fetchAnalytics()]);
      closeModal();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const msg = axiosErr.response?.data?.message || "";
      if (msg.toLowerCase().includes("transaction pin not set")) {
        toast.error("Please set a transaction PIN in settings");
        setTimeout(() => router.push("/settings"), 1500);
      } else {
        handleApiError(err as Error);
      }
    } finally {
      setModal((p) => ({ ...p, processing: false }));
    }
  };

  // ── Sell-side total (no discount) ──────────────────────────────────────────
  const sellTotal = useMemo(() => {
    if (modal.type !== "sell" || !modal.land || !modal.units) return 0;
    const units = parseFloat(modal.units);
    if (isNaN(units) || units <= 0) return 0;
    return (units * Number(modal.land.price_per_unit_kobo || 0)) / 100;
  }, [modal]);

  const formatDate = (d?: string) =>
    new Date(d ?? "").toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="min-h-screen gpu-layer bg-[#0D1F1A] relative" style={{ fontFamily: "var(--font-dm-sans), 'Helvetica Neue', sans-serif" }}>
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10 space-y-8">

        <div>
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2">Investments</p>
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Your Portfolio
          </h1>
          <p className="text-white/60 mt-1 text-sm">Track your land holdings and transactions</p>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <SummaryCardSkeleton key={i} />)}
          </div>
        ) : summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard title="Portfolio Value"    value={`₦${formatNaira(summary.current_portfolio_value)}`} />
            <SummaryCard title="Current Investment" value={`₦${formatNaira(summary.total_invested)}`} />
            <SummaryCard title="Profit / Loss"
              value={`₦${formatNaira(Math.abs(Number(summary.total_profit_loss || 0)))}`}
              positive={Number(summary.total_profit_loss) >= 0} signed
              prefix={Number(summary.total_profit_loss) >= 0 ? "+" : "-"} />
            <SummaryCard title="ROI"
              value={`${Number(summary.profit_loss_percent || 0).toFixed(2)}%`}
              positive={Number(summary.profit_loss_percent) >= 0} signed
              prefix={Number(summary.profit_loss_percent) >= 0 ? "+" : "-"} />
          </div>
        )}

        {/* Land Holdings */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {[1, 2].map((i) => <LandCardSkeleton key={i} />)}
          </div>
        ) : lands.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Layers size={22} className="text-white/55" />
            </div>
            <p className="text-white/60 mb-5">You haven&apos;t purchased any land yet</p>
            <Link href="/lands"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[#0D1F1A] text-sm transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
              Browse Available Lands
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {lands.map((land) => (
              <div key={land.land_id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-white/20 transition-all">
                <h2 className="font-bold text-white text-lg mb-4" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                  {land.land_name}
                </h2>
                <div className="space-y-2 mb-5">
                  <Row label="Units Owned"    value={land.units_owned} />
                  <Row label="Price per Unit" value={`₦${koboToNaira(land.price_per_unit_kobo)}`} />
                  <Row label="Current Value"  value={`₦${formatNaira(land.current_value)}`} accent />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => openModal("buy", land)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[#0D1F1A] transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
                    Buy More
                  </button>
                  <button onClick={() => openModal("sell", land)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    Sell
                  </button>
                </div>

                {/* Certificate link */}
                {land.cert_number && (
                  <Link
                    href={`/portfolio/certificate/${land.cert_number}`}
                    className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-amber-500/50 hover:text-amber-400 transition-colors"
                  >
                    <Award size={11} />
                    View Certificate
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Transaction History */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5 bg-white/5">
            <TrendingUp size={15} className="text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/70">Transaction History</h3>
            {transactions.length > 0 && (
              <span className="ml-auto text-xs text-white/55">{transactions.length} transactions</span>
            )}
          </div>

          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <TransactionRowSkeleton key={i} />)}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-white/55 py-8 text-sm">No transactions yet</p>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedTx.map((t: PortfolioTransaction, i: number) => {
                    const isPurchase = t.type === "Purchase";
                    return (
                      <div key={t.reference ?? `${t.type}-${t.date}-${i}`}
                        className="flex justify-between items-center rounded-xl border border-white/8 bg-white/3 px-4 py-3 hover:border-white/15 transition-all">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isPurchase ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                            {isPurchase
                              ? <TrendingUp   size={14} className="text-emerald-400" />
                              : <TrendingDown size={14} className="text-red-400" />}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${isPurchase ? "text-emerald-400" : "text-red-400"}`}>
                              {t.type} · {t.land}
                            </p>
                            <p className="text-xs text-white/55">
                              {isPurchase ? "+" : "-"}{t.units} unit{t.units !== 1 ? "s" : ""} · {formatDate(t.date)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${isPurchase ? "text-emerald-400" : "text-red-400"}`}>
                            ₦{formatNaira(t.amount)}
                          </p>
                          <p className="text-xs text-white/55">{t.status}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                          currentPage === page
                            ? "text-[#0D1F1A]"
                            : "bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                        style={currentPage === page ? { background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" } : {}}>
                        {page}
                      </button>
                    ))}
                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Buy / Sell modal ────────────────────────────────────────────────── */}
      {modal.type && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: "#0D1F1A", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-0.5">{modal.type}</p>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                  {modal.land?.land_name}
                </h2>
              </div>
              <button onClick={closeModal}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleTransaction} className="p-6 space-y-4">

              {/* ── Units input with stepper ───────────────────────────────── */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/55 mb-2">
                  Number of Units
                  {maxUnits > 0 && (
                    <span className="ml-2 normal-case text-white/20 font-normal">
                      (max {maxUnits} · double-click to fill)
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={stepDown}
                    disabled={!modal.units || Number(modal.units) <= 1}
                    className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Decrease units"
                  >
                    <Minus size={14} />
                  </button>

                  <input
                    type="number"
                    min={1}
                    max={maxUnits || undefined}
                    value={modal.units}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setModal((p) => ({ ...p, units: "" }));
                        return;
                      }
                      const n = Math.floor(Number(raw));
                      if (isNaN(n) || n < 0) return;
                      setModal((p) => ({ ...p, units: String(Math.min(n, maxUnits || n)) }));
                    }}
                    onBlur={(e) => {
                      const n = Math.floor(Number(e.target.value));
                      if (!isNaN(n) && n > 0) setUnits(n);
                    }}
                    onDoubleClick={handleInputDblClick}
                    className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 px-4 py-2.5 rounded-xl text-sm outline-none transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />

                  <button
                    type="button"
                    onClick={stepUp}
                    disabled={maxUnits > 0 && Number(modal.units) >= maxUnits}
                    className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Increase units"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {maxUnits > 0 && (
                  <p className="text-xs text-white/25 mt-1.5 pl-1">
                    {modal.type === "sell"
                      ? `${modal.userUnits} unit${modal.userUnits !== 1 ? "s" : ""} owned`
                      : `${modal.availableUnits} unit${modal.availableUnits !== 1 ? "s" : ""} available`}
                  </p>
                )}
              </div>

              {/* Rewards toggle — buy only */}
              {modal.type === "buy" && (
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Wallet size={14} className="text-amber-400/70" />
                    <span className="text-sm text-white/70 font-medium">Use rewards &amp; discounts</span>
                  </div>
                  <button type="button"
                    onClick={() => setModal((p) => ({ ...p, useRewards: !p.useRewards }))}
                    className="transition-colors" aria-label="Toggle rewards">
                    {modal.useRewards
                      ? <ToggleRight size={26} className="text-amber-400" />
                      : <ToggleLeft  size={26} className="text-white/20"  />}
                  </button>
                </div>
              )}

              {/* Cost breakdown — buy */}
              {modal.type === "buy" && Number(modal.units) > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  {previewLoading ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="w-3.5 h-3.5 border border-amber-500/40 border-t-amber-500 rounded-full animate-spin" />
                      <span className="text-xs text-amber-500/50">Calculating…</span>
                    </div>
                  ) : preview ? (
                    <>
                      {preview.discount_label && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <Tag size={11} className="text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-400">{preview.discount_label}</span>
                        </div>
                      )}
                      <BreakdownRow
                        label="Original cost"
                        value={`₦${preview.original_cost_naira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
                        strikethrough={(preview.total_discount_kobo ?? 0) > 0}
                      />
                      {(preview.referral_discount_kobo ?? 0) > 0 && (
                        <BreakdownRow
                          label="Referral discount"
                          value={`-₦${(preview.referral_discount_naira ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
                          green
                        />
                      )}
                      {(preview.paid_from_rewards_kobo ?? 0) > 0 && (
                        <BreakdownRow
                          label="From rewards balance"
                          value={`-₦${(preview.paid_from_rewards_naira ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
                          green
                        />
                      )}
                      <div className="border-t border-white/10 mt-2 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-white/50">You pay</span>
                          <span className="text-xl font-bold text-amber-400" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                            ₦{preview.total_due_naira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {!preview.sufficient_balance && (
                          <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                            <AlertCircle size={11} /> Insufficient wallet balance
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-amber-500/70 uppercase tracking-widest mb-1">Total to Pay</p>
                      <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                        ₦{((Number(modal.units) * Number(modal.land?.price_per_unit_kobo || 0)) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Cost — sell */}
              {modal.type === "sell" && sellTotal > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-xs text-amber-500/70 uppercase tracking-widest mb-1">You&apos;ll Receive</p>
                  <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
                    ₦{formatNaira(sellTotal)}
                  </p>
                </div>
              )}

              {/* PIN */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/55 mb-2">Transaction PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={modal.pin}
                  onChange={(e) => setModal((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 px-4 py-3 rounded-xl text-center text-2xl tracking-[0.5em] outline-none transition-all"
                  placeholder="••••"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 text-sm font-semibold transition-all">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    modal.processing ||
                    !modal.units ||
                    Number(modal.units) <= 0 ||
                    !modal.pin ||
                    (modal.type === "buy"  && Number(modal.units) > modal.availableUnits) ||
                    (modal.type === "sell" && Number(modal.units) > modal.userUnits)      ||
                    (modal.type === "buy"  && preview != null && !preview.sufficient_balance)
                  }
                  className="flex-1 py-3 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
                  {modal.processing
                    ? <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#0D1F1A]/40 border-t-[#0D1F1A] rounded-full animate-spin" />
                        Processing...
                      </span>
                    : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  positive?: boolean;
  signed?: boolean;
  prefix?: string;
}

function SummaryCard({ title, value, positive, signed, prefix }: SummaryCardProps) {
  const color = signed
    ? positive ? "text-emerald-400" : "text-red-400"
    : "text-amber-400";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-white/55 mb-1">{title}</p>
      <p className={`text-xl font-bold ${color}`}>{prefix}{value}</p>
    </div>
  );
}

// ── Loading skeletons ─────────────────────────────────────────────────────────
// Mirror the real card/row shapes above so the layout doesn't jump once data
// arrives. animate-pulse on each bar rather than the whole card, so nothing
// pulses in lockstep across the grid.

function SummaryCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="h-3 w-20 rounded bg-white/10 animate-pulse mb-3" />
      <div className="h-6 w-24 rounded bg-white/10 animate-pulse" />
    </div>
  );
}

function LandCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="h-5 w-40 rounded bg-white/10 animate-pulse mb-4" />
      <div className="space-y-3 mb-5">
        <div className="h-3.5 w-full rounded bg-white/5 animate-pulse" />
        <div className="h-3.5 w-full rounded bg-white/5 animate-pulse" />
        <div className="h-3.5 w-full rounded bg-white/5 animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="flex-1 h-10 rounded-xl bg-white/5 animate-pulse" />
        <div className="flex-1 h-10 rounded-xl bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}

function TransactionRowSkeleton() {
  return (
    <div className="flex justify-between items-center rounded-xl border border-white/8 bg-white/3 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/10 animate-pulse shrink-0" />
        <div>
          <div className="h-3.5 w-32 rounded bg-white/10 animate-pulse mb-2" />
          <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
        </div>
      </div>
      <div className="text-right">
        <div className="h-3.5 w-16 rounded bg-white/10 animate-pulse mb-2 ml-auto" />
        <div className="h-3 w-12 rounded bg-white/5 animate-pulse ml-auto" />
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string | number;
  accent?: boolean;
}

function Row({ label, value, accent }: RowProps) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-white/55 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-semibold ${accent ? "text-amber-400" : "text-white"}`}>{value}</span>
    </div>
  );
}