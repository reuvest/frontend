"use client";

/// <reference path="./leaflet-heat.d.ts" />
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

// react-leaflet v5's bundled component types don't resolve cleanly against
// this project's React 19 type defs (RefAttributes/IntrinsicAttributes
// mismatch) — same incompatibility PolygonMapEditor.tsx documents for raw
// leaflet. Re-typed here as permissive components rather than fighting a
// third-party types/React-version mismatch; runtime behavior is unchanged.
const MapContainerX = MapContainer as unknown as React.ComponentType<any>;
const TileLayerX = TileLayer as unknown as React.ComponentType<any>;
const MarkerX = Marker as unknown as React.ComponentType<any>;
const PopupX = Popup as unknown as React.ComponentType<any>;
const PolygonX = Polygon as unknown as React.ComponentType<any>;
const LayersControlX = LayersControl as unknown as React.ComponentType<any> & {
  BaseLayer: React.ComponentType<any>;
};

/* ===================== SHARED TYPES ===================== */

type LatLngTuple = [number, number];
// Leaflet's own type exports collide with the `export as namespace L` UMD
// declaration once react-leaflet is also in scope, so these are derived
// from runtime values instead of imported directly (same workaround
// PolygonMapEditor.tsx documents for this repo's leaflet setup).
type DivIcon = ReturnType<typeof L.divIcon>;
type LeafletLayer = ReturnType<typeof L.layerGroup>;
type LatLngLike = LatLngTuple | { lat: number; lng: number };

interface MapLand {
  id: string | number;
  title: string;
  location: string;
  lat?: number | string;
  lng?: number | string;
  latest_price?: { price_per_unit_kobo?: number };
  latestPrice?: { price_per_unit_kobo?: number };
  price_per_unit_kobo?: number;
  geometry_geojson?: { type?: string; coordinates?: number[][][] };
  coordinates?: string;
  polygon?: unknown;
  [key: string]: unknown;
}

interface FlyTarget {
  lat: number;
  lng: number;
}

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
    // leaflet.heat ships no types and its module declaration isn't picked
    // up through a dynamic import() specifier; see leaflet-heat.d.ts for
    // the runtime shape it patches onto `L`.
    // @ts-expect-error - untyped plugin module, see comment above
    import("leaflet.heat").then(() => {
      heatLoaded = true;
    });
  }, []);
}

/* ===================== ICON CACHE ===================== */
const iconCache = new Map<string, DivIcon>();

/* ===================== HELPERS ===================== */

const koboToNaira = (kobo: number | string): number => Number(kobo) / 100;

function getLandPrice(land: MapLand): number {
  return (
    land.latest_price?.price_per_unit_kobo ??
    land.latestPrice?.price_per_unit_kobo ??
    land.price_per_unit_kobo ??
    0
  );
}

function getPriceColor(naira: number): string {
  if (naira < 200_000) return "#22c55e";
  if (naira < 500_000) return "#f59e0b";
  return "#ef4444";
}

function decodeEWKB(hex: string): LatLngTuple[] | null {
  if (!hex || typeof hex !== "string") return null;
  try {
    const matched = hex.match(/.{1,2}/g);
    if (!matched) return null;
    const buf = new Uint8Array(matched.map((b) => parseInt(b, 16)));
    const view = new DataView(buf.buffer);
    const le = buf[0] === 1;
    const rd32 = (o: number) => view.getUint32(o, le);
    const rdF64 = (o: number) => view.getFloat64(o, le);
    const wkbType = rd32(1);
    const hasSRID = (wkbType & 0x20000000) !== 0;
    let offset = 5;
    if (hasSRID) offset += 4;
    const numRings = rd32(offset);
    offset += 4;
    if (numRings < 1) return null;
    const numPoints = rd32(offset);
    offset += 4;
    const points: LatLngTuple[] = [];
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

function parsePolygon(land: MapLand): LatLngTuple[] | null {
  const geo = land.geometry_geojson;
  if (geo?.type === "Polygon" && Array.isArray(geo.coordinates))
    return geo.coordinates[0].map(([lng, lat]) => [lat, lng] as LatLngTuple);

  if (
    geo?.type === "Polygon" &&
    land.coordinates &&
    typeof land.coordinates === "string"
  ) {
    const decoded = decodeEWKB(land.coordinates);
    if (decoded) return decoded;
  }

  const raw = land.polygon as
    | { type?: string; coordinates?: number[][][] }
    | string
    | Array<[number, number]>
    | Array<{ lat?: number; lng?: number; latitude?: number; longitude?: number }>
    | null
    | undefined;
  if (!raw) return null;

  if (
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    raw.type === "Polygon" &&
    Array.isArray(raw.coordinates)
  )
    return raw.coordinates[0].map(([lng, lat]) => [lat, lng] as LatLngTuple);

  if (typeof raw === "string") {
    const inner = raw.match(/POLYGON\s*\(\(([^)]+)\)/i)?.[1];
    if (!inner) return null;
    return inner.split(",").map((pair) => {
      const [lng, lat] = pair.trim().split(/\s+/).map(Number);
      return [lat, lng] as LatLngTuple;
    });
  }

  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (Array.isArray(first)) return (raw as Array<[number, number]>).map(([lat, lng]) => [lat, lng] as LatLngTuple);
    const firstObj = first as { lat?: number; lng?: number; latitude?: number; longitude?: number };
    if (firstObj?.lat != null)
      return (raw as Array<{ lat: number; lng: number }>).map((p) => [+p.lat, +p.lng] as LatLngTuple);
    if (firstObj?.latitude != null)
      return (raw as Array<{ latitude: number; longitude: number }>).map(
        (p) => [+p.latitude, +p.longitude] as LatLngTuple
      );
  }

  return null;
}

function centroid(points: LatLngTuple[]): LatLngTuple {
  const lat = points.reduce((s, p) => s + p[0], 0) / points.length;
  const lng = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [lat, lng];
}

function createMarkerIcon({
  priceKobo,
  isActive,
}: {
  priceKobo: number;
  isActive: boolean;
}): DivIcon {
  const naira = koboToNaira(priceKobo);
  const color = getPriceColor(naira);
  const key = `${color}-${isActive ? 1 : 0}`;

  const cached = iconCache.get(key);
  if (cached) return cached;

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

interface MarkerRefLike {
  openPopup: () => void;
}
interface PolygonRefLike {
  openPopup: (latlng: LatLngLike) => void;
  getBounds: () => { getCenter: () => LatLngLike };
}

function FlyAndPopup({
  flyTarget,
  activeLandId,
  markerRefs,
  polygonRefs,
}: {
  flyTarget: FlyTarget | null | undefined;
  activeLandId: string | number | null | undefined;
  markerRefs: React.MutableRefObject<Record<string, MarkerRefLike>>;
  polygonRefs: React.MutableRefObject<Record<string, PolygonRefLike>>;
}) {
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
    return () => {
      map.off("zoomend", openPopup);
    };
  }, [flyTarget, activeLandId, map]);

  return null;
}

/* ===================== MOVE END HANDLER ===================== */

function MoveEndHandler({
  onMoveEnd,
  onZoomChange,
}: {
  onMoveEnd?: (bounds: ReturnType<typeof L.latLngBounds>) => void;
  onZoomChange?: (zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const handler = () => {
      onMoveEnd?.(map.getBounds());
      onZoomChange?.(map.getZoom());
    };
    map.on("moveend", handler);
    return () => {
      map.off("moveend", handler);
    };
  }, [map, onMoveEnd, onZoomChange]);

  return null;
}

/* ===================== HEATMAP ===================== */

function HeatmapLayer({ lands }: { lands: MapLand[] }) {
  const map = useMap();
  const layerRef = useRef<LeafletLayer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (!lands?.length || typeof L.heatLayer !== "function") return;

    const points = lands
      .filter((l) => l.lat && l.lng)
      .map((l) => [+l.lat!, +l.lng!, 0.6] as [number, number, number]);
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

function LandPopup({ land }: { land: MapLand }) {
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

interface LandMapProps {
  defaultCenter: LatLngTuple;
  landsWithPoints: MapLand[];
  landsWithPolygons: MapLand[];
  allLandsWithCoords: MapLand[];
  activeLandId?: string | number | null;
  hoverLandId?: string | number | null;
  flyTarget?: FlyTarget | null;
  showHeatmap?: boolean;
  onMoveEnd?: (bounds: ReturnType<typeof L.latLngBounds>) => void;
  onZoomChange?: (zoom: number) => void;
  // Accepted for caller parity (fullscreen mode passes it) but unused —
  // the map always sizes to its own "h-full w-full" internally.
  className?: string;
}

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
}: LandMapProps) {
  useLeafletHeat();

  const markerRefs = useRef<Record<string, MarkerRefLike>>({});
  const polygonRefs = useRef<Record<string, PolygonRefLike>>({});

  const setMarkerRef = useCallback((id: string | number, ref: MarkerRefLike | null) => {
    if (ref) markerRefs.current[id] = ref;
  }, []);

  const setCentroidRef = useCallback((id: string | number, ref: MarkerRefLike | null) => {
    if (ref) markerRefs.current[`${id}-centroid`] = ref;
  }, []);

  const setPolygonRef = useCallback((id: string | number, ref: PolygonRefLike | null) => {
    if (ref) polygonRefs.current[id] = ref;
  }, []);

  return (
    <MapContainerX
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

      <LayersControlX position="topleft">
        <LayersControlX.BaseLayer checked name="Street">
          <TileLayerX
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
            detectRetina={true}
            maxZoom={19}
          />
        </LayersControlX.BaseLayer>
        <LayersControlX.BaseLayer name="Satellite">
          <TileLayerX
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="© Esri"
            maxZoom={19}
          />
        </LayersControlX.BaseLayer>
        <LayersControlX.BaseLayer name="Terrain">
          <TileLayerX
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution="© OpenTopoMap"
            maxZoom={17}
          />
        </LayersControlX.BaseLayer>
      </LayersControlX>

      {/* POINT MARKERS */}
      {!showHeatmap && (
        <MarkerClusterGroup>
          {landsWithPoints.map((land) => {
            const isActive = activeLandId === land.id;
            const isHovered = hoverLandId === land.id;
            return (
              <MarkerX
                key={land.id}
                position={[+land.lat!, +land.lng!]}
                icon={createMarkerIcon({
                  priceKobo: getLandPrice(land),
                  isActive: isActive || isHovered,
                })}
                ref={(ref: any) => setMarkerRef(land.id, ref)}
                zIndexOffset={isActive ? 1000 : 0}
                title={land.title}
                alt={land.title}
              >
                <PopupX offset={[0, -20]} closeButton={false} className="land-popup">
                  <LandPopup land={land} />
                </PopupX>
              </MarkerX>
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
              <PolygonX
                positions={points}
                pathOptions={{
                  color: highlight ? "#E8A850" : "#f59e0b",
                  fillColor: highlight ? "#E8A850" : "#f59e0b",
                  fillOpacity: highlight ? 0.35 : 0.18,
                  weight: highlight ? 3 : 1.5,
                  opacity: 1,
                }}
                ref={(ref: any) => setPolygonRef(land.id, ref)}
              >
                <PopupX closeButton={false} className="land-popup">
                  <LandPopup land={land} />
                </PopupX>
              </PolygonX>

              <MarkerX
                position={center}
                icon={createMarkerIcon({
                  priceKobo: getLandPrice(land),
                  isActive: highlight,
                })}
                ref={(ref: any) => setCentroidRef(land.id, ref)}
                zIndexOffset={highlight ? 1000 : 0}
                title={land.title}
                alt={land.title}
              >
                <PopupX offset={[0, -20]} closeButton={false} className="land-popup">
                  <LandPopup land={land} />
                </PopupX>
              </MarkerX>
            </React.Fragment>
          );
        })}

      {/* HEATMAP */}
      {showHeatmap && <HeatmapLayer lands={allLandsWithCoords} />}
    </MapContainerX>
  );
}