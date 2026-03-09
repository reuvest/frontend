"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Camera, CreditCard, MapPin, User, XCircle } from "lucide-react";
import { inputCls, selectCls, stepAnim, ID_TYPES, NIGERIAN_STATES, formatDateDisplay } from "./constants";
import DobInput      from "./DobInput";
import FileDropZone  from "./FileDropZone";
import LivenessCheck from "./LivenessCheck";
import { Field, ReviewRow } from "./FormComponents";

export default function KycSteps({
  step,
  form,
  errors,
  submitError,
  setField,
  setFile,
  handleIdTypeChange,
  handleIdNumberChange,
  selectedIdMeta,
  idTypeLabel,
}) {
  return (
    <AnimatePresence mode="wait">

      {/* ── Step 0: Personal ── */}
      {step === 0 && (
        <motion.div key="s0" {...stepAnim} className="space-y-5">
          <Field label="Full Legal Name" required error={errors.full_name}>
            <input
              className={inputCls}
              placeholder="As appears on your ID"
              autoComplete="name"
              autoCapitalize="words"
              value={form.full_name}
              onChange={e => setField("full_name", e.target.value)}
            />
          </Field>

          <Field label="Date of Birth" required error={errors.date_of_birth}>
            <DobInput value={form.date_of_birth} onChange={v => setField("date_of_birth", v)} />
          </Field>

          <Field label="Phone Number" required error={errors.phone_number}>
            <div className="flex items-stretch rounded-xl overflow-hidden border border-white/10 focus-within:border-amber-500/50 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all bg-white/5">
              <div className="flex items-center gap-2 px-3.5 bg-white/5 border-r border-white/10 shrink-0 select-none pointer-events-none">
                <span className="text-base leading-none">🇳🇬</span>
                <span className="text-white/60 font-bold text-sm">+234</span>
              </div>
              <input
                className="flex-1 bg-transparent text-white placeholder-white/20 px-3.5 py-3.5 text-sm focus:outline-none min-w-0"
                placeholder="800 000 0000"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={11}
                value={form.phone_number}
                onChange={e => setField("phone_number", e.target.value.replace(/\D/g, "").replace(/^0+/, ""))}
              />
            </div>
          </Field>
        </motion.div>
      )}

      {/* ── Step 1: Address ── */}
      {step === 1 && (
        <motion.div key="s1" {...stepAnim} className="space-y-5">
          <Field label="Street Address" required error={errors.address}>
            <textarea
              className={inputCls + " resize-none"}
              style={{ height: "88px" }}
              placeholder="House number, street name, landmark"
              autoComplete="street-address"
              value={form.address}
              onChange={e => setField("address", e.target.value)}
            />
          </Field>

          <Field label="City" required error={errors.city}>
            <input
              className={inputCls}
              placeholder="e.g. Lagos"
              value={form.city}
              onChange={e => setField("city", e.target.value)}
            />
          </Field>

          <Field label="State" required error={errors.state}>
            <select
              className={selectCls}
              value={form.state}
              onChange={e => setField("state", e.target.value)}
            >
              <option value="" className="bg-[#0D1F1A]">Select state</option>
              {NIGERIAN_STATES.map(s => (
                <option key={s} value={s} className="bg-[#0D1F1A]">{s}</option>
              ))}
            </select>
          </Field>

          <Field label="Country">
            <input className={inputCls + " opacity-40 cursor-not-allowed"} value={form.country} readOnly />
          </Field>
        </motion.div>
      )}

      {/* ── Step 2: Identity document ── */}
      {step === 2 && (
        <motion.div key="s2" {...stepAnim} className="space-y-5">
          <Field label="Document Type" required error={errors.id_type}>
            <select
              className={selectCls}
              value={form.id_type}
              onChange={e => handleIdTypeChange(e.target.value)}
            >
              <option value="" className="bg-[#0D1F1A]">Select document type</option>
              {ID_TYPES.map(t => (
                <option key={t.value} value={t.value} className="bg-[#0D1F1A]">{t.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Document Number" required error={errors.id_number}>
            <div className="relative">
              <input
                className={inputCls}
                placeholder={selectedIdMeta?.numericOnly ? `${selectedIdMeta.maxLen}-digit number` : "Enter your document number"}
                inputMode={selectedIdMeta?.numericOnly ? "numeric" : "text"}
                maxLength={selectedIdMeta?.maxLen}
                value={form.id_number}
                onChange={handleIdNumberChange}
                style={{ paddingRight: selectedIdMeta?.numericOnly && form.id_number ? "4.5rem" : undefined }}
              />
              {selectedIdMeta?.numericOnly && form.id_number.length > 0 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-white/25 pointer-events-none tabular-nums">
                  {form.id_number.length}/{selectedIdMeta.maxLen}
                </span>
              )}
            </div>
          </Field>

          {form.id_type && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
              <AlertCircle size={13} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-amber-400/70 text-xs leading-relaxed">
                Ensure the number matches exactly what is printed on your {idTypeLabel.toLowerCase()}.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Step 3: Document upload (skipped for BVN) ── */}
      {step === 3 && form.id_type !== "bvn" && (
        <motion.div key="s3" {...stepAnim} className="space-y-5">
          <FileDropZone
            label="ID Front"
            required
            sublabel="Clear photo of the front of your document"
            name="id_front"
            value={form.id_front}
            onChange={setFile}
          />
          {errors.id_front && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <AlertCircle size={11} />{errors.id_front}
            </p>
          )}
          <FileDropZone
            label="ID Back"
            sublabel="Back of your document (if applicable)"
            name="id_back"
            value={form.id_back}
            onChange={setFile}
          />
        </motion.div>
      )}

      {/* ── Step 4: Liveness ── */}
      {step === 4 && (
        <motion.div key="s4" {...stepAnim}>
          <LivenessCheck
            captured={form.selfie}
            onCapture={f => setFile("selfie", f)}
            onRetake={() => setFile("selfie", null)}
            fullHeight
          />
          {errors.selfie && (
            <p className="text-red-400 text-xs mt-3 flex items-center gap-1">
              <AlertCircle size={11} />{errors.selfie}
            </p>
          )}
        </motion.div>
      )}

      {/* ── Step 5: Review ── */}
      {step === 5 && (
        <motion.div key="s5" {...stepAnim} className="space-y-4">
          {[
            {
              heading: "Personal",
              icon: <User size={12} />,
              rows: [
                ["Full Name",     form.full_name],
                ["Date of Birth", formatDateDisplay(form.date_of_birth)],
                ["Phone",         form.phone_number ? `+234 ${form.phone_number}` : ""],
              ],
            },
            {
              heading: "Address",
              icon: <MapPin size={12} />,
              rows: [
                ["Street",  form.address],
                ["City",    form.city],
                ["State",   form.state],
                ["Country", form.country],
              ],
            },
            {
              heading: "Identity",
              icon: <CreditCard size={12} />,
              rows: [
                ["Document Type",   idTypeLabel],
                ["Document Number", form.id_number],
              ],
            },
            {
              heading: "Documents",
              icon: <Camera size={12} />,
              rows: [
                ["ID Front",       form.id_front?.name],
                ["ID Back",        form.id_back?.name || "Not provided"],
                ["Liveness Photo", form.selfie ? "✓ Captured" : "—"],
              ],
            },
          ].map(({ heading, icon, rows }) => (
            <div key={heading} className="rounded-xl border border-white/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/5">
                <span className="text-amber-500">{icon}</span>
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest">{heading}</p>
              </div>
              <div className="px-4 divide-y divide-white/[0.03]">
                {rows.map(([l, v]) => <ReviewRow key={l} label={l} value={v} />)}
              </div>
            </div>
          ))}

          {submitError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5">
              <XCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-400 text-sm">{submitError}</p>
            </div>
          )}

          <p className="text-white/20 text-xs leading-relaxed">
            By submitting, you confirm all information is accurate and documents belong to you.
          </p>
        </motion.div>
      )}

    </AnimatePresence>
  );
}