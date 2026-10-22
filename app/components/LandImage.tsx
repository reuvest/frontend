"use client";

import type { SyntheticEvent } from "react";
import Image from "next/image";

type LandImageProps = {
  src?: string;
  alt?: string;
};

export default function LandImage({ src, alt }: LandImageProps) {
  return (
    <Image
      src={src ?? "/no-image.jpeg"}
      alt={alt ?? ""}
      width={1200}
      height={800}
      unoptimized
      loading="lazy"
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={(e: SyntheticEvent<HTMLImageElement>) => {
        (e.target as HTMLImageElement).src = "/no-image.jpeg";
      }}
    />
  );
}