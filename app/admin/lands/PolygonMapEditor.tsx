"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type * as LType from "leaflet";

// ── Leaflet is loaded lazily inside useEffect to avoid SSR crashes.
// Never import leaflet or leaflet-draw at the module top-level.

/** Minimal GeoJSON Polygon shape used throughout this file. */
export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

interface PolygonMapEditorProps {
  polygon: GeoJSONPolygon | null;
  onChange: (polygon: GeoJSONPolygon | null) => void;
}

type InputMode = "draw" | "manual" | "upload";

export default function PolygonMapEditor({ polygon, onChange }: PolygonMapEditorProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);
  const drawnItemsRef = useRef<LType.FeatureGroup | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("draw");
  const [manualInput, setManualInput] = useState("");
  const [pointsList, setPointsList] = useState<number[][]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Dynamically import leaflet only on the client, inside useEffect.
    // This is the correct pattern for any library that touches `window` at import time.
    let map: LType.Map | undefined;

    const init = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet-draw");
      // global.d.ts declares an ambient *.css module, so these need no suppression
      await import("leaflet/dist/leaflet.css");
      await import("leaflet-draw/dist/leaflet.draw.css");

      // Fix default icon URLs (broken by webpack asset hashing).
      // _getIconUrl is a real internal Leaflet property but isn't part of
      // the public @types/leaflet surface — this is the standard documented
      // workaround, so the `any` here is deliberate and narrowly scoped.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current || mapInstanceRef.current) return;

      const center = polygon ? getCenterFromPolygon(polygon) : [6.5244, 3.3792];
      map = L.map(mapRef.current).setView(center as LType.LatLngExpression, polygon ? 15 : 12);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);
      drawnItemsRef.current = drawnItems;

      const drawControl = new L.Control.Draw({
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: { color: "#C8873A", fillOpacity: 0.2 },
          },
          polyline: false, rectangle: false,
          circle: false, marker: false, circlemarker: false,
        } as L.Control.DrawConstructorOptions["draw"],
        edit: { featureGroup: drawnItems },
      });
      map.addControl(drawControl);

      map.on(L.Draw.Event.CREATED, (e: LType.LeafletEvent) => {
        const created = e as LType.DrawEvents.Created;
        drawnItems.clearLayers();
        drawnItems.addLayer(created.layer);
        onChange(layerToGeoJSON(created.layer as LType.Polygon));
      });

      map.on(L.Draw.Event.EDITED, (e: LType.LeafletEvent) => {
        const edited = e as LType.DrawEvents.Edited;
        edited.layers.eachLayer((layer: LType.Layer) => onChange(layerToGeoJSON(layer as LType.Polygon)));
      });

      map.on(L.Draw.Event.DELETED, () => onChange(null));

      if (polygon) loadExistingPolygon(drawnItems, polygon, map);
    };

    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-draw when polygon prop changes externally (e.g. cleared by parent)
  useEffect(() => {
    if (!drawnItemsRef.current || !mapInstanceRef.current) return;
    drawnItemsRef.current.clearLayers();
    if (polygon) loadExistingPolygon(drawnItemsRef.current, polygon, mapInstanceRef.current);
  }, [polygon]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const loadExistingPolygon = async (drawnItems: LType.FeatureGroup, geoJsonPolygon: GeoJSONPolygon, map: LType.Map) => {
    if (!geoJsonPolygon?.coordinates?.[0]) return;
    const L = (await import("leaflet")).default;
    const latLngs = geoJsonPolygon.coordinates[0].map(([lng, lat]) => [lat, lng] as [number, number]);
    const poly = L.polygon(latLngs, { color: "#C8873A", fillOpacity: 0.2 });
    drawnItems.addLayer(poly);
    map.fitBounds(poly.getBounds());
  };

  const layerToGeoJSON = (layer: LType.Polygon): GeoJSONPolygon => {
    const latLngs = (layer.getLatLngs()[0] as LType.LatLng[]);
    const coordinates = latLngs.map((ll) => [ll.lng, ll.lat]);
    coordinates.push(coordinates[0]);
    return { type: "Polygon", coordinates: [coordinates] };
  };

  const getCenterFromPolygon = (p: GeoJSONPolygon | null): [number, number] => {
    if (!p?.coordinates?.[0]) return [6.5244, 3.3792];
    const coords = p.coordinates[0];
    return [
      coords.reduce((s, [, lat]) => s + lat, 0) / coords.length,
      coords.reduce((s, [lng]) => s + lng, 0) / coords.length,
    ];
  };

  // ── Manual / file input handlers ─────────────────────────────────────────

  const handleManualSubmit = () => {
    setError("");
    try {
      const parsed = JSON.parse(manualInput);
      if (parsed.type !== "Polygon") throw new Error("GeoJSON type must be 'Polygon'");
      if (!Array.isArray(parsed.coordinates?.[0])) throw new Error("Invalid coordinates structure");
      const coords = parsed.coordinates[0];
      if (coords.length < 4) throw new Error("Polygon must have at least 4 points");
      const [first, last] = [coords[0], coords[coords.length - 1]];
      if (first[0] !== last[0] || first[1] !== last[1]) throw new Error("Polygon must be closed");
      onChange(parsed);
      setManualInput("");
      setInputMode("draw");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid GeoJSON");
    }
  };

  const handleAddPoint = (lat: string, lng: string) => {
    setError("");
    if (!lat || !lng) { setError("Both latitude and longitude are required"); return; }
    const latNum = parseFloat(lat), lngNum = parseFloat(lng);
    if (isNaN(latNum) || isNaN(lngNum)) { setError("Invalid coordinate values"); return; }
    setPointsList([...pointsList, [lngNum, latNum]]);
  };

  const handleCreateFromPoints = () => {
    if (pointsList.length < 3) { setError("At least 3 points required"); return; }
    onChange({ type: "Polygon", coordinates: [[...pointsList, pointsList[0]]] });
    setPointsList([]);
    setInputMode("draw");
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        let poly: GeoJSONPolygon;
        if (json.type === "Feature" && json.geometry?.type === "Polygon") poly = json.geometry;
        else if (json.type === "Polygon") poly = json;
        else if (json.type === "FeatureCollection" && json.features?.[0]?.geometry?.type === "Polygon") poly = json.features[0].geometry;
        else throw new Error("File must contain a Polygon geometry");
        onChange(poly);
        setInputMode("draw");
      } catch (err) {
        setError("Invalid GeoJSON: " + (err instanceof Error ? err.message : "unknown error"));
      }
    };
    reader.readAsText(file);
  };

  const tabs: { id: InputMode; label: string }[] = [
    { id: "draw",   label: "Draw on Map" },
    { id: "manual", label: "Paste JSON"  },
    { id: "upload", label: "Upload File" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3 p-4 bg-white/5">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setInputMode(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              inputMode === tab.id ? "bg-white/10 text-white" : "text-white/60 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs">
          <span className="mt-0.5">⚠</span><span>{error}</span>
        </div>
      )}

      {/* Map container — always rendered so the ref is available for leaflet */}
      <div ref={mapRef} className="w-full h-80 rounded-xl border border-white/10 z-0 overflow-hidden" />

      {/* Draw mode hint */}
      {inputMode === "draw" && (
        <div className="text-xs text-white/55 bg-white/5 border border-white/5 rounded-xl p-3 space-y-1">
          <p className="font-semibold text-white/60 mb-1.5">How to draw:</p>
          <p>1. Click the polygon icon (⬟) in the map controls</p>
          <p>2. Click the map to add points</p>
          <p>3. Click the first point again to close the shape</p>
          {polygon && (
            <p className="text-emerald-400 mt-2">✓ Polygon ready ({polygon.coordinates[0].length - 1} points)</p>
          )}
        </div>
      )}

      {/* Manual JSON input */}
      {inputMode === "manual" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/55 uppercase tracking-widest font-bold mb-2">Paste GeoJSON</label>
              <textarea
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder={'{"type":"Polygon","coordinates":[[[lng,lat],...]]}'}
                rows={5}
                className="w-full bg-white/5 border border-white/10 focus:border-amber-500/40 text-white/70 placeholder-white/15 rounded-xl px-3 py-2.5 text-xs font-mono outline-none transition-all resize-none"
              />
              <button
                type="button"
                onClick={handleManualSubmit}
                className="mt-2 w-full py-2.5 rounded-xl text-xs font-bold text-[#0D1F1A] transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
              >
                Load from JSON
              </button>
            </div>
            <div>
              <label className="block text-xs text-white/55 uppercase tracking-widest font-bold mb-2">Add Points</label>
              <PointInput onAdd={handleAddPoint} />
              {pointsList.length > 0 && (
                <div className="mt-2 max-h-36 overflow-y-auto space-y-1 border border-white/10 rounded-xl p-2 bg-white/5">
                  {pointsList.map((point, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                      <span className="font-mono text-white/50">{i + 1}. [{point[1].toFixed(4)}, {point[0].toFixed(4)}]</span>
                      <button
                        type="button"
                        onClick={() => setPointsList(pointsList.filter((_, idx) => idx !== i))}
                        className="text-red-400/60 hover:text-red-400 transition-colors ml-2"
                      >✕</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleCreateFromPoints}
                    disabled={pointsList.length < 3}
                    className="w-full mt-1 py-1.5 rounded-lg text-xs font-bold text-[#0D1F1A] disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
                  >
                    Create Polygon
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File upload */}
      {inputMode === "upload" && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <label className="block text-xs text-white/55 uppercase tracking-widest font-bold mb-3">Upload GeoJSON File</label>
          <label className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-white/15 hover:border-amber-500/40 rounded-xl cursor-pointer transition-all">
            <span className="text-xs text-white/55">Click to select .json or .geojson</span>
            <input type="file" accept=".json,.geojson" onChange={handleFileUpload} className="hidden" />
          </label>
          <p className="text-xs text-white/20 mt-2">Supports: GeoJSON Polygon, Feature, or FeatureCollection</p>
        </div>
      )}

      {/* Current polygon preview */}
      {polygon && (
        <details className="group">
          <summary className="text-xs text-white/25 cursor-pointer hover:text-white/60 transition-colors select-none">
            View raw GeoJSON ▸
          </summary>
          <pre className="mt-2 text-[10px] font-mono text-white/55 bg-white/5 border border-white/5 rounded-xl p-3 overflow-x-auto">
            {JSON.stringify(polygon, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

interface PointInputProps {
  onAdd: (lat: string, lng: string) => void;
}

function PointInput({ onAdd }: PointInputProps) {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const handleAdd = () => {
    onAdd(lat, lng);
    setLat(""); setLng("");
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text" value={lat} onChange={(e) => setLat(e.target.value)}
          placeholder="Latitude"
          className="w-full bg-white/5 border border-white/10 focus:border-amber-500/40 text-white placeholder-white/20 px-3 py-2.5 rounded-xl text-xs outline-none transition-all"
        />
        <input
          type="text" value={lng} onChange={(e) => setLng(e.target.value)}
          placeholder="Longitude"
          className="w-full bg-white/5 border border-white/10 focus:border-amber-500/40 text-white placeholder-white/20 px-3 py-2.5 rounded-xl text-xs outline-none transition-all"
        />
      </div>
      <button
        type="button" onClick={handleAdd}
        className="w-full py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white border border-white/10 hover:bg-white/10 transition-all"
      >
        + Add Point
      </button>
    </div>
  );
}