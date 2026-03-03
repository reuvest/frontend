"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
  LayersControl,
  AttributionControl,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

/* ===================== MONEY ===================== */
const koboToNaira = (kobo) => Number(kobo) / 100;

/**
 * Price helper — mirrors getLandPrice() in the parent pages.
 * Handles: latestPrice relation (snake or camel), or direct field.
 */
function getLandPrice(land) {
  return (
    land.latest_price?.price_per_unit_kobo
    ?? land.latestPrice?.price_per_unit_kobo
    ?? land.price_per_unit_kobo
    ?? 0
  );
}

/* ===================== COLOR ===================== */
function getPriceColor(priceNaira) {
  if (priceNaira < 2000) return "#22c55e";
  if (priceNaira < 5000) return "#f59e0b";
  return "#ef4444";
}
function getUnitOpacity(units) {
  if (units > 50) return 1;
  if (units > 10) return 0.8;
  return 0.6;
}

/* ===================== MARKER ICON ===================== */
function createMarkerIcon({ priceKobo, units, active }) {
  const priceNaira = koboToNaira(priceKobo ?? 0); // FIX: guard undefined
  return L.divIcon({
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    html: `
      <div class="relative">
        ${active ? `<span class="pulse-ring"></span>` : ""}
        <div
          style="
            width:20px;height:20px;border-radius:50%;
            background:${getPriceColor(priceNaira)};
            opacity:${getUnitOpacity(units ?? 0)};
            border:2px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.4);
          "
        ></div>
      </div>
    `,
  });
}

/* ===================== MAP HELPERS ===================== */
function MapFlyController({ target }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 16, { animate: true, duration: 1.2 });
  }, [target, map]);
  return null;
}

function FitBounds({ points }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!points.length || done.current) return;
    map.fitBounds(points, { padding: [50, 50] });
    done.current = true;
  }, [points, map]);
  return null;
}

/**
 * FIX: was always passed isFullScreen={false} so never actually fired on
 * fullscreen toggle. Now accepts the real value, and guards against calling
 * invalidateSize() on an unmounted / uninitialised map.
 */
function MapInvalidate({ isFullScreen }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        // Guard: map container must exist and have its pane element
        if (map && map.getContainer()) {
          map.invalidateSize();
        }
      } catch {
        // Map was unmounted — ignore
      }
    }, 300);
    return () => clearTimeout(t);
  }, [isFullScreen, map]);
  return null;
}

function MapRefSetter({ onMapReady }) {
  const map = useMap();
  useEffect(() => { onMapReady(map); }, [map, onMapReady]);
  return null;
}

function ZoomTracker({ onZoomChange }) {
  const map = useMap();
  useEffect(() => {
    const onZoom = () => onZoomChange(map.getZoom());
    onZoomChange(map.getZoom());
    map.on("zoom", onZoom);
    return () => map.off("zoom", onZoom);
  }, [map, onZoomChange]);
  return null;
}

function MoveEndTracker({ onMoveEnd }) {
  const map = useMap();
  useEffect(() => {
    const handler = () => onMoveEnd(map.getBounds());
    map.on("moveend", handler);
    return () => map.off("moveend", handler);
  }, [map, onMoveEnd]);
  return null;
}

function HeatmapLayer({ lands }) {
  const map = useMap();
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) { map.removeLayer(ref.current); ref.current = null; }
    if (!lands.length) return;

    // leaflet.heat patches L as a side effect — guard in case it hasn't loaded yet
    if (typeof L.heatLayer !== "function") {
      console.warn("[LandMap] leaflet.heat not available — heatmap skipped");
      return;
    }

    const pts = lands
      .filter((l) => l.lat && l.lng) // skip lands without coords
      .map((l) => [+l.lat, +l.lng, Math.max(0.1, Math.min(l.heat ?? 0.5, 1))]);

    if (!pts.length) return;

    const layer = L.heatLayer(pts, {
      radius: 50, blur: 30, maxZoom: 17, max: 1.0, minOpacity: 0.4,
      gradient: {
        0.0: "rgba(59,130,246,0)",   0.2: "rgba(16,185,129,0.6)",
        0.4: "rgba(251,191,36,0.7)", 0.6: "rgba(245,158,11,0.8)",
        0.8: "rgba(239,68,68,0.9)",  1.0: "rgba(220,38,38,1)",
      },
    });
    layer.addTo(map);
    ref.current = layer;
    return () => { if (ref.current) { map.removeLayer(ref.current); ref.current = null; } };
  }, [lands, map]);
  return null;
}

/* ===================== POPUP CONTENT ===================== */
function LandPopup({ land }) {
  const priceKobo = getLandPrice(land); // FIX: use helper instead of direct field
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", minWidth: 180 }}>
      <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 14, color: "#0D1F1A", marginBottom: 4 }}>
        {land.title}
      </p>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{land.location}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: "#b45309", marginBottom: 2 }}>
        {priceKobo > 0
          ? `₦${koboToNaira(priceKobo).toLocaleString()}/unit`
          : "Price on request"}
      </p>
      <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
        {land.available_units?.toLocaleString() ?? "—"} units available
      </p>
      <Link
        href={`/lands/${land.id}`}
        style={{ fontSize: 12, color: "#b45309", fontWeight: 600, textDecoration: "none" }}
      >
        View Details →
      </Link>
    </div>
  );
}

/* ===================== MAIN EXPORT ===================== */
export default function LandMap({
  defaultCenter,
  allMapPoints,
  landsWithPoints,
  landsWithPolygons,
  allLandsWithCoords,
  activeLandId,
  hoverLandId,
  flyTarget,
  showHeatmap,
  currentZoom,
  onZoomChange,
  onMoveEnd,
  onMapReady,
  isFullScreen = false, // FIX: accept real prop — was hardcoded false before
  className = "h-full w-full",
}) {
  const showPolygonMarkers = currentZoom < 12;

  return (
    <MapContainer
      attributionControl={false}
      center={defaultCenter}
      zoom={8}
      className={className}
    >
      <AttributionControl prefix={false} />
      <MapRefSetter onMapReady={onMapReady} />
      <ZoomTracker onZoomChange={onZoomChange} />
      <MoveEndTracker onMoveEnd={onMoveEnd} />
      <MapInvalidate isFullScreen={isFullScreen} /> {/* FIX: real prop, not hardcoded false */}

      <LayersControl position="topleft">
        <LayersControl.BaseLayer checked name="Street">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri, Maxar"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Terrain">
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenTopoMap"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {!showHeatmap && (
        <>
          <MarkerClusterGroup>
            {landsWithPoints.map((land) => (
              <Marker
                key={land.id}
                position={[+land.lat, +land.lng]}
                icon={createMarkerIcon({
                  priceKobo: getLandPrice(land), // FIX: use helper
                  units: land.available_units,
                  active: land.id === activeLandId || land.id === hoverLandId,
                })}
              >
                <Popup><LandPopup land={land} /></Popup>
              </Marker>
            ))}

            {showPolygonMarkers &&
              landsWithPolygons.map((land) => (
                <Marker
                  key={`marker-${land.id}`}
                  position={[+land.lat, +land.lng]}
                  icon={createMarkerIcon({
                    priceKobo: getLandPrice(land), // FIX: use helper
                    units: land.available_units,
                    active: land.id === activeLandId || land.id === hoverLandId,
                  })}
                >
                  <Popup><LandPopup land={land} /></Popup>
                </Marker>
              ))}
          </MarkerClusterGroup>

          {!showPolygonMarkers &&
            landsWithPolygons.map((land) => {
              const active     = land.id === activeLandId || land.id === hoverLandId;
              const priceKobo  = getLandPrice(land); // FIX: use helper
              const color      = getPriceColor(koboToNaira(priceKobo));
              return (
                <Polygon
                  key={`polygon-${land.id}`}
                  positions={land.polygon.map((p) => [p.lat, p.lng])}
                  pathOptions={{
                    color, fillColor: color,
                    fillOpacity: active ? 0.5 : 0.3,
                    weight: active ? 3 : 2,
                  }}
                >
                  <Popup><LandPopup land={land} /></Popup>
                </Polygon>
              );
            })}
        </>
      )}

      {showHeatmap && <HeatmapLayer lands={allLandsWithCoords} />}

      <FitBounds points={allMapPoints} />
      <MapFlyController target={flyTarget} />
    </MapContainer>
  );
}