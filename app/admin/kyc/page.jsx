"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../utils/api";
import toast from "react-hot-toast";
import { AuthImage } from "../../components/AuthImage";
import {
  ShieldCheck, ShieldX, Clock, RefreshCw,
  X, CheckCircle, XCircle, Eye, User,
  MapPin, Phone, Calendar, CreditCard, AlertTriangle,
  ArrowLeft,
} from "lucide-react";

const STATUS_CONFIG = {
  pending:  { label: "Pending",  color: "text-amber-400",   bg: "bg-amber-500/10  border-amber-500/20",   icon: <Clock      size={12} /> },
  approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle size={12} /> },
  rejected: { label: "Rejected", color: "text-red-400",     bg: "bg-red-500/10    border-red-500/20",     icon: <XCircle    size={12} /> },
  resubmit: { label: "Resubmit", color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/20",  icon: <RefreshCw  size={12} /> },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

export default function AdminKycManagement() {
  const [kycs, setKycs]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState("pending");
  const [selectedKyc, setSelectedKyc]   = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [blobUrls, setBlobUrls] = useState({});

  useEffect(() => { fetchKycs(); }, [filter]);

  const fetchKycs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/kyc?status=${filter}`);
      setKycs(res.data.data.data ?? res.data.data ?? []);
    } catch {
      toast.error("Failed to load KYC submissions");
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (kycId) => {
    try {
      const res = await api.get(`/admin/kyc/${kycId}`);
      setSelectedKyc(res.data.data);
      setRejectionReason("");
      setShowModal(true);
    } catch {
      toast.error("Failed to load KYC details");
    }
  };

  const closeModal = () => { setShowModal(false); setRejectionReason("");  setBlobUrls({});};

  const handleApprove = async (kycId) => {
    if (!window.confirm("Approve this KYC submission?")) return;
    try {
      setActionLoading(true);
      await api.post(`/admin/kyc/${kycId}/approve`);
      toast.success("KYC approved successfully");
      closeModal(); fetchKycs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve KYC");
    } finally { setActionLoading(false); }
  };

  const handleReject = async (kycId) => {
    if (!rejectionReason.trim()) { toast.error("Please provide a rejection reason"); return; }
    try {
      setActionLoading(true);
      await api.post(`/admin/kyc/${kycId}/reject`, { reason: rejectionReason });
      toast.success("KYC rejected");
      closeModal(); fetchKycs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject KYC");
    } finally { setActionLoading(false); }
  };

  const handleRequestResubmit = async (kycId) => {
    if (!rejectionReason.trim()) { toast.error("Please provide a reason for resubmission"); return; }
    try {
      setActionLoading(true);
      await api.post(`/admin/kyc/${kycId}/resubmit`, { reason: rejectionReason });
      toast.success("Resubmission requested");
      closeModal(); fetchKycs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request resubmission");
    } finally { setActionLoading(false); }
  };

  const tabs = ["pending", "approved", "rejected", "resubmit"];

  return (
    <div className="min-h-screen bg-[#0D1F1A] relative"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <Link href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-6 sm:mb-8">
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-purple-400 mb-2">Admin Panel</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            KYC Verification
          </h1>
          <p className="text-white/40 mt-1 text-sm">Review and manage identity verification submissions</p>
        </div>

        {/* Filter Tabs — scrollable on mobile */}
        <div className="flex overflow-x-auto gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-fit max-w-full mb-6 sm:mb-8 scrollbar-hide">
          {tabs.map((status) => (
            <button key={status} onClick={() => setFilter(status)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                filter === status ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
              }`}>
              {STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : kycs.length === 0 ? (
          <div className="text-center py-24 border border-white/10 rounded-2xl">
            <ShieldCheck size={40} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/30">No {filter} KYC submissions found</p>
          </div>
        ) : (
          <>
            {/* Desktop table — hidden on mobile */}
            <div className="hidden md:block rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-white/10 bg-white/5">
                {["User", "Full Name", "ID Type", "Status", "Submitted", ""].map((h) => (
                  <span key={h} className="text-xs font-bold uppercase tracking-widest text-white/30">{h}</span>
                ))}
              </div>
              {kycs.map((kyc, i) => (
                <div key={kyc.id}
                  className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors ${
                    i < kycs.length - 1 ? "border-b border-white/5" : ""
                  }`}>
                  <div>
                    <p className="text-sm font-semibold text-white">{kyc.user?.name}</p>
                    <p className="text-xs text-white/30 mt-0.5 truncate">{kyc.user?.email}</p>
                  </div>
                  <p className="text-sm text-white/70 truncate">{kyc.full_name}</p>
                  <p className="text-sm text-white/70 uppercase">{kyc.id_type?.replace(/_/g, " ")}</p>
                  <StatusBadge status={kyc.status} />
                  <p className="text-sm text-white/40">{new Date(kyc.created_at).toLocaleDateString()}</p>
                  <button onClick={() => viewDetails(kyc.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors">
                    <Eye size={13} /> View
                  </button>
                </div>
              ))}
            </div>

            {/* Mobile cards — shown only on mobile */}
            <div className="md:hidden space-y-3">
              {kycs.map((kyc) => (
                <div key={kyc.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{kyc.user?.name}</p>
                      <p className="text-xs text-white/30 truncate">{kyc.user?.email}</p>
                    </div>
                    <StatusBadge status={kyc.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-white/5 rounded-lg p-2.5">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Full Name</p>
                      <p className="text-xs font-semibold text-white truncate">{kyc.full_name}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2.5">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">ID Type</p>
                      <p className="text-xs font-semibold text-white uppercase">{kyc.id_type?.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/30">{new Date(kyc.created_at).toLocaleDateString()}</p>
                    <button onClick={() => viewDetails(kyc.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <Eye size={12} /> View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && selectedKyc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="relative w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0f2820] shadow-2xl">

            {/* Modal header */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-[#0f2820] z-10">
              <div className="min-w-0 flex-1 pr-3">
                <h2 className="text-lg sm:text-xl font-bold text-white"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  KYC Details
                </h2>
                <p className="text-white/40 text-xs sm:text-sm mt-0.5 truncate">
                  {selectedKyc.user?.name} · {selectedKyc.user?.email}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <StatusBadge status={selectedKyc.status} />
                <button onClick={closeModal}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">

              {/* Personal Information */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <User size={14} className="text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {[
                    { label: "Full Name",    value: selectedKyc.full_name,                                      icon: <User     size={13} /> },
                    { label: "Date of Birth",value: new Date(selectedKyc.date_of_birth).toLocaleDateString(),   icon: <Calendar size={13} /> },
                    { label: "Phone Number", value: selectedKyc.phone_number,                                   icon: <Phone    size={13} /> },
                    { label: "City, State",  value: `${selectedKyc.city}, ${selectedKyc.state}`,                icon: <MapPin   size={13} /> },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                      <p className="text-xs text-white/30 flex items-center gap-1.5 mb-1">{item.icon}{item.label}</p>
                      <p className="text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                  <div className="sm:col-span-2 bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                    <p className="text-xs text-white/30 flex items-center gap-1.5 mb-1"><MapPin size={13} />Address</p>
                    <p className="text-sm font-semibold text-white">{selectedKyc.address}</p>
                  </div>
                </div>
              </section>

              {/* ID Information */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={14} className="text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">ID Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                    <p className="text-xs text-white/30 mb-1">ID Type</p>
                    <p className="text-sm font-semibold text-white uppercase">{selectedKyc.id_type?.replace(/_/g, " ")}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5">
                    <p className="text-xs text-white/30 mb-1">ID Number</p>
                    <p className="text-sm font-semibold text-white font-mono break-all">{selectedKyc.id_number}</p>
                  </div>
                </div>
              </section>

              {/* Documents */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={14} className="text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Uploaded Documents</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { label: "ID Front", url: selectedKyc.id_front_url },
                    ...(selectedKyc.id_back_url ? [{ label: "ID Back", url: selectedKyc.id_back_url }] : []),
                    { label: "Selfie",   url: selectedKyc.selfie_url },
                  ].map((doc) => (
                      <a key={doc.label} href={blobUrls[doc.label] || "#"}  target="_blank" rel="noopener noreferrer" className="group block">
                        <div className="relative rounded-xl overflow-hidden border border-white/10 aspect-4/3 bg-white/5">
                          <AuthImage
                            src={doc.url}
                            alt={doc.label}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                             onBlobReady={(blobUrl) =>      
                              setBlobUrls((prev) => ({ ...prev, [doc.label]: blobUrl }))
                            }
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye size={20} className="text-white" />
                          </div>
                        </div>
                        <p className="text-xs text-white/30 text-center mt-1.5">{doc.label}</p>
                      </a>
                    ))}
                    </div>
              </section>

              {/* Existing rejection reason */}
              {selectedKyc.rejection_reason && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/20 bg-red-500/10">
                  <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-0.5">Rejection Reason</p>
                    <p className="text-sm text-red-300">{selectedKyc.rejection_reason}</p>
                  </div>
                </div>
              )}

              {/* Actions — only for pending */}
              {selectedKyc.status === "pending" && (
                <section className="space-y-4 pt-2">
                  <button onClick={() => handleApprove(selectedKyc.id)} disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                    {actionLoading
                      ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <CheckCircle size={16} />}
                    Approve KYC
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/20 text-xs whitespace-nowrap">or reject / request changes</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                      Reason <span className="normal-case font-normal">(required for reject / resubmit)</span>
                    </label>
                    <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      placeholder="Explain why this KYC is being rejected or needs resubmission..."
                      className="w-full bg-white/5 border border-white/10 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleReject(selectedKyc.id)} disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20">
                      <XCircle size={15} /> Reject
                    </button>
                    <button onClick={() => handleRequestResubmit(selectedKyc.id)} disabled={actionLoading}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20">
                      <RefreshCw size={15} /> Resubmit
                    </button>
                  </div>
                </section>
              )}

              <div className="h-2 sm:h-0" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}