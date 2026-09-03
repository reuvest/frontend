// `leaflet.heat` ships no type declarations. It augments the `leaflet`
// module at runtime with `L.heatLayer(...)`; this just describes that
// augmentation so TS knows the shape used in _LandMap.tsx.
import "leaflet";

declare module "leaflet.heat" {}

declare module "leaflet" {
  interface HeatLayerOptions {
    radius?: number;
    blur?: number;
    maxZoom?: number;
    max?: number;
    gradient?: Record<number, string>;
  }

  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: HeatLayerOptions
  ): ReturnType<typeof layerGroup>;
}