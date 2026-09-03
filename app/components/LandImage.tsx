"use client";

import type { SyntheticEvent } from "react";

type LandImageProps = {
  src?: string;
  alt?: string;
};

export default function LandImage({ src, alt }: LandImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={(e: SyntheticEvent<HTMLImageElement>) => {
        (e.target as HTMLImageElement).src = "/no-image.jpeg";
      }}
    />
  );
}