"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../../utils/api";
import { formatNaira } from "../../../utils/currency";
import toast from "react-hot-toast";
import { ArrowLeft, Package, Tag, Calendar, FileText, AlertCircle } from "lucide-react";

function DarkInput({ className = "", ...props }) {
  return (
    <input
      className={`w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 px-4 py-3 rounded-xl text-sm outline-none transition-all ${className}`}
      {...props}
    />
  );
}

function FormField({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">{label}</label>
      {children}
      {hint && <p className="text-xs text-white/25 mt-1.5">{hint}</p>}
    </div>
  );
}

export default function CreateListingPage() {
  const router = useRouter();
  const [myLands, setMyLands]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState({
    land_id: "",
    units_for_sale: "",
    asking_price_kobo_display: "", // user types naira, we convert
    description: "",
    expires_at: "",
  });

  const [selectedLand, setSelectedLand] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/user/lands");
        setMyLands(res.data?.data ?? []);
      } catch {
        toast.error("Failed to load your land holdings");
      } finally {
        setFetching(false);
      }
    };
    fetch();
  }, []);

  const handleLandChange = (landId) => {
    const holding = myLands.find((l) => String(l.land_id) === String(landId));
    setSelectedLand(holding?.land ?? null);
    setForm((f) => ({ ...f, land_id: landId, units_for_sale: "" }));
  };

  const selectedHolding = myLands.find((l) => String(l.land?.id) === String(form.land_id));
  const availableUnits = selectedHolding?.units ?? 0;
  const askingKobo     = Math.round((parseFloat(form.asking_price_kobo_display) || 0) * 100);
  const totalNaira     = askingKobo > 0 && form.units_for_sale
    ? (askingKobo * parseInt(form.units_for_sale)) / 100
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.land_id)            return toast.error("Select a property");
    if (!form.units_for_sale || parseInt(form.units_for_sale) < 1)
                                  return toast.error("Enter units to sell");
    if (parseInt(form.units_for_sale) > availableUnits)
                                  return toast.error(`You only have ${availableUnits} units available`);
    if (!askingKobo || askingKobo < 1)
                                  return toast.error("Enter a valid asking price");

    setLoading(true);
    try {
      await api.post("/marketplace", {
        land_id:           parseInt(form.land_id),
        units_for_sale:    parseInt(form.units_for_sale),
        asking_price_kobo: askingKobo,
        description:       form.description || undefined,
        expires_at:        form.expires_at   || undefined,
      });
      toast.success("Listing created successfully");
      router.push("/marketplace");
    } catch (err) {
      if (err.response?.data?.errors) {
        Object.values(err.response.data.errors).flat().forEach((m) => toast.error(m));
      } else {
        toast.error(err.response?.data?.message || "Failed to create listing");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1F1A]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative z-10 max-w-xl mx-auto px-5 py-10">
        <Link href="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
          <ArrowLeft size={13} /> Back to Marketplace
        </Link>

        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2">P2P Exchange</p>
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            List Units for Sale
          </h1>
          <p className="text-white/40 mt-1 text-sm">Set your price and let buyers come to you</p>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : myLands.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <Package size={36} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/40 text-sm mb-4">You don't own any land units yet.</p>
            <Link href="/lands"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors">
              Browse Properties
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Property selector */}
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5 bg-white/5">
                <Package size={15} className="text-amber-500" />
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest">Property</h3>
              </div>
              <div className="p-5 space-y-4">
                <FormField label="Select a Property">
                  <select
                    value={form.land_id}
                    onChange={(e) => handleLandChange(e.target.value)}
                    className="w-full bg-[#0D1F1A] border border-white/10 hover:border-white/20 focus:border-amber-500/50 text-white px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  >
                    <option value="">Choose from your holdings…</option>
                    {myLands.map((holding) => {
                      const land = holding.land;
                      return (
                        <option key={land.id} value={holding.land_id}>
                          {land.title} — {holding.units} units owned
                        </option>
                      );
                    })}
                  </select>
                </FormField>

                {selectedLand && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                    {selectedLand.images?.[0]?.image_url && (
                      <img src={selectedLand.images[0].image_url} alt=""
                        className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{selectedLand.title}</p>
                      <p className="text-xs hover:border-white/[0.35] truncate">{selectedLand.location}</p>
                      <p className="text-xs text-amber-400/70 mt-0.5">
                        You own: <span className="font-bold text-amber-400">{availableUnits} units</span>
                      </p>
                    </div>
                  </div>
                )}

                <FormField
                  label="Units to Sell"
                  hint={selectedLand ? `Max: ${availableUnits} units` : undefined}>
                 <DarkInput
                    type="number"
                    min={1}
                    max={availableUnits || undefined}
                    value={form.units_for_sale}
                    onChange={(e) => {
                      let val = parseInt(e.target.value) || 0;
                      if (val > availableUnits) val = availableUnits; // clamp to max
                      if (val < 1) val = 1; // optional: clamp to min
                      setForm((f) => ({ ...f, units_for_sale: val }));
                    }}
                    placeholder="e.g. 10"
                    disabled={!selectedLand}
                  />
                </FormField>
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5 bg-white/5">
                <Tag size={15} className="text-amber-500" />
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest">Pricing</h3>
              </div>
              <div className="p-5 space-y-4">
                <FormField label="Asking Price per Unit (₦)">
                  <DarkInput
                    type="number" min={0} step="0.01"
                    value={form.asking_price_kobo_display}
                    onChange={(e) => setForm((f) => ({ ...f, asking_price_kobo_display: e.target.value }))}
                    placeholder="e.g. 5000.00"
                  />
                  {askingKobo > 0 && (
                    <p className="text-xs text-amber-400/70 mt-1.5">
                      = {formatNaira(askingKobo)} per unit
                    </p>
                  )}
                </FormField>

                {totalNaira !== null && (
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 px-4 py-3 flex items-center justify-between">
                    <span className="text-xs text-white/40">Total listing value</span>
                    <span className="text-base font-bold text-emerald-400"
                      style={{ fontFamily: "'Playfair Display', serif" }}>
                      ₦{totalNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5 bg-white/5">
                <FileText size={15} className="text-amber-500" />
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest">Details</h3>
              </div>
              <div className="p-5 space-y-4">
                <FormField label="Description (optional)">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Why are you selling? Any notes for buyers…"
                    className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 text-white placeholder-white/20 px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all"
                  />
                </FormField>

                <FormField label="Listing Expiry (optional)" hint="Leave blank to keep active until manually cancelled">
                  <DarkInput
                    type="datetime-local"
                    value={form.expires_at}
                    onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                    min={new Date(Date.now() + 3600_000).toISOString().slice(0, 16)}
                  />
                </FormField>
              </div>
            </div>

            {/* Platform fee note */}
            <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3">
              <AlertCircle size={13} className="text-white/20 shrink-0 mt-0.5" />
              <p className="text-xs text-white/25 leading-relaxed">
                A <span className="text-white/40 font-semibold">1% platform fee</span> is deducted from the
                sale proceeds when the trade completes. You keep 99% of the agreed price.
              </p>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-[#0D1F1A] flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
              {loading
                ? <><div className="w-4 h-4 border-2 border-[#0D1F1A]/40 border-t-[#0D1F1A] rounded-full animate-spin" />Creating Listing…</>
                : "Create Listing"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}