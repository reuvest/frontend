"use client";

import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import type { AxiosError } from "axios";
import { getAccountStatus, setTransactionPin, updateTransactionPin } from "../../services/pinService";
import { getMe } from "../../services/userService";
import toast from "react-hot-toast";
import PinInput from "../components/PinInput";
import { KeyRound, AlertCircle } from "lucide-react";

interface ApiErrorBody {
  message?: string;
  error?: string;
}

interface TouchedState {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

interface TransactionPinProps {
  /** Notifies the parent so nav-indicator state (e.g. the settings sidebar's
      "PIN not set" dot) updates immediately instead of waiting for a
      page reload. Was previously passed by app/settings/page.jsx but never
      declared or called here — a real pre-existing bug caught while typing
      this file; wired up properly rather than typed around. */
  onPinSet?: () => void;
}

export default function TransactionPin({ onPinSet }: TransactionPinProps = {}) {
  const [hasPin, setHasPin]         = useState(false);
  const [currentPin, setCurrentPin] = useState(["", "", "", ""]);
  const [newPin, setNewPin]         = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [touched, setTouched]       = useState<TouchedState>({ current: false, new: false, confirm: false });
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    (async () => {
      try {
        // /account-status is the lightest call — use it first
        const status = await getAccountStatus();
        setHasPin(!!status.pin_is_set);
      } catch {
        // Fallback to /me if account-status isn't available
        try {
          const u = await getMe();
          setHasPin(!!u.pin_is_set);
        } catch {}
      }
    })();
  }, []);

  const pinToString = (arr: string[]) => arr.join("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const newPinStr     = pinToString(newPin);
    const confirmPinStr = pinToString(confirmPin);
    const currentPinStr = pinToString(currentPin);

    if (newPinStr.length !== 4) {
      const msg = "New PIN must contain exactly 4 digits.";
      setError(msg); toast.error(msg); return;
    }
    if (confirmPinStr.length !== 4) {
      const msg = "Please confirm your new PIN.";
      setError(msg); toast.error(msg); return;
    }
    if (newPinStr !== confirmPinStr) {
      const msg = "New PIN and confirmation do not match.";
      setError(msg); toast.error(msg); return;
    }
    if (hasPin && currentPinStr.length !== 4) {
      const msg = "Please enter your current PIN.";
      setError(msg); toast.error(msg); return;
    }

    setLoading(true);
    try {
      if (hasPin) {
        await updateTransactionPin(currentPinStr, newPinStr, confirmPinStr);
        toast.success("Transaction PIN updated successfully");
      } else {
        await setTransactionPin(newPinStr, confirmPinStr);
        toast.success("Transaction PIN set successfully");
        setHasPin(true);
        onPinSet?.();
      }

      // Reset all fields
      setCurrentPin(["", "", "", ""]);
      setNewPin(["", "", "", ""]);
      setConfirmPin(["", "", "", ""]);
      setTouched({ current: false, new: false, confirm: false });
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorBody>;
      const msg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error   ||
        "Failed to update PIN. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <KeyRound size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-white/60 leading-relaxed">
          {hasPin
            ? "Enter your current PIN to set a new one. Your PIN is used to authorise all transactions."
            : "Set a 4-digit PIN to secure your transactions. You'll need it every time you buy or sell."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {hasPin && (
          <PinField label="Current PIN">
            {/* `dark` dropped — PinInput.tsx has no such prop; was a
                silently-ignored no-op even before typing (see ResetPin.tsx
                for the fuller note). */}
            <PinInput
              value={currentPin} onChange={setCurrentPin}
              touched={touched.current}
              setTouched={() => setTouched((p) => ({ ...p, current: true }))}
            />
          </PinField>
        )}

        <PinField label="New PIN">
          <PinInput
            value={newPin} onChange={setNewPin}
            touched={touched.new}
            setTouched={() => setTouched((p) => ({ ...p, new: true }))}
          />
        </PinField>

        <PinField label="Confirm New PIN">
          <PinInput
            value={confirmPin} onChange={setConfirmPin}
            touched={touched.confirm}
            setTouched={() => setTouched((p) => ({ ...p, confirm: true }))}
          />
        </PinField>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-red-400 text-sm">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[#0D1F1A]/40 border-t-[#0D1F1A] rounded-full animate-spin" />
              Processing...
            </span>
          ) : hasPin ? "Update PIN" : "Set PIN"}
        </button>
      </form>
    </div>
  );
}

interface PinFieldProps {
  label: string;
  children: ReactNode;
}

function PinField({ label, children }: PinFieldProps) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-white/55 mb-3">
        {label}
      </label>
      {children}
    </div>
  );
}