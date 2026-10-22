"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AxiosError } from "axios";
import toast from "react-hot-toast";
import { Gift, X } from "lucide-react";
import {
  getGiftableLands,
  giftUnits,
  type GiftableLand,
  type GiftUnitsResponse,
} from "../../../services/adminService";
import handleApiError from "../../../utils/handleApiError";
import { formatNaira, unitsValueKobo } from "../../../utils/currency";
import { useConfirm } from "../../../stores/useUIStore";

interface Props {
  user: { id: string | number; name: string; email: string };
  onClose: () => void;
  onSuccess: (result: GiftUnitsResponse) => void;
}

const REASON_MIN = 5;
const REASON_MAX = 500;

export default function GiftUnitsModal({ user, onClose, onSuccess }: Props) {
  const confirm = useConfirm();

  const [lands, setLands]         = useState<GiftableLand[]>([]);
  const [landsLoading, setLandsLoading] = useState(true);
  const [landId, setLandId]       = useState("");
  const [units, setUnits]         = useState("");
  const [reason, setReason]       = useState("");
  const [submitting, setSubmitting] = useState(false);

  // One key per gift attempt. Reused only when a retry follows a network
  // error / 5xx (outcome unknown). Reset on any edit and after any 4xx,
  // because the backend caches 4xx responses under the key.
  const idempotencyKey = useRef<string | null>(null);
  const resetKey = () => { idempotencyKey.current = null; };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getGiftableLands();
        if (!cancelled) setLands(list);
      } catch {
        if (!cancelled) toast.error("Failed to load properties");
      } finally {
        if (!cancelled) setLandsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const land = useMemo(
    () => lands.find((l) => String(l.id) === landId),
    [lands, landId]
  );

  const unitsNum = Number(units);
  const available = land ? Number(land.available_units) : 0;

  const error: string | null = (() => {
    if (!land) return null;
    if (units === "") return null;
    if (!Number.isInteger(unitsNum) || unitsNum < 1) return "Enter a whole number of units (1 or more).";
    if (unitsNum > available) return `Only ${available} unit(s) available.`;
    return null;
  })();

  const pricePerUnit = Number(land?.current_price_per_unit_kobo ?? 0);
  const hasValidUnits = !!land && units !== "" && !error && Number.isInteger(unitsNum) && unitsNum >= 1;
  const giftValueKobo = hasValidUnits ? unitsValueKobo(unitsNum, pricePerUnit) : 0;

  const reasonTrimmed = reason.trim();
  const canSubmit =
    !!land &&
    units !== "" &&
    !error &&
    reasonTrimmed.length >= REASON_MIN &&
    reasonTrimmed.length <= REASON_MAX &&
    !submitting;

  const handleSubmit = async () => {
    if (!land || !canSubmit) return;

    const ok = await confirm({
      message: `Gift ${unitsNum} unit(s) of ${land.title}${pricePerUnit > 0 ? ` (worth ${formatNaira(giftValueKobo)})` : ""} to ${user.name}? This is free value from platform inventory.`,
      confirmLabel: "Gift units",
    });
    if (!ok) return;

    if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();

    setSubmitting(true);
    try {
      const result = await giftUnits(
        user.id,
        { land_id: land.id, units: unitsNum, reason: reasonTrimmed },
        idempotencyKey.current
      );
      resetKey();
      onSuccess(result);
    } catch (err) {
      const status = (err as AxiosError).response?.status;
      // A definitive server decision (4xx) is cached under this key — the
      // next attempt must use a fresh one. No response / 5xx keeps the key
      // so a retry can't double-gift if the first attempt actually landed.
      if (status !== undefined && status < 500) resetKey();

      try {
        handleApiError(err as AxiosError, "Failed to gift units");
      } catch {
        toast.error("Network error — the gift may or may not have gone through. Retrying is safe.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ zIndex: 60 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Gift units to ${user.name}`}
    >
      <div className="relative w-full sm:max-w-md max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0f2820] shadow-2xl">
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-amber-400 shrink-0" />
              <h2
                className="text-lg font-bold text-white"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
              >
                Gift Units
              </h2>
            </div>
            <p className="text-white/60 text-xs mt-0.5 truncate">
              To {user.name} · {user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all shrink-0 disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/55 mb-2">
              Property
            </label>
            {landsLoading ? (
              <div className="flex items-center gap-2 text-xs text-white/50 py-2">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                Loading properties…
              </div>
            ) : lands.length === 0 ? (
              <p className="text-xs text-white/50 bg-white/5 border border-white/5 rounded-xl p-3">
                No properties have units available to gift.
              </p>
            ) : (
              <select
                value={landId}
                onChange={(e) => { setLandId(e.target.value); resetKey(); }}
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-500/40"
              >
                <option value="" className="bg-[#0f2820]">Select a property…</option>
                {lands.map((l) => (
                  <option key={l.id} value={String(l.id)} className="bg-[#0f2820]">
                    {l.title} — {Number(l.available_units).toLocaleString()} available
                    {Number(l.current_price_per_unit_kobo) > 0 ? ` · ${formatNaira(l.current_price_per_unit_kobo!)}/unit` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/55 mb-2">
              Units
            </label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={available || undefined}
              step={1}
              value={units}
              disabled={!land}
              onChange={(e) => { setUnits(e.target.value); resetKey(); }}
              placeholder={land ? `1 – ${available}` : "Select a property first"}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder-white/20 px-3 py-2.5 rounded-xl text-sm outline-none transition-all disabled:opacity-50"
            />
            {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
          </div>

          {land && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-white/55">Value of gift</p>
                <p className="text-[11px] text-white/45 mt-0.5">
                  {pricePerUnit > 0
                    ? `${hasValidUnits ? unitsNum.toLocaleString() : "—"} × ${formatNaira(pricePerUnit)} per unit (current price)`
                    : "No price set for this property"}
                </p>
              </div>
              <p className="text-base font-bold text-white tabular-nums shrink-0">
                {pricePerUnit > 0 && hasValidUnits ? formatNaira(giftValueKobo) : "—"}
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/55">
                Reason
              </label>
              <span className="text-[10px] text-white/40 tabular-nums">
                {reasonTrimmed.length}/{REASON_MAX}
              </span>
            </div>
            <textarea
              value={reason}
              maxLength={REASON_MAX}
              rows={3}
              onChange={(e) => { setReason(e.target.value); resetKey(); }}
              placeholder="Why is this gift being made? (kept in the audit log)"
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/20 text-white placeholder-white/20 px-3 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
            />
            {reasonTrimmed.length > 0 && reasonTrimmed.length < REASON_MIN && (
              <p className="text-xs text-white/40 mt-1.5">At least {REASON_MIN} characters.</p>
            )}
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80 leading-relaxed">
            Units are taken from unsold platform inventory and credited at no cost.
            No wallet balance moves, and the user gets a notification and an updated certificate.
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-white/70 border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white border border-amber-500/30 bg-amber-500/15 hover:bg-amber-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Gift size={15} />
              )}
              Gift units
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
