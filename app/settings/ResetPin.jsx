"use client";

import { useState, useEffect } from "react";
import api from "../../utils/api";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import PinInput from "../components/PinInput";
import { Mail, CheckCircle } from "lucide-react";

export default function ResetPin() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [confirmPin, setConfirmPin] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const email = user?.email;

  useEffect(() => {
    if (!email) toast.error("User email not found. Please log in again.");
  }, [email]);

  // Step 1 — request reset code via email
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/pin/forgot", { email });
      toast.success("Reset code sent to your email.");
      setStep(2);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to send code."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify the 6-digit code; capture the returned reset_token
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await api.post("/pin/verify-code", { email, code });
      setResetToken(res.data.reset_token); // ← capture single-use token
      toast.success("Code verified! Enter your new PIN.");
      setStep(3);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Invalid code."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — set new PIN
  const handleResetPin = async (e) => {
    e.preventDefault();
    const newPin = pin.join("");
    const confirm = confirmPin.join("");
    if (newPin.length !== 4) return toast.error("PIN must be exactly 4 digits.");
    if (newPin !== confirm) return toast.error("PINs do not match.");

    setLoading(true);
    try {
      await api.post("/pin/reset", {
        reset_token: resetToken, 
        new_pin: newPin,
        pin_confirmation: confirm,
      });
      toast.success("Transaction PIN reset successfully!");
      // Reset all state back to step 1
      setStep(1);
      setCode("");
      setResetToken("");
      setPin(["", "", "", ""]);
      setConfirmPin(["", "", "", ""]);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Reset failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Request Code", "Verify Code", "New PIN"];

  return (
    <div className="space-y-6">

      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => {
          const idx = i + 1;
          const done = step > idx;
          const active = step === idx;
          return (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done
                      ? "text-[#0D1F1A]"
                      : active
                      ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                      : "bg-white/5 border border-white/10 text-white/20"
                  }`}
                  style={
                    done
                      ? { background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }
                      : {}
                  }
                >
                  {done ? <CheckCircle size={12} /> : idx}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:block ${
                    active ? "text-amber-400" : done ? "text-white/40" : "text-white/20"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px mx-1 bg-white/[0.01]0">
                  {done && (
                    <div
                      className="h-full"
                      style={{ background: "linear-gradient(90deg, #C8873A, #E8A850)" }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: Send code */}
      {step === 1 && (
        <form onSubmit={handleSendCode} className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <Mail size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-white/50 leading-relaxed">
              A reset code will be sent to{" "}
              <span className="text-white/80 font-semibold">{email}</span>
            </p>
          </div>
          <SubmitButton loading={loading} label="Send Reset Code" />
        </form>
      )}

      {/* Step 2: Verify code */}
      {step === 2 && (
        <form onSubmit={handleVerifyCode} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code sent to your email"
              required
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 px-4 py-3 rounded-xl text-sm outline-none transition-all tracking-widest text-center"
            />
          </div>
          <SubmitButton loading={loading} label="Verify Code" />
        </form>
      )}

      {/* Step 3: New PIN */}
      {step === 3 && (
        <form onSubmit={handleResetPin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
              New PIN
            </label>
            <PinInput
              value={pin}
              onChange={setPin}
              touched={pin.some((d) => d !== "")}
              dark
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
              Confirm New PIN
            </label>
            <PinInput
              value={confirmPin}
              onChange={setConfirmPin}
              touched={confirmPin.some((d) => d !== "")}
              dark
            />
          </div>
          <SubmitButton loading={loading} label="Reset PIN" />
        </form>
      )}
    </div>
  );
}

function SubmitButton({ loading, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3.5 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-[#0D1F1A]/40 border-t-[#0D1F1A] rounded-full animate-spin" />
          Processing...
        </span>
      ) : (
        label
      )}
    </button>
  );
}