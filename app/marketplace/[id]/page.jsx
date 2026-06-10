"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../../utils/api";
import { formatNaira } from "../../../utils/currency";
import toast from "react-hot-toast";
import {
  ArrowLeft, MapPin, Package, Tag, MessageSquare,
  Send, Lock, CheckCircle, X, AlertCircle, Clock,
  TrendingUp, ChevronDown, ChevronUp, User, Wallet,
  ShieldCheck, RefreshCw, Plus, Minus,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useCurrentUser() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    api.get("/me").then((r) => setUser(r.data?.data ?? null)).catch(() => {});
  }, []);
  return user;
}

function StatusBadge({ status, large }) {
  const map = {
    active:           { label: "Active",           cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    in_escrow:        { label: "In Escrow",        cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    sold:             { label: "Sold",              cls: "bg-white/5 text-white/55 border-white/10" },
    cancelled:        { label: "Cancelled",        cls: "bg-red-500/10 text-red-400 border-red-500/20" },
    awaiting_payment: { label: "Awaiting Payment", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    paid:             { label: "Paid",             cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    completed:        { label: "Completed",        cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    disputed:         { label: "Disputed",         cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const s = map[status] ?? map.active;
  return (
    <span className={`inline-flex items-center rounded-full border font-bold uppercase tracking-wider ${large ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-[10px]"} ${s.cls}`}>
      {s.label}
    </span>
  );
}

function Panel({ title, icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">{icon}</div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-white/50">{title}</span>
        </div>
        {open ? <ChevronUp size={13} className="text-white/20" /> : <ChevronDown size={13} className="text-white/20" />}
      </button>
      {open && <div className="border-t border-white/5 px-5 pb-5 pt-4">{children}</div>}
    </div>
  );
}

// ─── Units Stepper ─────────────────────────────────────────────────────────────
// Reusable stepper with hard max, double-click to fill, clamping on blur
function UnitsStepper({ value, onChange, max, placeholder }) {
  const numVal = Number(value) || 0;

  const step = (delta) => {
    const next = Math.min(Math.max(1, numVal + delta), max);
    onChange(String(next));
  };

  return (
    <div className="flex items-center gap-1.5">
      {/* − */}
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={numVal <= 1 || !value}
        className="w-8 h-8 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.01]0 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Decrease units"
      >
        <Minus size={12} />
      </button>

      <input
        type="number"
        min={1}
        max={max || undefined}
        value={value}
        placeholder={placeholder ?? `Max ${max}`}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") { onChange(""); return; }
          const n = Math.floor(Number(raw));
          if (isNaN(n) || n < 0) return;
          onChange(String(max ? Math.min(n, max) : n));
        }}
        onBlur={(e) => {
          const n = Math.floor(Number(e.target.value));
          if (!isNaN(n) && n > 0) onChange(String(Math.min(Math.max(1, n), max || n)));
          else if (e.target.value !== "") onChange("");
        }}
        onDoubleClick={() => { if (max > 0) onChange(String(max)); }}
        className="flex-1 bg-white/5 border border-white/10 focus:border-amber-500/40 text-white placeholder-white/20 px-3 py-2 rounded-lg text-sm outline-none transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />

      {/* + */}
      <button
        type="button"
        onClick={() => step(1)}
        disabled={max > 0 && numVal >= max}
        className="w-8 h-8 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.01]0 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        aria-label="Increase units"
      >
        <Plus size={12} />
      </button>
    </div>
  );
}

// ─── Offer Form ───────────────────────────────────────────────────────────────
function OfferForm({ listing, onSuccess }) {
  const maxUnits = listing.units_for_sale ?? 0;

  const [form, setForm]     = useState({ units: "", offer_price_display: "", message: "" });
  const [loading, setLoading] = useState(false);

  const offerKobo  = Math.round((parseFloat(form.offer_price_display) || 0) * 100);
  const totalNaira = offerKobo > 0 && form.units
    ? (offerKobo * parseInt(form.units)) / 100
    : null;

  const submit = async (e) => {
    e.preventDefault();
    const units = parseInt(form.units);
    if (!units || units <= 0)          return toast.error("Enter a valid number of units");
    if (units > maxUnits)              return toast.error(`Max ${maxUnits} units available`);
    if (!offerKobo || offerKobo <= 0)  return toast.error("Enter a valid price per unit");

    setLoading(true);
    try {
      await api.post(`/marketplace/${listing.id}/offers`, {
        units,
        offer_price_kobo: offerKobo,
        message:          form.message || undefined,
      });
      toast.success("Offer submitted!");
      setForm({ units: "", offer_price_display: "", message: "" });
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {/* Units with stepper */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-white/55 uppercase tracking-widest font-bold">
            Units
          </label>
          <span className="text-[10px] text-white/20">
            {maxUnits} available · double-click to fill
          </span>
        </div>
        <UnitsStepper
          value={form.units}
          onChange={(v) => setForm((f) => ({ ...f, units: v }))}
          max={maxUnits}
          placeholder={`1 – ${maxUnits}`}
        />
        {form.units && Number(form.units) >= maxUnits && (
          <p className="text-[10px] text-amber-400/60 mt-1">Maximum units selected</p>
        )}
      </div>

      {/* Price per unit */}
      <div>
        <label className="text-xs text-white/55 uppercase tracking-widest font-bold block mb-1.5">
          Price / Unit (₦)
        </label>
        <input
          type="number" min={0} step="0.01"
          value={form.offer_price_display}
          onChange={(e) => setForm((f) => ({ ...f, offer_price_display: e.target.value }))}
          placeholder={`Ask: ₦${(listing.asking_price_kobo / 100).toLocaleString()}`}
          className="w-full bg-white/5 border border-white/10 focus:border-amber-500/40 text-white placeholder-white/20 px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
        />
      </div>

      {/* Total preview */}
      {totalNaira !== null && (
        <div className="flex justify-between items-center rounded-lg bg-amber-500/5 border border-amber-500/15 px-3 py-2">
          <span className="text-xs hover:border-white/[0.35]">Total offer</span>
          <span className="text-sm font-bold text-amber-400">
            ₦{totalNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Optional message */}
      <input
        type="text"
        value={form.message}
        onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        placeholder="Optional message to seller…"
        className="w-full bg-white/5 border border-white/10 focus:border-amber-500/40 text-white placeholder-white/20 px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
      />

      <button
        type="submit"
        disabled={loading || !form.units || Number(form.units) <= 0 || !offerKobo}
        className="w-full py-3 rounded-xl font-bold text-[#0D1F1A] text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
      >
        {loading
          ? <><div className="w-3.5 h-3.5 border-2 border-[#0D1F1A]/40 border-t-[#0D1F1A] rounded-full animate-spin" />Submitting…</>
          : "Submit Offer"}
      </button>
    </form>
  );
}

// ─── Offers List (for seller) ─────────────────────────────────────────────────
function OffersList({ listing, onUpdate }) {
  const offers  = listing.pending_offers ?? [];
  const [acting, setActing] = useState(null);

  const handleAccept = async (offerId) => {
    setActing(offerId + "_accept");
    try {
      await api.patch(`/marketplace/${listing.id}/offers/${offerId}/accept`);
      toast.success("Offer accepted — escrow created");
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept offer");
    } finally { setActing(null); }
  };

  const handleReject = async (offerId) => {
    setActing(offerId + "_reject");
    try {
      await api.patch(`/marketplace/${listing.id}/offers/${offerId}/reject`);
      toast.success("Offer rejected");
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject offer");
    } finally { setActing(null); }
  };

  if (!offers.length) {
    return <p className="text-xs text-white/25 py-2">No pending offers yet.</p>;
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => (
        <div key={offer.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-sm font-bold text-white">{offer.buyer?.name}</p>
              <p className="text-xs hover:border-white/[0.35] mt-0.5">
                {offer.units} units @ ₦{(offer.offer_price_kobo / 100).toLocaleString("en-NG")} / unit
              </p>
              <p className="text-xs font-bold text-amber-400 mt-0.5">
                Total: ₦{((offer.offer_price_kobo * offer.units) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <StatusBadge status={offer.status} />
          </div>
          {offer.message && (
            <p className="text-xs text-white/60 italic border-t border-white/5 pt-2 mt-2">
              &ldquo;{offer.message}&rdquo;
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => handleAccept(offer.id)} disabled={!!acting}
              className="flex-1 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all disabled:opacity-50">
              {acting === offer.id + "_accept" ? "…" : "Accept"}
            </button>
            <button
              onClick={() => handleReject(offer.id)} disabled={!!acting}
              className="flex-1 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all disabled:opacity-50">
              {acting === offer.id + "_reject" ? "…" : "Reject"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Chat (inline, no Panel wrapper — caller wraps) ───────────────────────────
function ChatPanel({ listing, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [body, setBody]         = useState("");
  const [sending, setSending]   = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const isSeller  = currentUser?.id === listing.seller_id;

  const fetchMessages = useCallback(async () => {
    try {
      const params = isSeller
        ? { with: listing.pending_offers?.[0]?.buyer_id }
        : {};
      const res = await api.get(`/marketplace/${listing.id}/messages`, { params });
      setMessages(res.data?.data ?? []);
    } catch { /* silent */ } finally {
      setLoadingMsgs(false);
    }
  }, [listing.id, isSeller, listing.pending_offers]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const optimisticMsg = {
      id:         `tmp-${Date.now()}`,
      sender_id:  currentUser?.id,
      sender:     currentUser,
      body:       body.trim(),
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setBody("");
    try {
      const payload = { body: optimisticMsg.body };
      if (isSeller) payload.receiver_id = listing.pending_offers?.[0]?.buyer_id;
      await api.post(`/marketplace/${listing.id}/messages`, payload);
      // Refetch to replace optimistic with real message
      fetchMessages();
    } catch (err) {
      // Remove optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      toast.error(err.response?.data?.message || "Failed to send");
      setBody(optimisticMsg.body);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(e);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: 340 }}>
      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 scrollbar-thin">
        {loadingMsgs ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <MessageSquare size={24} className="text-white/10" />
            <p className="text-xs text-white/20 text-center">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === currentUser?.id;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                  isMe
                    ? "bg-amber-500/20 text-white"
                    : "bg-white/[0.06] text-white/75"
                } ${m._optimistic ? "opacity-60" : ""}`}>
                  {!isMe && (
                    <p className="text-[10px] font-bold text-white/55 mb-0.5">
                      {m.sender?.name ?? "Seller"}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed break-words">{m.body}</p>
                  <p className="text-[10px] text-white/20 mt-1 text-right">
                    {m._optimistic
                      ? "Sending…"
                      : new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input row */}
      <div className="flex gap-2 border-t border-white/5 pt-3">
        <input
          ref={inputRef}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          className="flex-1 bg-white/5 border border-white/10 focus:border-amber-500/40 text-white placeholder-white/20 px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !body.trim()}
          className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
          aria-label="Send message"
        >
          <Send size={14} className="text-[#0D1F1A]" />
        </button>
      </div>
    </div>
  );
}

// ─── Escrow Panel ─────────────────────────────────────────────────────────────
function EscrowPanel({ escrow, currentUser, onUpdate }) {
  const [pin, setPin]       = useState("");
  const [loading, setLoading] = useState(false);
  const isBuyer = escrow.buyer_id === currentUser?.id;

  const pay = async () => {
    if (!/^\d{4}$/.test(pin)) return toast.error("Enter your 4-digit PIN");
    setLoading(true);
    try {
      await api.post(`/marketplace/escrow/${escrow.id}/pay`, { transaction_pin: pin });
      toast.success("Payment successful — trade complete!");
      setPin("");
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally { setLoading(false); }
  };

  const dispute = async () => {
    const reason = window.prompt("Briefly describe the issue:");
    if (!reason) return;
    try {
      await api.post(`/marketplace/escrow/${escrow.id}/dispute`, { reason });
      toast.success("Dispute raised — our team will review within 24 hours");
      onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to raise dispute");
    }
  };

  const expiresIn = escrow.expires_at
    ? Math.max(0, Math.round((new Date(escrow.expires_at) - Date.now()) / 60000))
    : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          ["Units",        escrow.units],
          ["Price / Unit", `₦${(escrow.price_per_unit_kobo / 100).toLocaleString("en-NG")}`],
          ["Total",        `₦${(escrow.total_kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`],
          ["Platform Fee", `₦${(escrow.platform_fee_kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`],
        ].map(([label, val]) => (
          <div key={label} className="rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2.5">
            <p className="text-[10px] text-white/25 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-bold text-white mt-0.5">{val}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-4 py-3">
        <span className="text-xs text-white/60">Seller receives</span>
        <span className="text-base font-bold text-emerald-400">
          ₦{(escrow.seller_receives_kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <StatusBadge status={escrow.status} large />
        {expiresIn !== null && escrow.status === "awaiting_payment" && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400/70">
            <Clock size={11} />
            {expiresIn > 0 ? `Expires in ${expiresIn}m` : "Expired"}
          </div>
        )}
      </div>

      {isBuyer && escrow.status === "awaiting_payment" && (
        <div className="space-y-3 border-t border-white/5 pt-4">
          <p className="text-xs text-white/60">
            Enter your transaction PIN to pay from your wallet balance.
          </p>
          <input
            type="password" inputMode="numeric" maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="w-full bg-white/5 border border-white/10 focus:border-amber-500/40 text-white placeholder-white/20 px-4 py-3 rounded-xl text-center text-2xl tracking-[0.5em] outline-none transition-all"
            placeholder="••••"
          />
          <button
            onClick={pay} disabled={loading || pin.length !== 4}
            className="w-full py-3 rounded-xl font-bold text-[#0D1F1A] flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
            {loading
              ? <><div className="w-4 h-4 border-2 border-[#0D1F1A]/40 border-t-[#0D1F1A] rounded-full animate-spin" />Processing…</>
              : <><Wallet size={14} /> Pay ₦{(escrow.total_kobo / 100).toLocaleString("en-NG")}</>}
          </button>
        </div>
      )}

      {isBuyer && escrow.status === "paid" && (
        <button onClick={dispute}
          className="w-full py-2.5 rounded-xl border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-all">
          Raise a Dispute
        </button>
      )}

      {escrow.status === "completed" && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <CheckCircle size={15} className="text-emerald-400 shrink-0" />
          <p className="text-sm font-bold text-emerald-400">Trade complete — units transferred</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ListingDetailPage() {
  const { id }      = useParams();
  const router      = useRouter();
  const currentUser = useCurrentUser();

  const [listing, setListing] = useState(null);
  const [escrow, setEscrow]   = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchListing = useCallback(async () => {
    try {
      const res = await api.get(`/marketplace/${id}`);
      setListing(res.data.data);
    } catch {
      toast.error("Listing not found");
      router.push("/marketplace");
    } finally { setLoading(false); }
  }, [id, router]);

  const fetchEscrow = useCallback(async () => {
    try {
      const res    = await api.get("/marketplace/my/escrows");
      const escrows = res.data?.data?.data ?? res.data?.data ?? [];
      const match  = escrows.find((e) => e.listing_id === parseInt(id));
      setEscrow(match ?? null);
    } catch { /* silent */ }
  }, [id]);

  useEffect(() => { fetchListing(); fetchEscrow(); }, [fetchListing, fetchEscrow]);

  const refresh = () => { fetchListing(); fetchEscrow(); };

  if (loading) return (
    <div className="min-h-screen bg-[#0D1F1A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!listing) return null;

  const land     = listing.land;
  const image    = land?.images?.[0]?.image_url;
  const isSeller = currentUser?.id === listing.seller_id;
  const isActive = listing.status === "active";
  const canOffer = !isSeller && isActive && currentUser;
  const canChat  = currentUser && (
    isSeller || listing.pending_offers?.some((o) => o.buyer_id === currentUser.id)
  );

  return (
    <div className="min-h-screen bg-[#0D1F1A]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white/60 transition-colors mb-8">
          <ArrowLeft size={13} /> Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">

          {/* ── Left column ───────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Property card */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
              {image && (
                <div className="relative h-48 overflow-hidden">
                  <img src={image} alt={land?.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1F1A]/60 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <StatusBadge status={listing.status} large />
                  </div>
                </div>
              )}
              <div className="p-5">
                {!image && (
                  <div className="flex items-center justify-between mb-3">
                    <StatusBadge status={listing.status} large />
                  </div>
                )}
                <p className="text-xs text-amber-500/70 font-bold uppercase tracking-widest mb-1">
                  {land?.title}
                </p>
                <div className="flex items-center gap-1.5 hover:border-white/[0.35] text-xs mb-4">
                  <MapPin size={11} /> {land?.location}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    ["Units for Sale",    listing.units_for_sale],
                    ["Asking Price / Unit", formatNaira(listing.asking_price_kobo)],
                    ["Total Value",       `₦${((listing.asking_price_kobo * listing.units_for_sale) / 100).toLocaleString("en-NG")}`],
                  ].map(([label, val]) => (
                    <div key={label} className="rounded-xl bg-white/5 border border-white/5 px-3 py-2.5 text-center">
                      <p className="text-[10px] text-white/25 uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-bold text-white mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-white/55">
                  <User size={11} />
                  <span>Listed by <span className="text-white/50 font-semibold">{listing.seller?.name}</span></span>
                  {listing.expires_at && (
                    <>
                      <span className="text-white/10">·</span>
                      <Clock size={11} />
                      <span>Expires {new Date(listing.expires_at).toLocaleDateString()}</span>
                    </>
                  )}
                </div>

                {listing.description && (
                  <p className="text-sm text-white/45 mt-4 pt-4 border-t border-white/5 leading-relaxed">
                    {listing.description}
                  </p>
                )}

                {/* Seller controls */}
                {isSeller && isActive && (
                  <button
                    onClick={async () => {
                      if (!confirm("Cancel this listing?")) return;
                      try {
                        await api.delete(`/marketplace/${listing.id}`);
                        toast.success("Listing cancelled");
                        router.push("/marketplace");
                      } catch { toast.error("Failed to cancel"); }
                    }}
                    className="mt-4 w-full py-2.5 rounded-xl border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-all">
                    Cancel Listing
                  </button>
                )}
              </div>
            </div>

            {/* Seller: incoming offers */}
            {isSeller && (
              <Panel title="Incoming Offers" icon={<Tag size={14} />}>
                <OffersList listing={listing} onUpdate={refresh} />
              </Panel>
            )}

            {/* Escrow panel */}
            {escrow && (
              <Panel title="Escrow & Payment" icon={<ShieldCheck size={14} />}>
                <EscrowPanel escrow={escrow} currentUser={currentUser} onUpdate={refresh} />
              </Panel>
            )}

            {/* Chat — inline below property card for natural flow */}
            {canChat && (
              <Panel title="Negotiation Chat" icon={<MessageSquare size={14} />}>
                <ChatPanel listing={listing} currentUser={currentUser} />
              </Panel>
            )}
          </div>

          {/* ── Right column ──────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Make an offer */}
            {canOffer && !escrow && (
              <Panel title="Make an Offer" icon={<TrendingUp size={14} />}>
                <OfferForm listing={listing} onSuccess={refresh} />
              </Panel>
            )}

            {/* Buyer: your offer status */}
            {!isSeller && listing.pending_offers?.some((o) => o.buyer_id === currentUser?.id) && (
              <Panel title="Your Offer" icon={<CheckCircle size={14} />} defaultOpen>
                {listing.pending_offers
                  .filter((o) => o.buyer_id === currentUser?.id)
                  .map((offer) => (
                    <div key={offer.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">
                            {offer.units} units @ {formatNaira(offer.offer_price_kobo)}
                          </p>
                          <p className="text-xs hover:border-white/[0.35] mt-0.5">
                            Total: ₦{((offer.offer_price_kobo * offer.units) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <StatusBadge status={offer.status} />
                      </div>
                      {offer.status === "pending" && (
                        <button
                          onClick={async () => {
                            try {
                              await api.patch(`/marketplace/${listing.id}/offers/${offer.id}/withdraw`);
                              toast.success("Offer withdrawn");
                              refresh();
                            } catch { toast.error("Failed to withdraw"); }
                          }}
                          className="w-full py-2 rounded-lg border border-white/10 text-white/60 text-xs font-bold hover:bg-white/5 transition-all">
                          Withdraw Offer
                        </button>
                      )}
                    </div>
                  ))}
              </Panel>
            )}

            {/* Not logged in */}
            {!currentUser && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <Lock size={24} className="text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/60 mb-4">
                  Sign in to make offers and chat with the seller
                </p>
                <Link href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[#0D1F1A] text-sm transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
                  Sign In
                </Link>
              </div>
            )}

            {/* Platform info */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">How It Works</p>
              {[
                [TrendingUp,   "Make an offer at your price"],
                [CheckCircle,  "Seller accepts → escrow created"],
                [Wallet,       "Pay from wallet — funds held in escrow"],
                [ShieldCheck,  "Units transfer automatically on payment"],
                [RefreshCw,    "Raise a dispute if something goes wrong"],
              ].map(([Icon, text]) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon size={12} className="text-amber-500/60 shrink-0" />
                  <p className="text-xs hover:border-white/[0.35]">{text}</p>
                </div>
              ))}
              <p className="text-[10px] text-white/20 border-t border-white/5 pt-3">
                1% platform fee deducted from seller proceeds on completion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}