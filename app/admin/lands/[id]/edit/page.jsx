"use client";

import dynamic from "next/dynamic";
import { compressImage } from "../../../../../utils/compressImage";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../../../../utils/api";
import toast from "react-hot-toast";
import {
  MapPin, FileText, Layers, DollarSign, ArrowLeft, Save, X,
  Building2, ShieldCheck, Activity, Zap, BarChart3, Plus, Trash2,
} from "lucide-react";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const PolygonMapEditor = dynamic(() => import("../../PolygonMapEditor"), { ssr: false });

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1900 + 2 }, (_, i) => 1900 + i).reverse();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyDetail() {
  return {
    plot_identifier: "", tenure: "", lga: "", city: "", state: "",
    current_owner: "", dispute_status: "", taxation: "",
    allocation_records: [], land_titles: [], historical_transactions: [],
    preexisting_landuse: "", current_landuse: "", proposed_landuse: "",
    zoning: "", dev_control: "",
    slope: "", elevation: "", soil_type: "", bearing_capacity: "",
    hydrology: "", vegetation: "",
    road_type: "", road_category: "", road_condition: "",
    electricity: "", water_supply: "", sewage: "", other_facilities: "",
    comm_lines: [],
    neighbouring_transactions: [],
    overall_value: "", current_land_value: "", rental_pm: "", rental_pa: "",
    valuation_history: [],
  };
}

function arrayField(land, key) {
  const v = land[key];
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try { return JSON.parse(v); } catch { return []; }
}

/**
 * Extract a GeoJSON Polygon from the API response.
 * Priority: geometry_geojson → geometry
 */
function extractPolygon(land) {
  const candidates = [land.geometry_geojson, land.geometry];
  for (const geo of candidates) {
    if (!geo) continue;
    try {
      const parsed = typeof geo === "string" ? JSON.parse(geo) : geo;
      if (parsed?.type === "Polygon") return parsed;
    } catch {
      // not valid JSON / not a polygon — try next candidate
    }
  }
  return null;
}

/**
 * Build a FormData from a flat payload object.
 * - geometry     → JSON.stringify
 * - array fields → JSON.stringify
 */
function buildFormData(payload, newImages = [], removeImages = []) {
  const ARRAY_KEYS = [
    "allocation_records", "land_titles", "historical_transactions",
    "comm_lines", "valuation_history", "neighbouring_transactions",
  ];

  const fd = new FormData();
  fd.append("_method", "POST");

  Object.entries(payload).forEach(([k, v]) => {
    if (k === "geometry") {
      fd.append(k, v != null ? JSON.stringify(v) : "");
    } else if (ARRAY_KEYS.includes(k)) {
      fd.append(k, JSON.stringify(v ?? []));
    } else {
      fd.append(k, v ?? "");
    }
  });

  newImages.forEach((img) => fd.append("images[]", img));
  removeImages.forEach((imgId) => fd.append("remove_images[]", imgId));

  return fd;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FormSection({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5 bg-white/5">
        {icon}
        <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">{label}</label>
      {children}
    </div>
  );
}

function DarkInput({ className = "", ...props }) {
  return (
    <input
      className={`w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 px-4 py-3 rounded-xl text-sm outline-none transition-all ${className}`}
      {...props}
    />
  );
}

function DarkSelect({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full bg-[#0D1F1A] border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white px-4 py-3 rounded-xl text-sm outline-none transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function StringListEditor({ value = [], onChange, placeholder }) {
  const add    = () => onChange([...value, ""]);
  const update = (i, v) => { const a = [...value]; a[i] = v; onChange(a); };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex gap-2">
          <DarkInput value={item} onChange={(e) => update(i, e.target.value)} placeholder={placeholder} />
          <button type="button" onClick={() => remove(i)}
            className="shrink-0 w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors">
        <Plus size={12} /> Add entry
      </button>
    </div>
  );
}

function CommLinesEditor({ value = [], onChange }) {
  const NETWORKS = ["MTN", "GLO", "Airtel", "Etisalat"];
  const add    = () => onChange([...value, { network: "MTN", strength: "" }]);
  const update = (i, field, v) => { const a = [...value]; a[i] = { ...a[i], [field]: v }; onChange(a); };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-[140px_1fr_40px] gap-2 items-center">
          <DarkSelect value={row.network} onChange={(e) => update(i, "network", e.target.value)}>
            {NETWORKS.map((n) => <option key={n} value={n}>{n}</option>)}
          </DarkSelect>
          <DarkInput type="number" min={0} max={100} value={row.strength} onChange={(e) => update(i, "strength", e.target.value)} placeholder="Signal %" />
          <button type="button" onClick={() => remove(i)}
            className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all">
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors">
        <Plus size={12} /> Add network
      </button>
    </div>
  );
}

function ValuationHistoryEditor({ value = [], onChange }) {
  const add    = () => onChange([...value, { year: CURRENT_YEAR, month: 1, value: "" }]);
  const update = (i, field, v) => { const a = [...value]; a[i] = { ...a[i], [field]: v }; onChange(a); };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));

  const sorted = [...value]
    .map((r, originalIdx) => ({ ...r, originalIdx }))
    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 px-1">
          {["Year", "Month", "Value (₦)", ""].map((h, i) => (
            <span key={i} className="text-[10px] font-black uppercase tracking-widest text-white/25">{h}</span>
          ))}
        </div>
      )}
      {sorted.map(({ originalIdx: i }) => {
        const row = value[i];
        return (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 items-center">
            <DarkSelect value={row.year} onChange={(e) => update(i, "year", Number(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </DarkSelect>
            <DarkSelect value={row.month} onChange={(e) => update(i, "month", Number(e.target.value))}>
              {MONTHS.map((m, idx) => <option key={idx + 1} value={idx + 1}>{m}</option>)}
            </DarkSelect>
            <DarkInput type="number" min={0} value={row.value} onChange={(e) => update(i, "value", e.target.value)} placeholder="0.00" />
            <button type="button" onClick={() => remove(i)}
              className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all">
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors">
        <Plus size={12} /> Add month
      </button>
    </div>
  );
}

/**
 * Editor for neighbouring_transactions.
 * Each row: { plot_size, year, value, distance_m }
 * Serialised as array of objects — the controller validates neighbouring_transactions.*.plot_size etc.
 */
function NeighbouringTransactionsEditor({ value = [], onChange }) {
  const emptyRow = () => ({ plot_size: "", year: CURRENT_YEAR, value: "", distance_m: "" });
  const add    = () => onChange([...value, emptyRow()]);
  const update = (i, field, v) => { const a = [...value]; a[i] = { ...a[i], [field]: v }; onChange(a); };
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="grid grid-cols-[1fr_80px_1fr_100px_40px] gap-2 px-1">
          {["Plot Size (m²)", "Year", "Value (₦)", "Distance (m)", ""].map((h, i) => (
            <span key={i} className="text-[10px] font-black uppercase tracking-widest text-white/25">{h}</span>
          ))}
        </div>
      )}
      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_80px_1fr_100px_40px] gap-2 items-center">
          <DarkInput
            type="number" min={0}
            value={row.plot_size}
            onChange={(e) => update(i, "plot_size", e.target.value)}
            placeholder="e.g. 500"
          />
          <DarkSelect
            value={row.year}
            onChange={(e) => update(i, "year", Number(e.target.value))}
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </DarkSelect>
          <DarkInput
            type="number" min={0}
            value={row.value}
            onChange={(e) => update(i, "value", e.target.value)}
            placeholder="0.00"
          />
          <DarkInput
            type="number" min={0}
            value={row.distance_m}
            onChange={(e) => update(i, "distance_m", e.target.value)}
            placeholder="metres"
          />
          <button
            type="button" onClick={() => remove(i)}
            className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button type="button" onClick={add}
        className="flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors">
        <Plus size={12} /> Add transaction
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EditLand() {
  const { id } = useParams();
  const router  = useRouter();

  const [form, setForm] = useState({
    title: "", location: "", description: "", size: "",
    total_units: "", is_available: true, polygon: null, lat: "", lng: "",
  });
  const [detail, setDetail] = useState(emptyDetail());

  const [currentPriceKobo, setCurrentPriceKobo]   = useState(""); // loaded value
  const [priceKobo, setPriceKobo]                 = useState(""); // editable value

  const [existingImages, setExistingImages]     = useState([]);
  const [newImages, setNewImages]               = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [removeImages, setRemoveImages]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [fetching, setFetching]       = useState(true);
  const [soldUnits, setSoldUnits] = useState(0);
  const [usePolygon, setUsePolygon]               = useState(false);
  const [initialHasPolygon, setInitialHasPolygon] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchLand = async () => {
      try {
        const res  = await api.get(`/admin/lands/${id}`);
        const land = res.data.data;

        const polygon    = extractPolygon(land);
        const hasPolygon = !!polygon;
        setInitialHasPolygon(hasPolygon);
        setUsePolygon(hasPolygon);

        setForm({
          title:        land.title        || "",
          location:     land.location     || "",
          description:  land.description  || "",
          size:         land.size?.toString()        || "",
          total_units:  land.total_units?.toString() || "",
          lat:  hasPolygon ? "" : (land.lat?.toString() || ""),
          lng:  hasPolygon ? "" : (land.lng?.toString() || ""),
          is_available: land.is_available ?? true,
          polygon,
        });

        // Price — prefer latestPrice relationship, fall back to appended accessor
        const loadedPrice = (
          land.latest_price?.price_per_unit_kobo ??
          land.current_price_per_unit_kobo ??
          0
        ).toString();
        setCurrentPriceKobo(loadedPrice);
        setPriceKobo(loadedPrice);

        setSoldUnits(land.units_sold ?? (land.total_units - land.available_units));
        setExistingImages(land.images || []);

        // Normalise valuation history from land.valuations relationship
        const rawHistory = land.valuations ?? arrayField(land, "valuation_history");
        const valuationHistory = rawHistory.map((r) =>
          Array.isArray(r)
            ? { year: r[0], month: r[1], value: r[2] }
            : { year: Number(r.year), month: Number(r.month), value: r.value }
        );

        // Normalise comm_lines (stored as [[network, strength], ...])
        const rawComm = arrayField(land, "comm_lines");
        const commLines = rawComm.map((r) =>
          Array.isArray(r)
            ? { network: r[0] ?? "", strength: r[1] ?? "" }
            : { network: r.network ?? "", strength: r.strength ?? "" }
        );

        // Normalise neighbouring_transactions (array of objects)
        const rawNeighbouring = arrayField(land, "neighbouring_transactions");
        const neighbouringTransactions = rawNeighbouring.map((r) =>
          Array.isArray(r)
            ? { plot_size: r[0] ?? "", year: r[1] ?? CURRENT_YEAR, value: r[2] ?? "", distance_m: r[3] ?? "" }
            : {
                plot_size:  r.plot_size  ?? "",
                year:       Number(r.year ?? CURRENT_YEAR),
                value:      r.value      ?? "",
                distance_m: r.distance_m ?? "",
              }
        );

        setDetail({
          plot_identifier:         land.plot_identifier     || "",
          tenure:                  land.tenure              || "",
          lga:                     land.lga                 || "",
          city:                    land.city                || "",
          state:                   land.state               || "",
          current_owner:           land.current_owner       || "",
          dispute_status:          land.dispute_status      || "",
          taxation:                land.taxation            || "",
          allocation_records:      arrayField(land, "allocation_records"),
          land_titles:             arrayField(land, "land_titles"),
          historical_transactions: arrayField(land, "historical_transactions"),
          preexisting_landuse:     land.preexisting_landuse || "",
          current_landuse:         land.current_landuse     || "",
          proposed_landuse:        land.proposed_landuse    || "",
          zoning:                  land.zoning              || "",
          dev_control:             land.dev_control         || "",
          slope:                   land.slope?.toString()   || "",
          elevation:               land.elevation?.toString() || "",
          soil_type:               land.soil_type           || "",
          bearing_capacity:        land.bearing_capacity    || "",
          hydrology:               land.hydrology           || "",
          vegetation:              land.vegetation          || "",
          road_type:               land.road_type           || "",
          road_category:           land.road_category       || "",
          road_condition:          land.road_condition      || "",
          electricity:             land.electricity         || "",
          water_supply:            land.water_supply        || "",
          sewage:                  land.sewage              || "",
          other_facilities:        land.other_facilities    || "",
          comm_lines:              commLines,
          neighbouring_transactions: neighbouringTransactions,
          overall_value:           land.overall_value?.toString()      || "",
          current_land_value:      land.current_land_value?.toString() || "",
          rental_pm:               land.rental_pm?.toString()          || "",
          rental_pa:               land.rental_pa?.toString()          || "",
          valuation_history:       valuationHistory,
        });
      } catch {
        toast.error("Failed to load land");
      } finally {
        setFetching(false);
      }
    };
    fetchLand();
  }, [id]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (["size", "total_units", "lat", "lng"].includes(name) && !/^-?\d*\.?\d*$/.test(value)) return;
    if (name === "total_units" && value !== "" && parseInt(value) < soldUnits) {
      toast.error(`Cannot be less than sold units (${soldUnits})`);
      return;
    }
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handlePriceChange = (e) => {
    const v = e.target.value;
    if (!/^\d*$/.test(v)) return;
    setPriceKobo(v);
  };

  const setDetailField = (name, value) => setDetail((d) => ({ ...d, [name]: value }));

  const handlePolygonChange = (polygon) => setForm((f) => ({ ...f, polygon }));

  const toggleCoordinateMode = () => {
    if (!usePolygon && (form.lat || form.lng) && !window.confirm("Switching to polygon will clear lat/lng. Continue?")) return;
    if (usePolygon && form.polygon && !window.confirm("Switching to point will clear polygon. Continue?")) return;
    if (!usePolygon) setForm((f) => ({ ...f, lat: "", lng: "", polygon: null }));
    else             setForm((f) => ({ ...f, polygon: null }));
    setUsePolygon((v) => !v);
  };

  const handleImageChange = async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    setCompressing(true);
    try {
      const compressed = await Promise.all(
        files.map((f) => compressImage(f, { maxPx: 1280, maxBytes: 500 * 1024, quality: 0.82 }))
      );
      setNewImages(compressed);
      setNewImagePreviews(compressed.map((f) => URL.createObjectURL(f)));
    } finally {
      setCompressing(false);
    }
  };

  const removeExistingImage = (imgId) => {
    setRemoveImages((prev) => [...prev, imgId]);
    setExistingImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const removeNewImage = (i) => {
    setNewImages((prev) => prev.filter((_, idx) => idx !== i));
    setNewImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const buildGeometry = () => {
    if (usePolygon && form.polygon)
      return { type: "Polygon", coordinates: form.polygon.coordinates };
    if (!usePolygon && form.lat && form.lng)
      return { type: "Point", coordinates: [parseFloat(form.lng), parseFloat(form.lat)] };
    return null;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (usePolygon && !form.polygon)             return toast.error("Please draw a polygon on the map");
    if (!usePolygon && (!form.lat || !form.lng)) return toast.error("Please provide lat and lng");

    const payload = {
      // Core
      title:        form.title,
      location:     form.location,
      size:         parseFloat(form.size) || 0,
      total_units:  parseInt(form.total_units) || 0,
      description:  form.description,
      is_available: form.is_available ? 1 : 0,
      geometry:     buildGeometry(),
      // Administrative
      plot_identifier: detail.plot_identifier,
      tenure:          detail.tenure,
      lga:             detail.lga,
      city:            detail.city,
      state:           detail.state,
      // Ownership & legal
      current_owner:           detail.current_owner,
      dispute_status:          detail.dispute_status,
      taxation:                detail.taxation,
      allocation_records:      detail.allocation_records,
      land_titles:             detail.land_titles,
      historical_transactions: detail.historical_transactions,
      // Land use
      preexisting_landuse: detail.preexisting_landuse,
      current_landuse:     detail.current_landuse,
      proposed_landuse:    detail.proposed_landuse,
      zoning:              detail.zoning,
      dev_control:         detail.dev_control,
      // Geospatial & physical
      slope:            detail.slope,
      elevation:        detail.elevation,
      soil_type:        detail.soil_type,
      bearing_capacity: detail.bearing_capacity,
      hydrology:        detail.hydrology,
      vegetation:       detail.vegetation,
      // Infrastructure & utilities
      road_type:        detail.road_type,
      road_category:    detail.road_category,
      road_condition:   detail.road_condition,
      electricity:      detail.electricity,
      water_supply:     detail.water_supply,
      sewage:           detail.sewage,
      other_facilities: detail.other_facilities,
      // Serialise comm_lines → [[network, strength], ...]
      comm_lines: detail.comm_lines
        .filter((r) => r.network)
        .map((r) => [r.network, Number(r.strength) || 0]),
      // neighbouring_transactions — send as array of objects
      neighbouring_transactions: detail.neighbouring_transactions
        .filter((r) => r.value !== "" && r.value !== null)
        .map((r) => ({
          plot_size:  r.plot_size  !== "" ? parseFloat(r.plot_size)  : null,
          year:       Number(r.year),
          value:      parseFloat(r.value),
          distance_m: r.distance_m !== "" ? parseFloat(r.distance_m) : null,
        })),
      // Valuation & fiscal
      overall_value:      detail.overall_value,
      current_land_value: detail.current_land_value,
      rental_pm:          detail.rental_pm,
      rental_pa:          detail.rental_pa,
      // Serialise valuation_history → [[year, month, value], ...]
      valuation_history: detail.valuation_history
        .filter((r) => r.value !== "" && r.value !== null)
        .map((r) => [Number(r.year), Number(r.month), parseFloat(r.value)]),
    };

    try {
      setLoading(true);

      // 1. Update land details
      await api.post(`/admin/lands/${id}`, buildFormData(payload, newImages, removeImages));

      // 2. Update price only if it changed
      const newPrice = parseInt(priceKobo) || 0;
      const oldPrice = parseInt(currentPriceKobo) || 0;
      if (newPrice !== oldPrice && newPrice > 0) {
        await api.patch(`/admin/lands/${id}/price`, { price_per_unit_kobo: newPrice });
      }

      toast.success("Land updated successfully");
      router.push("/admin/lands");
    } catch (err) {
      if (err.response?.data?.errors) {
        Object.values(err.response.data.errors).flat().forEach((e) => toast.error(e));
      } else {
        toast.error(err.response?.data?.message || "Update failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (fetching) return (
    <div className="min-h-screen bg-[#0D1F1A] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0D1F1A] relative" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <Link href="/admin/lands"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
          <ArrowLeft size={13} /> Back to Lands
        </Link>

        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2">Admin Panel</p>
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Edit Land</h1>
          <p className="text-white/40 mt-1 text-sm truncate">{form.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Basic Info ─────────────────────────────────────────────────── */}
          <FormSection title="Basic Info" icon={<FileText size={15} className="text-amber-500" />}>
            <FormField label="Land Title">
              <DarkInput name="title" value={form.title} onChange={handleChange} required />
            </FormField>
            <FormField label="Location">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                <DarkInput name="location" value={form.location} onChange={handleChange} className="pl-10" required />
              </div>
            </FormField>
            <FormField label="Description">
              <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none" />
            </FormField>
          </FormSection>

          {/* ── Units, Pricing & Availability ─────────────────────────────── */}
          <FormSection title="Units, Pricing & Availability" icon={<DollarSign size={15} className="text-amber-500" />}>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Size (sqm)">
                <DarkInput name="size" value={form.size} onChange={handleChange} required />
              </FormField>
              <FormField label="Total Units">
                <DarkInput name="total_units" value={form.total_units} onChange={handleChange} required />
                <p className="text-xs text-white/25 mt-1">Sold: {soldUnits}</p>
              </FormField>
            </div>

            {/* Price per unit — calls PATCH /price on submit if changed */}
            <FormField label="Price per Unit (Kobo)">
              <DarkInput
                type="text"
                inputMode="numeric"
                value={priceKobo}
                onChange={handlePriceChange}
                placeholder="e.g. 50000000"
              />
              <div className="flex items-center justify-between mt-1">
                {priceKobo ? (
                  <p className="text-xs text-white/30">= ₦{(Number(priceKobo) / 100).toLocaleString()}</p>
                ) : <span />}
                {priceKobo !== currentPriceKobo && (
                  <p className="text-xs text-amber-400/70">
                    Changed from ₦{(Number(currentPriceKobo) / 100).toLocaleString()} — will update price history
                  </p>
                )}
              </div>
            </FormField>

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm({ ...form, is_available: !form.is_available })}
                className={`relative w-11 h-6 rounded-full transition-all ${form.is_available ? "bg-emerald-500" : "bg-white/10"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.is_available ? "left-6" : "left-1"}`} />
              </button>
              <span className="text-sm text-white/60">{form.is_available ? "Available for purchase" : "Not available"}</span>
            </div>
          </FormSection>

          {/* ── Location Coordinates ───────────────────────────────────────── */}
          <FormSection title="Location Coordinates" icon={<Layers size={15} className="text-amber-500" />}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/40">
                Mode: <span className="text-white/70 font-semibold">{usePolygon ? "Polygon" : "Point"}</span>
                {initialHasPolygon && <span className="text-white/25 text-xs ml-2">(originally polygon)</span>}
              </p>
              <button type="button" onClick={toggleCoordinateMode}
                className="text-xs font-semibold text-amber-500 hover:text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-all">
                Switch to {usePolygon ? "Point" : "Polygon"}
              </button>
            </div>
            {!usePolygon ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Latitude"><DarkInput name="lat" value={form.lat} onChange={handleChange} /></FormField>
                <FormField label="Longitude"><DarkInput name="lng" value={form.lng} onChange={handleChange} /></FormField>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-white/10">
                <PolygonMapEditor polygon={form.polygon} onChange={handlePolygonChange} />
              </div>
            )}
            {usePolygon && form.polygon && (
              <p className="text-xs text-emerald-400 mt-2">
                ✓ Polygon: {form.polygon.coordinates?.[0]?.length - 1 ?? 0} points
              </p>
            )}
          </FormSection>

          {/* ── Administrative Information ─────────────────────────────────── */}
          <FormSection title="Administrative Information" icon={<Building2 size={15} className="text-amber-500" />}>
            <FormField label="Plot Identifier">
              <DarkInput value={detail.plot_identifier} onChange={(e) => setDetailField("plot_identifier", e.target.value)} placeholder="e.g. Plot 5, Block A" />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="LGA"><DarkInput value={detail.lga} onChange={(e) => setDetailField("lga", e.target.value)} /></FormField>
              <FormField label="City"><DarkInput value={detail.city} onChange={(e) => setDetailField("city", e.target.value)} /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="State"><DarkInput value={detail.state} onChange={(e) => setDetailField("state", e.target.value)} /></FormField>
              <FormField label="Tenure"><DarkInput value={detail.tenure} onChange={(e) => setDetailField("tenure", e.target.value)} placeholder="e.g. Leasehold, Freehold" /></FormField>
            </div>
            <FormField label="Allocation Records">
              <StringListEditor value={detail.allocation_records} onChange={(v) => setDetailField("allocation_records", v)} placeholder="e.g. Allocation ref #001" />
            </FormField>
          </FormSection>

          {/* ── Ownership & Legal ──────────────────────────────────────────── */}
          <FormSection title="Ownership & Legal" icon={<ShieldCheck size={15} className="text-amber-500" />}>
            <FormField label="Current Owner">
              <DarkInput value={detail.current_owner} onChange={(e) => setDetailField("current_owner", e.target.value)} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Dispute Status"><DarkInput value={detail.dispute_status} onChange={(e) => setDetailField("dispute_status", e.target.value)} placeholder="Nil / description" /></FormField>
              <FormField label="Taxation"><DarkInput value={detail.taxation} onChange={(e) => setDetailField("taxation", e.target.value)} placeholder="Nil / description" /></FormField>
            </div>
            <FormField label="Land Titles / Deeds">
              <StringListEditor value={detail.land_titles} onChange={(v) => setDetailField("land_titles", v)} placeholder="e.g. Certificate of Occupancy" />
            </FormField>
            <FormField label="Historical Transactions">
              <StringListEditor value={detail.historical_transactions} onChange={(v) => setDetailField("historical_transactions", v)} placeholder="e.g. Sold to XYZ in 2010" />
            </FormField>
          </FormSection>

          {/* ── Land Use ──────────────────────────────────────────────────── */}
          <FormSection title="Land Use" icon={<MapPin size={15} className="text-amber-500" />}>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Pre-existing"><DarkInput value={detail.preexisting_landuse} onChange={(e) => setDetailField("preexisting_landuse", e.target.value)} placeholder="e.g. Agricultural" /></FormField>
              <FormField label="Current"><DarkInput value={detail.current_landuse} onChange={(e) => setDetailField("current_landuse", e.target.value)} placeholder="e.g. Vacant" /></FormField>
              <FormField label="Proposed"><DarkInput value={detail.proposed_landuse} onChange={(e) => setDetailField("proposed_landuse", e.target.value)} placeholder="e.g. Residential" /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Zoning Regulations"><DarkInput value={detail.zoning} onChange={(e) => setDetailField("zoning", e.target.value)} placeholder="Nil / description" /></FormField>
              <FormField label="Development Control"><DarkInput value={detail.dev_control} onChange={(e) => setDetailField("dev_control", e.target.value)} placeholder="Nil / description" /></FormField>
            </div>
          </FormSection>

          {/* ── Geospatial & Physical ──────────────────────────────────────── */}
          <FormSection title="Geospatial & Physical" icon={<Activity size={15} className="text-amber-500" />}>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Slope (°)"><DarkInput type="number" value={detail.slope} onChange={(e) => setDetailField("slope", e.target.value)} placeholder="0" /></FormField>
              <FormField label="Elevation"><DarkInput type="number" value={detail.elevation} onChange={(e) => setDetailField("elevation", e.target.value)} placeholder="metres" /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Soil Type"><DarkInput value={detail.soil_type} onChange={(e) => setDetailField("soil_type", e.target.value)} /></FormField>
              <FormField label="Bearing Capacity"><DarkInput value={detail.bearing_capacity} onChange={(e) => setDetailField("bearing_capacity", e.target.value)} placeholder="Nil / description" /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Hydrology"><DarkInput value={detail.hydrology} onChange={(e) => setDetailField("hydrology", e.target.value)} placeholder="e.g. Drained" /></FormField>
              <FormField label="Vegetation"><DarkInput value={detail.vegetation} onChange={(e) => setDetailField("vegetation", e.target.value)} placeholder="e.g. Sparse grass" /></FormField>
            </div>
          </FormSection>

          {/* ── Infrastructure & Utilities ─────────────────────────────────── */}
          <FormSection title="Infrastructure & Utilities" icon={<Zap size={15} className="text-amber-500" />}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25 -mb-1">Road</p>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Type"><DarkInput value={detail.road_type} onChange={(e) => setDetailField("road_type", e.target.value)} placeholder="e.g. Tarred" /></FormField>
              <FormField label="Category"><DarkInput value={detail.road_category} onChange={(e) => setDetailField("road_category", e.target.value)} placeholder="e.g. Federal" /></FormField>
              <FormField label="Condition"><DarkInput value={detail.road_condition} onChange={(e) => setDetailField("road_condition", e.target.value)} placeholder="e.g. Good" /></FormField>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25 -mb-1 pt-2">Utilities</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Electricity"><DarkInput value={detail.electricity} onChange={(e) => setDetailField("electricity", e.target.value)} placeholder="Nil / PHCN / Solar" /></FormField>
              <FormField label="Water Supply"><DarkInput value={detail.water_supply} onChange={(e) => setDetailField("water_supply", e.target.value)} placeholder="Nil / Borehole / Mains" /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Sewage"><DarkInput value={detail.sewage} onChange={(e) => setDetailField("sewage", e.target.value)} placeholder="Nil / Septic / Mains" /></FormField>
              <FormField label="Other Facilities"><DarkInput value={detail.other_facilities} onChange={(e) => setDetailField("other_facilities", e.target.value)} placeholder="e.g. Street lighting" /></FormField>
            </div>
            <FormField label="Communication Lines">
              <CommLinesEditor value={detail.comm_lines} onChange={(v) => setDetailField("comm_lines", v)} />
            </FormField>
          </FormSection>

          {/* ── Valuation & Fiscal ────────────────────────────────────────── */}
          <FormSection title="Valuation & Fiscal" icon={<BarChart3 size={15} className="text-amber-500" />}>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Overall Value (₦)">
                <DarkInput type="number" min={0} value={detail.overall_value} onChange={(e) => setDetailField("overall_value", e.target.value)} placeholder="0" />
              </FormField>
              <FormField label="Current Land Value (₦)">
                <DarkInput type="number" min={0} value={detail.current_land_value} onChange={(e) => setDetailField("current_land_value", e.target.value)} placeholder="0"/>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Rental Value p/m (₦)">
                <DarkInput type="number" min={0} value={detail.rental_pm} onChange={(e) => setDetailField("rental_pm", e.target.value)} placeholder="0" />
              </FormField>
              <FormField label="Rental Value p/a (₦)">
                <DarkInput type="number" min={0} value={detail.rental_pa} onChange={(e) => setDetailField("rental_pa", e.target.value)} placeholder="0" />
              </FormField>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25 mb-3 pt-2">
                Valuation History
                <span className="normal-case font-normal text-white/20 ml-2">— newest entry auto-updates Current Land Value</span>
              </p>
              <ValuationHistoryEditor value={detail.valuation_history} onChange={(v) => setDetailField("valuation_history", v)} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25 mb-3 pt-2">
                Neighbouring Transactions
                <span className="normal-case font-normal text-white/20 ml-2">— comparable sales in the area</span>
              </p>
              <NeighbouringTransactionsEditor
                value={detail.neighbouring_transactions}
                onChange={(v) => setDetailField("neighbouring_transactions", v)}
              />
            </div>
          </FormSection>

          {/* ── Images ────────────────────────────────────────────────────── */}
          <FormSection title="Images" icon={<FileText size={15} className="text-amber-500" />}>
            {existingImages.length > 0 && (
              <div>
                <p className="text-xs text-white/30 uppercase tracking-widest font-bold mb-2">Current Images</p>
                <div className="grid grid-cols-3 gap-3">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative rounded-xl overflow-hidden aspect-video border border-white/10 group">
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(img.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <label className={`flex flex-col items-center justify-center w-full h-24 rounded-xl border-2 border-dashed bg-white/5 cursor-pointer transition-all ${compressing ? "border-amber-500/60 animate-pulse" : "border-white/15 hover:border-amber-500/40"}`}>
              {compressing ? (
                <>
                  <div className="w-5 h-5 border-2 border-amber-500/50 border-t-amber-500 rounded-full animate-spin mb-1" />
                  <span className="text-xs text-amber-500/70">Compressing…</span>
                </>
              ) : (
                <span className="text-xs text-white/30">+ Add more images</span>
              )}
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {newImagePreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {newImagePreviews.map((src, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden aspect-video border border-amber-500/20 group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 text-[10px] bg-amber-500 text-[#0D1F1A] px-1.5 py-0.5 rounded font-bold">NEW</div>
                    <button type="button" onClick={() => removeNewImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          {/* ── Submit ────────────────────────────────────────────────────── */}
          <button type="submit" disabled={loading || compressing}
            className="w-full py-4 rounded-xl font-bold text-[#0D1F1A] flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
            {compressing
              ? <><div className="w-4 h-4 border-2 border-[#0D1F1A]/40 border-t-[#0D1F1A] rounded-full animate-spin" />Compressing...</>
              : loading
              ? <><div className="w-4 h-4 border-2 border-[#0D1F1A]/40 border-t-[#0D1F1A] rounded-full animate-spin" />Saving...</>
              : <><Save size={15} /> Update Land</>}
          </button>
        </form>
      </div>
    </div>
  );
}