"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function ProfileSettings() {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const passwordChecks = [
    { test: /.{8,}/, label: "At least 8 characters" },
    { test: /[A-Z]/, label: "One uppercase letter" },
    { test: /[a-z]/, label: "One lowercase letter" },
    { test: /\d/, label: "One number" },
    { test: /[!@#$%^&*]/, label: "One special character" },
  ];

  const passedChecks = passwordChecks.filter((c) => c.test.test(formData.newPassword)).length;
  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];
  const strengthText = ["Too weak", "Weak", "Fair", "Good", "Strong"];

  const passwordsMatch = formData.newPassword && formData.confirmPassword && formData.newPassword === formData.confirmPassword;
  const passwordsDontMatch = formData.confirmPassword && !passwordsMatch;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) return (setError("Passwords do not match"), toast.error("Passwords do not match"));
    if (passedChecks < passwordChecks.length) return (setError("Please meet all password requirements"), toast.error("Please meet all password requirements"));

    setLoading(true);
    setError("");
    try {
      await api.post("/user/change-password", {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        new_password_confirmation: formData.confirmPassword,
      });
      toast.success("Password changed successfully!");
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to change password";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Profile Info */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <User size={14} className="text-amber-500" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Profile Information</h3>
        </div>

        <div className="space-y-4">
          <Field label="Full Name">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <input
                type="text" value={user?.name || ""} disabled
                className="w-full bg-white/[0.03] border border-white/[0.08] text-white/40 pl-10 pr-4 py-3 rounded-xl text-sm cursor-not-allowed"
              />
            </div>
          </Field>

          <Field label="Email Address">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
              <input
                type="email" value={user?.email || ""} disabled
                className="w-full bg-white/[0.03] border border-white/[0.08] text-white/40 pl-10 pr-4 py-3 rounded-xl text-sm cursor-not-allowed"
              />
            </div>
            {user?.email_verified_at && (
              <div className="flex items-center gap-1.5 mt-1.5 text-emerald-400 text-xs">
                <CheckCircle size={12} /> Verified
              </div>
            )}
          </Field>
        </div>
      </section>

      <div className="border-t border-white/10" />

      {/* Change Password */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Shield size={14} className="text-amber-500" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Change Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">

          {/* Current Password */}
          <Field label="Current Password">
            <PasswordInput
              id="currentPassword" name="currentPassword"
              value={formData.currentPassword} onChange={handleChange}
              show={showCurrentPassword} onToggle={() => setShowCurrentPassword((v) => !v)}
              placeholder="Enter current password"
            />
          </Field>

          {/* New Password */}
          <Field label="New Password">
            <PasswordInput
              id="newPassword" name="newPassword"
              value={formData.newPassword} onChange={handleChange}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              show={showNewPassword} onToggle={() => setShowNewPassword((v) => !v)}
              placeholder="Enter new password"
            />

            {/* Strength bar */}
            {formData.newPassword && (
              <div className="mt-2.5">
                <div className="flex gap-1 mb-1.5">
                  {passwordChecks.map((_, i) => (
                    <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                      style={{ background: i < passedChecks ? strengthColors[passedChecks - 1] : "rgba(255,255,255,0.08)" }} />
                  ))}
                </div>
                <p className="text-xs" style={{ color: passedChecks > 0 ? strengthColors[passedChecks - 1] : "rgba(255,255,255,0.2)" }}>
                  {strengthText[passedChecks - 1] || "Enter a password"}
                </p>
              </div>
            )}

            <AnimatePresence>
              {formData.newPassword && focused && (
                <motion.ul className="mt-3 space-y-1.5 bg-white/5 border border-white/10 rounded-xl p-3"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                  {passwordChecks.map((check, i) => {
                    const passed = check.test.test(formData.newPassword);
                    return (
                      <li key={i} className={`flex items-center gap-2 text-xs transition-colors ${passed ? "text-emerald-400" : "text-white/25"}`}>
                        <span>{passed ? "✓" : "○"}</span>
                        <span>{check.label}</span>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </Field>

          {/* Confirm Password */}
          <Field label="Confirm New Password">
            <div className="relative">
              <PasswordInput
                id="confirmPassword" name="confirmPassword"
                value={formData.confirmPassword} onChange={handleChange}
                show={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)}
                placeholder="Confirm new password"
                error={passwordsDontMatch}
              />
              {passwordsMatch && (
                <CheckCircle size={14} className="absolute right-11 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
              )}
            </div>
            {passwordsDontMatch && <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>}
          </Field>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button type="submit"
            disabled={loading || !!passwordsDontMatch || passedChecks < passwordChecks.length}
            className="w-full py-3.5 rounded-xl font-bold text-[#0D1F1A] flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#0D1F1A]/40 border-t-[#0D1F1A] rounded-full animate-spin" />
                Updating...
              </span>
            ) : (
              <><Lock size={14} /> Update Password</>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}

/* ── Sub-components ── */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">{label}</label>
      {children}
    </div>
  );
}

function PasswordInput({ id, name, value, onChange, show, onToggle, placeholder, onFocus, onBlur, error }) {
  return (
    <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
      <input
        id={id} name={name} type={show ? "text" : "password"}
        value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur}
        placeholder={placeholder} autoComplete="new-password"
        className={`w-full bg-white/5 border text-white placeholder-white/20 pl-11 pr-11 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all ${
          error ? "border-red-500/40" : "border-white/10 hover:border-white/20"
        }`}
      />
      <button type="button" onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}