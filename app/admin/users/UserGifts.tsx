"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { Gift, Undo2, X } from "lucide-react";
import {
  getUserGifts,
  reverseGift,
  type UserGift,
} from "../../../services/adminService";
import handleApiError from "../../../utils/handleApiError";
import { formatNaira } from "../../../utils/currency";

interface Props {
  userId: string | number;
  /** Bump to reload the list (e.g. after a new gift is made). */
  refreshKey: number;
  /** Called after a successful reversal so the parent can refresh balances/units. */
  onReversed: () => void;
}

const REASON_MIN = 5;
const REASON_MAX = 500;

const fmtWhen = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function UserGifts({ userId, refreshKey, onReversed }: Props) {
  const [gifts, setGifts]     = useState<UserGift[]>([]);
  const [loading, setLoading] = useState(true);

  const [target, setTarget]       = useState<UserGift | null>(null);
  const [reason, setReason]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Same idempotency policy as GiftUnitsModal: reuse the key only after a
  // network error / 5xx; fresh key after any 4xx (the backend caches those)
  // or any edit.
  const idempotencyKey = useRef<string | null>(null);

  const load = useCallback(async () => {
    try {
      setGifts(await getUserGifts(userId));
    } catch {
      toast.error("Failed to load gifts");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshKey]);

  const close = () => {
    if (submitting) return;
    setTarget(null);
    setReason("");
    idempotencyKey.current = null;
  };

  const reasonTrimmed = reason.trim();
  const canSubmit = reasonTrimmed.length >= REASON_MIN && !submitting;

  const submit = async () => {
    if (!target || !canSubmit) return;
    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();

    setSubmitting(true);
    try {
      const res = await reverseGift(userId, target.reference, reasonTrimmed, idempotencyKey.current);
      toast.success(res.message || "Gift reversed");
      idempotencyKey.current = null;
      setTarget(null);
      setReason("");
      await load();
      onReversed();
    } catch (err) {
      const status = (err as AxiosError).response?.status;
      if (status !== undefined && status < 500) idempotencyKey.current = null;

      try {
        handleApiError(err as AxiosError, "Failed to reverse gift");
      } catch {
        toast.error("Network error — the reversal may or may not have gone through. Retrying is safe.");
      }
      // A 422 may mean it was already reversed — keep the list truthful.
      if (status === 422) load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pt-1">
      <p className="text-xs font-bold uppercase tracking-widest text-white/55">Gifted Units</p>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : gifts.length === 0 ? (
        <p className="text-xs text-white/50 bg-white/5 border border-white/5 rounded-xl p-3">
          No gifts have been made to this user.
        </p>
      ) : (
        <div className="space-y-2">
          {gifts.map((g) => (
            <div
              key={g.reference}
              className="flex items-start justify-between gap-3 bg-white/5 border border-white/5 rounded-xl p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Gift size={13} className="text-amber-400 shrink-0" />
                  <p className="text-sm font-semibold text-white">
                    {g.units.toLocaleString()} unit(s) · {g.land_title ?? "Property"}
                  </p>
                  {g.value_kobo > 0 && (
                    <span className="text-[11px] font-semibold text-amber-300 tabular-nums">
                      {formatNaira(g.value_kobo)}
                    </span>
                  )}
                  {g.reversed && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 bg-white/10 rounded-full px-2 py-0.5">
                      Reversed
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-white/50 mt-1 break-words">
                  {fmtWhen(g.gifted_at)}{g.reason ? ` · ${g.reason}` : ""}
                </p>
              </div>

              {!g.reversed && (
                <button
                  onClick={() => { setTarget(g); setReason(""); idempotencyKey.current = null; }}
                  className="shrink-0 flex items-center gap-1.5 text-[11px] font-bold text-orange-300 border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg px-2.5 py-1.5 transition-all"
                >
                  <Undo2 size={12} /> Reverse
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {target && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ zIndex: 70 }}
          role="dialog"
          aria-modal="true"
          aria-label="Reverse gift"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0f2820] shadow-2xl">
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-white/10">
              <div className="min-w-0 flex-1 pr-3">
                <h3 className="text-base font-bold text-white">Reverse gift</h3>
                <p className="text-white/60 text-xs mt-0.5">
                  Return {target.units.toLocaleString()} unit(s) of {target.land_title ?? "this property"}
                  {target.value_kobo > 0 ? ` (${formatNaira(target.value_kobo)} at current price)` : ""} to platform inventory.
                </p>
              </div>
              <button
                onClick={close}
                disabled={submitting}
                aria-label="Close"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all shrink-0 disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-xs text-orange-200/80 leading-relaxed">
                Only possible while the user still holds these units and hasn&apos;t listed them on the marketplace.
                The user is notified and their certificate is updated.
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/55">Reason</label>
                  <span className="text-[10px] text-white/40 tabular-nums">{reasonTrimmed.length}/{REASON_MAX}</span>
                </div>
                <textarea
                  value={reason}
                  maxLength={REASON_MAX}
                  rows={3}
                  onChange={(e) => { setReason(e.target.value); idempotencyKey.current = null; }}
                  placeholder="Why is this gift being reversed? (kept in the audit log)"
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder-white/20 px-3 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={close}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white/70 border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submit}
                  disabled={!canSubmit}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white border border-orange-500/30 bg-orange-500/15 hover:bg-orange-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Undo2 size={15} />
                  )}
                  Reverse gift
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
