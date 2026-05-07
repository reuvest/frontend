"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Camera, CreditCard, MapPin, Shield, User, XCircle } from "lucide-react";
import { inputCls, selectCls, stepAnim, ID_TYPES, NIGERIAN_STATES, formatDateDisplay } from "./constants";
import DobInput      from "./DobInput";
import FileDropZone  from "./FileDropZone";
import LivenessCheck from "./LivenessCheck";
import { Field, ReviewRow } from "./FormComponents";

const PEP_RELATIONSHIPS = [
  { value: "self",      label: "Myself — I currently hold or have held a public position" },
  { value: "family",    label: "A close family member holds or has held a public position" },
  { value: "associate", label: "A close business associate holds or has held a public position" },
];

export default function KycSteps({
  step,
  form,
  errors,
  submitError,
  setField,
  setFile,
  setErrors,
  handleIdTypeChange,
  handleIdNumberChange,
  selectedIdMeta,
  idTypeLabel,
}) {
  const handleFileError = (fieldName, message) => {
    setErrors(prev => ({ ...prev, [fieldName]: message }));
  };

  const handleFileChange = (fieldName, file) => {
    setFile(fieldName, file);
    if (file) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  // When is_pep is toggled off, clear all PEP sub-fields
  const handlePepToggle = (value) => {
    setField("is_pep", value);
    if (!value) {
      setField("pep_relationship", "");
      setField("pep_role", "");
      setField("pep_country", "");
      setField("pep_details", "");
    }
  };

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
            onChange={handleFileChange}
            onError={handleFileError}
          />
          {errors.id_front && (
            <p className="text-red-400 text-xs flex items-center gap-1.5 -mt-2">
              <AlertCircle size={11} className="shrink-0" />{errors.id_front}
            </p>
          )}

          <FileDropZone
            label="ID Back"
            sublabel="Back of your document (if applicable)"
            name="id_back"
            value={form.id_back}
            onChange={handleFileChange}
            onError={handleFileError}
          />
          {errors.id_back && (
            <p className="text-red-400 text-xs flex items-center gap-1.5 -mt-2">
              <AlertCircle size={11} className="shrink-0" />{errors.id_back}
            </p>
          )}
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

      {/* ── Step 5: PEP Declaration ── */}
      {step === 5 && (
        <motion.div key="s5" {...stepAnim} className="space-y-5">

          {/* Info banner */}
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <Shield size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-white/70 text-xs font-semibold">What is a Politically Exposed Person (PEP)?</p>
              <p className="text-white/35 text-xs leading-relaxed">
                A PEP is someone who holds or has held a prominent public position — such as a government official,
                senior executive of a state-owned enterprise, senior military officer, or a close family member
                or associate of such a person. This is a standard regulatory requirement.
              </p>
            </div>
          </div>

          {/* Yes / No toggle */}
          <Field label="Are you, or are you closely associated with, a Politically Exposed Person?" required error={errors.is_pep}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: false, label: "No", sub: "I have no PEP connection" },
                { value: true,  label: "Yes", sub: "I or someone close to me is a PEP" },
              ].map(opt => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => handlePepToggle(opt.value)}
                  className={[
                    "flex flex-col items-start gap-0.5 rounded-xl border px-4 py-3.5 text-left transition-all",
                    form.is_pep === opt.value
                      ? opt.value
                        ? "border-red-500/50 bg-red-500/10 ring-2 ring-red-500/20"
                        : "border-amber-500/50 bg-amber-500/10 ring-2 ring-amber-500/20"
                      : "border-white/10 bg-white/5 hover:border-white/20",
                  ].join(" ")}
                >
                  <span className={[
                    "text-sm font-bold",
                    form.is_pep === opt.value
                      ? opt.value ? "text-red-400" : "text-amber-400"
                      : "text-white/60",
                  ].join(" ")}>
                    {opt.label}
                  </span>
                  <span className="text-white/30 text-xs">{opt.sub}</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Sub-fields — only shown when is_pep is true */}
          <AnimatePresence>
            {form.is_pep === true && (
              <motion.div
                key="pep-fields"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* Relationship */}
                <Field label="PEP Relationship" required error={errors.pep_relationship}>
                  <div className="space-y-2.5">
                    {PEP_RELATIONSHIPS.map(opt => (
                      <label
                        key={opt.value}
                        className={[
                          "flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all",
                          form.pep_relationship === opt.value
                            ? "border-amber-500/50 bg-amber-500/10"
                            : "border-white/10 bg-white/5 hover:border-white/20",
                        ].join(" ")}
                      >
                        {/* Custom radio */}
                        <span className={[
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                          form.pep_relationship === opt.value
                            ? "border-amber-500 bg-amber-500"
                            : "border-white/20",
                        ].join(" ")}>
                          {form.pep_relationship === opt.value && (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </span>
                        <input
                          type="radio"
                          className="sr-only"
                          name="pep_relationship"
                          value={opt.value}
                          checked={form.pep_relationship === opt.value}
                          onChange={() => setField("pep_relationship", opt.value)}
                        />
                        <span className="text-white/60 text-xs leading-relaxed">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </Field>

                {/* Role */}
                <Field label="Public Role / Position" required error={errors.pep_role}>
                  <input
                    className={inputCls}
                    placeholder="e.g. Senator, Minister of Finance, Central Bank Governor"
                    value={form.pep_role}
                    onChange={e => setField("pep_role", e.target.value)}
                  />
                </Field>

                {/* Country */}
                <Field label="Country of Public Role" required error={errors.pep_country}>
                  <input
                    className={inputCls}
                    placeholder="2-letter country code e.g. NG, US, GB"
                    maxLength={2}
                    value={form.pep_country}
                    onChange={e => setField("pep_country", e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                  />
                </Field>

                {/* Details */}
                <Field label="Additional Details" required error={errors.pep_details}>
                  <textarea
                    className={inputCls + " resize-none"}
                    style={{ height: "96px" }}
                    placeholder="Briefly describe the public role and any relevant context"
                    maxLength={500}
                    value={form.pep_details}
                    onChange={e => setField("pep_details", e.target.value)}
                  />
                  <p className="text-right text-white/20 text-xs mt-1 tabular-nums">
                    {(form.pep_details || "").length}/500
                  </p>
                </Field>

                {/* Warning */}
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-3.5">
                  <AlertCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-red-400/70 text-xs leading-relaxed">
                    Your account will be flagged for manual review. This is standard regulatory procedure
                    and does not affect your ability to use the platform.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}

      {/* ── Step 6: Review ── */}
      {step === 6 && (
        <motion.div key="s6" {...stepAnim} className="space-y-4">
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
            {
              heading: "PEP Declaration",
              icon: <Shield size={12} />,
              rows: form.is_pep === true
                ? [
                    ["PEP Status",    "Yes — Politically Exposed"],
                    ["Relationship",  PEP_RELATIONSHIPS.find(r => r.value === form.pep_relationship)?.label ?? form.pep_relationship],
                    ["Role",          form.pep_role],
                    ["Country",       form.pep_country],
                    ["Details",       form.pep_details],
                  ]
                : [
                    ["PEP Status", "No — Not a Politically Exposed Person"],
                  ],
            },
          ].map(({ heading, icon, rows }) => (
            <div key={heading} className="rounded-xl border border-white/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border-b border-white/5">
                <span className="text-amber-500">{icon}</span>
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest">{heading}</p>
              </div>
              <div className="px-4 divide-y divide-white/3">
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