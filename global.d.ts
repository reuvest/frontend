// Ambient module declarations for asset imports that Next's build pipeline
// (webpack/SWC) resolves at build time but that bare `tsc --noEmit` doesn't
// know how to type on its own — e.g. `import "./globals.css"` in layout.tsx.
// Keep this separate from next-env.d.ts, which is auto-generated and
// shouldn't be hand-edited.

declare module "*.css";
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module "*.svg" {
  import type { FC, SVGProps } from "react";
  const content: FC<SVGProps<SVGSVGElement>>;
  export default content;
}
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.webp";

// leaflet / leaflet-draw: real types now come from @types/leaflet and
// @types/leaflet-draw (both installed as devDependencies). Previously this
// file had blanket `declare module "leaflet";` / `declare module
// "leaflet-draw";` ambient declarations from before those packages were
// added — removed, since a bare ambient declaration silently blanks out
// real .d.ts types for that module (this was actively shadowing the real
// types and causing every Leaflet-typed symbol to resolve as an error
// rather than its real shape). See PolygonMapEditor.tsx and
// app/lands/leaflet-heat.d.ts (which augments the real "leaflet" module,
// and requires it to exist as a real module rather than a bare one).