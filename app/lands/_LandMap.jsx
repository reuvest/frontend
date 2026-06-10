"use client";

import React, { useEffect, useRef, useCallback } from "react";
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
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ===================== DYNAMIC CLUSTER ===================== */
const MarkerClusterGroup = dynamic(
  () => import("react-leaflet-cluster").then((m) => m.default || m),
  { ssr: false }
);

/* ===================== HEAT LOADER ===================== */
let heatLoaded = false;

function useLeafletHeat() {
  useEffect(() => {
    if (heatLoaded) return;
    import("leaflet.heat").then(() => {
      heatLoaded = true;
    });
  }, []);
}

/* ===================== ICON CACHE ===================== */
const iconCache = new Map();

/* ===================== HELPERS ===================== */

const koboToNaira = (kobo) => Number(kobo) / 100;

function getLandPrice(land) {
  return (
    land.latest_price?.price_per_unit_kobo ??
    land.latestPrice?.price_per_unit_kobo ??
    land.price_per_unit_kobo ??
    0
  );
}

function getPriceColor(naira) {
  if (naira < 200_000) return "#22c55e";
  if (naira < 500_000) return "#f59e0b";
  return "#ef4444";
}

function decodeEWKB(hex) {
  if (!hex || typeof hex !== "string") return null;
  try {
    const buf = new Uint8Array(hex.match(/.{1,2}/g).map((b) => parseInt(b, 16)));
    const view = new DataView(buf.buffer);
    const le = buf[0] === 1;
    const rd32 = (o) => view.getUint32(o, le);
    const rdF64 = (o) => view.getFloat64(o, le);
    const wkbType = rd32(1);
    const hasSRID = (wkbType & 0x20000000) !== 0;
    let offset = 5;
    if (hasSRID) offset += 4;
    const numRings = rd32(offset);
    offset += 4;
    if (numRings < 1) return null;
    const numPoints = rd32(offset);
    offset += 4;
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const x = rdF64(offset);
      offset += 8;
      const y = rdF64(offset);
      offset += 8;
      points.push([y, x]);
    }
    if (points.length > 1) {
      const first = points[0];
      const last = points[points.length - 1];
      if (first[0] === last[0] && first[1] === last[1]) points.pop();
    }
    return points.length >= 3 ? points : null;
  } catch {
    return null;
  }
}

function parsePolygon(land) {
  const geo = land.geometry_geojson;
  if (geo?.type === "Polygon" && Array.isArray(geo.coordinates))
    return geo.coordinates[0].map(([lng, lat]) => [lat, lng]);

  if (
    geo?.type === "Polygon" &&
    land.coordinates &&
    typeof land.coordinates === "string"
  ) {
    const decoded = decodeEWKB(land.coordinates);
    if (decoded) return decoded;
  }

  const raw = land.polygon;
  if (!raw) return null;

  if (raw?.type === "Polygon" && Array.isArray(raw.coordinates))
    return raw.coordinates[0].map(([lng, lat]) => [lat, lng]);

  if (typeof raw === "string") {
    const inner = raw.match(/POLYGON\s*\(\(([^)]+)\)/i)?.[1];
    if (!inner) return null;
    return inner.split(",").map((pair) => {
      const [lng, lat] = pair.trim().split(/\s+/).map(Number);
      return [lat, lng];
    });
  }

  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (Array.isArray(first)) return raw.map(([lat, lng]) => [lat, lng]);
    if (first?.lat != null) return raw.map((p) => [+p.lat, +p.lng]);
    if (first?.latitude != null)
      return raw.map((p) => [+p.latitude, +p.longitude]);
  }

  return null;
}

function centroid(points) {
  const lat = points.reduce((s, p) => s + p[0], 0) / points.length;
  const lng = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [lat, lng];
}

function createMarkerIcon({ priceKobo, isActive }) {
  const naira = koboToNaira(priceKobo);
  const color = getPriceColor(naira);
  const key = `${color}-${isActive ? 1 : 0}`;

  if (iconCache.has(key)) return iconCache.get(key);

  const icon = isActive
    ? L.divIcon({
        className: "",
        iconSize: [44, 52],
        iconAnchor: [22, 52],
        html: `
          <div style="position:relative;width:44px;height:52px;display:flex;flex-direction:column;align-items:center;">
            <div
              class="lm-pulse"
              style="width:36px;height:36px;border-radius:50%;background:${color};border:3px solid white;--pulse-color:${color}55;"
            ></div>
            <div style="width:2px;height:14px;background:white;margin-top:2px;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>
          </div>
        `,
      })
    : L.divIcon({
        className: "",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        html: `
          <div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
        `,
      });

  iconCache.set(key, icon);
  return icon;
}

/* ===================== FLY + POPUP CONTROLLER ===================== */

function FlyAndPopup({ flyTarget, activeLandId, markerRefs, polygonRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!flyTarget || !map || !activeLandId) return;

    map.flyTo([flyTarget.lat, flyTarget.lng], 16, {
      duration: 1.6,
      easeLinearity: 0.2,
    });

    const openPopup = () => {
      setTimeout(() => {
        const markerRef =
          markerRefs.current[`${activeLandId}-centroid`] ??
          markerRefs.current[activeLandId];

        if (markerRef) {
          markerRef.openPopup();
          return;
        }
        const polyRef = polygonRefs.current[activeLandId];
        if (polyRef) polyRef.openPopup(polyRef.getBounds().getCenter());
      }, 120);
    };

    map.once("zoomend", openPopup);
    return () => map.off("zoomend", openPopup);
  }, [flyTarget, activeLandId, map]);

  return null;
}

/* ===================== MOVE END HANDLER ===================== */

function MoveEndHandler({ onMoveEnd, onZoomChange }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const handler = () => {
      onMoveEnd?.(map.getBounds());
      onZoomChange?.(map.getZoom());
    };
    map.on("moveend", handler);
    return () => map.off("moveend", handler);
  }, [map, onMoveEnd, onZoomChange]);

  return null;
}

/* ===================== HEATMAP ===================== */

function HeatmapLayer({ lands }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (!lands?.length || typeof L.heatLayer !== "function") return;

    const points = lands
      .filter((l) => l.lat && l.lng)
      .map((l) => [+l.lat, +l.lng, 0.6]);
    if (!points.length) return;

    const heat = L.heatLayer(points, { radius: 45, blur: 25, maxZoom: 17 });
    heat.addTo(map);
    layerRef.current = heat;

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [lands, map]);

  return null;
}

/* ===================== POPUP CARD ===================== */

function LandPopup({ land }) {
  const priceKobo = getLandPrice(land);
  const priceNaira = koboToNaira(priceKobo);

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        minWidth: "200px",
        padding: "2px 0",
      }}
    >
      <p
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          fontSize: "15px",
          color: "#1a1a1a",
          marginBottom: "4px",
          lineHeight: 1.3,
        }}
      >
        {land.title}
      </p>
      <p style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>
        📍 {land.location}
      </p>
      {priceKobo > 0 && (
        <p
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#C8873A",
            marginBottom: "10px",
          }}
        >
          ₦{priceNaira.toLocaleString()}
          <span
            style={{ fontWeight: 400, color: "#999", fontSize: "11px" }}
          >
            {" "}
            / unit
          </span>
        </p>
      )}
      <a
        href={`/lands/${land.id}`}
        style={{
          display: "block",
          textAlign: "center",
          padding: "8px 16px",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)",
          color: "#0D1F1A",
          fontWeight: 700,
          fontSize: "12px",
          textDecoration: "none",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        View Details →
      </a>
    </div>
  );
}

/* ===================== MAIN MAP ===================== */

export default function LandMap({
  defaultCenter,
  landsWithPoints,
  landsWithPolygons,
  allLandsWithCoords,
  activeLandId,
  hoverLandId,
  flyTarget,
  showHeatmap,
  onMoveEnd,
  onZoomChange,
}) {
  useLeafletHeat();

  const markerRefs = useRef({});
  const polygonRefs = useRef({});

  const setMarkerRef = useCallback((id, ref) => {
    if (ref) markerRefs.current[id] = ref;
  }, []);

  const setCentroidRef = useCallback((id, ref) => {
    if (ref) markerRefs.current[`${id}-centroid`] = ref;
  }, []);

  const setPolygonRef = useCallback((id, ref) => {
    if (ref) polygonRefs.current[id] = ref;
  }, []);

  return (
    <MapContainer
      center={defaultCenter}
      zoom={8}
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
      attributionControl={false}
    >
      <AttributionControl prefix={false} />
      <MoveEndHandler onMoveEnd={onMoveEnd} onZoomChange={onZoomChange} />
      <FlyAndPopup
        flyTarget={flyTarget}
        activeLandId={activeLandId}
        markerRefs={markerRefs}
        polygonRefs={polygonRefs}
      />

      <LayersControl position="topleft">
        <LayersControl.BaseLayer checked name="Street">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
            detectRetina={true}
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="© Esri"
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Terrain">
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution="© OpenTopoMap"
            maxZoom={17}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {/* POINT MARKERS */}
      {!showHeatmap && (
        <MarkerClusterGroup>
          {landsWithPoints.map((land) => {
            const isActive = activeLandId === land.id;
            const isHovered = hoverLandId === land.id;
            return (
              <Marker
                key={land.id}
                position={[+land.lat, +land.lng]}
                icon={createMarkerIcon({
                  priceKobo: getLandPrice(land),
                  isActive: isActive || isHovered,
                })}
                ref={(ref) => setMarkerRef(land.id, ref)}
                zIndexOffset={isActive ? 1000 : 0}
                title={land.title}
                alt={land.title}
              >
                <Popup offset={[0, -20]} closeButton={false} className="land-popup">
                  <LandPopup land={land} />
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>
      )}

      {/* POLYGONS + CENTROID MARKERS */}
      {!showHeatmap &&
        landsWithPolygons.map((land) => {
          const isActive = activeLandId === land.id;
          const isHovered = hoverLandId === land.id;
          const highlight = isActive || isHovered;
          const points = parsePolygon(land);
          if (!points || points.length < 3) return null;
          const center = centroid(points);

          return (
            <React.Fragment key={land.id}>
              <Polygon
                positions={points}
                pathOptions={{
                  color: highlight ? "#E8A850" : "#f59e0b",
                  fillColor: highlight ? "#E8A850" : "#f59e0b",
                  fillOpacity: highlight ? 0.35 : 0.18,
                  weight: highlight ? 3 : 1.5,
                  opacity: 1,
                }}
                ref={(ref) => setPolygonRef(land.id, ref)}
              >
                <Popup closeButton={false} className="land-popup">
                  <LandPopup land={land} />
                </Popup>
              </Polygon>

              <Marker
                position={center}
                icon={createMarkerIcon({
                  priceKobo: getLandPrice(land),
                  isActive: highlight,
                })}
                ref={(ref) => setCentroidRef(land.id, ref)}
                zIndexOffset={highlight ? 1000 : 0}
                title={land.title}
                alt={land.title}
              >
                <Popup offset={[0, -20]} closeButton={false} className="land-popup">
                  <LandPopup land={land} />
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

      {/* HEATMAP */}
      {showHeatmap && <HeatmapLayer lands={allLandsWithCoords} />}
    </MapContainer>
  );
}