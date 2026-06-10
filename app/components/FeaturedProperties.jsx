"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MapPin, ArrowRight, ChevronLeft, ChevronRight, Home } from "lucide-react";

export default function FeaturedProperties({ lands }) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % lands.length);
  }, [lands.length]);

  const prev = () => {
    setCurrent((prev) => (prev - 1 + lands.length) % lands.length);
  };

  useEffect(() => {
    if (!isAutoPlaying || lands.length <= 1) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, next, lands.length]);

  if (lands.length === 0) {
    return (
      <div className="text-center py-20 border border-white/10 rounded-2xl">
        <Home size={48} className="mx-auto mb-4 opacity-20 text-white" />
        <p className="text-white/60">New properties coming soon</p>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Main slide */}
      <div className="relative overflow-hidden rounded-3xl h-130 md:h-145">
        {lands.map((land, i) => {
          const imageUrl =
            land.images?.length > 0 ? land.images[0].image_url : "/no-image.jpeg";
          const pricePerUnit = (land.current_price_per_unit_kobo || 0) / 100;

          return (
            <div
              key={land.id}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
            >
              {/* Background image */}
              <img
                src={imageUrl}
                alt={land.title}
                className="w-full h-full object-cover"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-[#0D1F1A] via-[#0D1F1A]/40 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <div className="flex gap-2 mb-4 flex-wrap">
                  <span className="bg-amber-500 text-[#0D1F1A] text-xs font-bold px-3 py-1 rounded-full">
                    Featured
                  </span>
                  {land.sold_percentage > 0 && (
                    <span className="bg-white/[0.02]0 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                      {land.sold_percentage}% sold
                    </span>
                  )}
                </div>

                <h3
                  className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {land.title}
                </h3>

                <p className="flex items-center gap-1.5 text-white/60 text-sm mb-6">
                  <MapPin size={14} /> {land.location}
                </p>

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-white/60 text-xs mb-1">Price per unit</p>
                    <p
                      className="text-3xl font-bold text-amber-400"
                      style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                    >
                      ₦{pricePerUnit.toLocaleString()}
                    </p>
                  </div>

                  <Link
                    href="/register"
                    className="flex items-center gap-2 font-bold text-[#0D1F1A] px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-xl"
                    style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
                  >
                    Invest Now <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prev / Next buttons */}
      {lands.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition-all z-10"
            aria-label="Previous property"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition-all z-10"
            aria-label="Next property"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {lands.length > 1 && (
        <div className="flex justify-center items-center gap-1 mt-6">
          {lands.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="flex items-center justify-center w-6 h-6 rounded-full"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current ? "true" : undefined}
            >
              <span
                className="rounded-full transition-all duration-300 block"
                style={{
                  width: i === current ? "20px" : "8px",
                  height: "8px",
                  background: i === current ? "#C8873A" : "rgba(255,255,255,0.3)",
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Slide counter */}
      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm border border-white/20 text-white text-xs px-3 py-1.5 rounded-full z-10">
        {current + 1} / {lands.length}
      </div>
    </div>
  );
}