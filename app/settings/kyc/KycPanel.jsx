"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, Camera, CreditCard, ImageIcon, MapPin, User,
} from "lucide-react";
import api from "../../../utils/api";

import { STEPS, ID_TYPES } from "./constants";
import StatusBanner          from "./StatusBanner";
import { ProgressRail, NavButtons } from "./FormComponents";
import KycSteps              from "./KycSteps";

const STEP_META = [
  { icon: <User size={16} />,        title: "Personal Information", subtitle: "Tell us about yourself"         },
  { icon: <MapPin size={16} />,      title: "Residential Address",  subtitle: "Where do you live?"             },
  { icon: <CreditCard size={16} />,  title: "Identity Document",    subtitle: "Your government-issued ID"      },
  { icon: <ImageIcon size={16} />,   title: "Upload Documents",     subtitle: "Photos of your ID"              },
  { icon: <Camera size={16} />,      title: "Liveness Check",       subtitle: "Confirm you're physically present" },
  { icon: <CheckCircle size={16} />, title: "Review & Submit",      subtitle: "Confirm your details"           },
];

const EMPTY_FORM = {
  full_name: "", date_of_birth: "", phone_number: "",
  address: "", city: "", state: "", country: "Nigeria",
  id_type: "", id_number: "",
  id_front: null, id_back: null, selfie: null,
};

export default function KycPanel({ kycStatus: kycStatusProp, setKycStatus: setKycStatusProp }) {
  const [kycStatus, _setKycStatus] = useState(null);
  const [loading, setLoading]      = useState(true);
  const [showForm, setShowForm]    = useState(false);
  const [step, setStep]            = useState(0);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors]           = useState({});
  const [form, setForm]               = useState(EMPTY_FORM);

  const setKycStatus = useCallback((val) => {
    _setKycStatus(val);
    setKycStatusProp?.(val?.status ?? null);
  }, [setKycStatusProp]);

  // ── Load current KYC status ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/kyc/status");
        const kycData  = data.data;
        setKycStatus(kycData);
        setShowForm(["not_submitted", "rejected", "resubmit"].includes(kycData.status));
      } catch {
        setKycStatus({ status: "not_submitted" });
        setShowForm(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setFile  = (k, f) => setForm(p => ({ ...p, [k]: f }));

  const handleIdTypeChange = (val) =>
    setForm(p => ({ ...p, id_type: val, id_number: "" }));

  const handleIdNumberChange = (e) => {
    const meta = ID_TYPES.find(t => t.value === form.id_type);
    let val = e.target.value;
    if (meta?.numericOnly) val = val.replace(/\D/g, "");
    if (meta?.maxLen)      val = val.slice(0, meta.maxLen);
    setField("id_number", val);
  };

  const selectedIdMeta = ID_TYPES.find(t => t.value === form.id_type);
  const idTypeLabel    = selectedIdMeta?.label || "—";

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep = () => {
    const e = {};

    if (step === 0) {
      if (!form.full_name.trim())    e.full_name     = "Full name is required";
      if (!form.date_of_birth) {
        e.date_of_birth = "Date of birth is required";
      } else {
        const age = Math.floor((new Date() - new Date(form.date_of_birth)) / (1000 * 60 * 60 * 24 * 365.25));
        if (age < 18)  e.date_of_birth = "You must be at least 18 years old";
        if (age > 120) e.date_of_birth = "Please enter a valid date of birth";
      }
      if (!form.phone_number.trim())         e.phone_number = "Phone number is required";
      else if (form.phone_number.length < 7) e.phone_number = "Please enter a valid phone number";
    }

    if (step === 1) {
      if (!form.address.trim()) e.address = "Address is required";
      if (!form.city.trim())    e.city    = "City is required";
      if (!form.state)          e.state   = "State is required";
    }

    if (step === 2) {
      if (!form.id_type)          e.id_type   = "Please select an ID type";
      if (!form.id_number.trim()) e.id_number = "ID number is required";
      else if (
        selectedIdMeta?.maxLen &&
        form.id_number.length < selectedIdMeta.maxLen &&
        selectedIdMeta.numericOnly
      ) {
        e.id_number = `Must be exactly ${selectedIdMeta.maxLen} digits`;
      }
    }

    if (step === 3 && form.id_type !== "bvn" && !form.id_front)
      e.id_front = "Front of ID is required";

    if (step === 4 && !form.selfie)
      e.selfie = "Please complete the liveness check";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    // BVN has no document upload step — skip step 3
    if (step === 2 && form.id_type === "bvn") { setStep(4); return; }
    setStep(s => s + 1);
  };

  const prevStep = () => {
    if (step === 4 && form.id_type === "bvn") setStep(2);
    else setStep(s => s - 1);
    setErrors({});
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const fd = new FormData();
      fd.append("full_name",     form.full_name.trim());
      fd.append("date_of_birth", form.date_of_birth);
      fd.append("phone_number",  `+234${form.phone_number}`);
      fd.append("address",       form.address.trim());
      fd.append("city",          form.city.trim());
      fd.append("state",         form.state);
      fd.append("country",       form.country);
      fd.append("id_type",       form.id_type);
      fd.append("id_number",     form.id_number.trim());
      if (form.id_front) fd.append("id_front", form.id_front);
      if (form.id_back)  fd.append("id_back",  form.id_back);
      if (form.selfie)   fd.append("selfie",   form.selfie);

      await api.post("/kyc/submit", fd);

      try {
        const { data: statusRes } = await api.get("/kyc/status");
        setKycStatus(statusRes.data);
      } catch {
        setKycStatus({ status: "pending", submission_date: new Date().toISOString() });
      }
      setShowForm(false);
    } catch (err) {
      const resData = err.response?.data;
      setSubmitError(
        resData?.message  ? resData.message
          : resData?.errors ? Object.values(resData.errors).flat().join(" ")
          : "Submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading spinner ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const meta = STEP_META[step];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-0">
      {/* Status banner (pending / approved / rejected / resubmit) */}
      {kycStatus && kycStatus.status !== "not_submitted" && (
        <StatusBanner
          kyc={kycStatus}
          onResubmit={() => { setShowForm(true); setStep(0); }}
        />
      )}

      {/* Approved — no form needed */}
      {kycStatus?.status === "approved" && !showForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <CheckCircle size={26} className="text-emerald-500" />
          </div>
          <p className="text-xl text-white font-bold mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            You're Verified
          </p>
          <p className="text-white/30 text-sm">All identity checks passed successfully.</p>
        </motion.div>
      )}

      {/* Multi-step form */}
      {showForm && (
        <>
          {/* Desktop progress rail */}
          <ProgressRail current={step} />

          {/* Step header */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              {React.cloneElement(meta.icon, { size: 15 })}
            </div>
            <div>
              <h2
                className="text-lg text-white font-bold leading-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {meta.title}
              </h2>
              <p className="text-white/30 text-xs mt-0.5">{meta.subtitle}</p>
            </div>
            <span className="ml-auto text-xs text-white/20 font-medium tabular-nums sm:hidden">
              {step + 1}/{STEPS.length}
            </span>
          </div>

          {/* Mobile progress bar */}
          <div className="sm:hidden h-0.5 bg-white/10 rounded-full mb-5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #C8873A, #E8A850)" }}
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Step content */}
          <KycSteps
            step={step}
            form={form}
            errors={errors}
            submitError={submitError}
            setField={setField}
            setFile={setFile}
            handleIdTypeChange={handleIdTypeChange}
            handleIdNumberChange={handleIdNumberChange}
            selectedIdMeta={selectedIdMeta}
            idTypeLabel={idTypeLabel}
          />

          {/* Navigation */}
          <NavButtons
            step={step}
            totalSteps={STEPS.length}
            onNext={nextStep}
            onSubmit={handleSubmit}
            onBack={prevStep}
            submitting={submitting}
          />
        </>
      )}
    </div>
  );
}