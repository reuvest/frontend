"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, Camera, ImageIcon, Loader2 } from "lucide-react";

const MAX_MB        = 2;
const MAX_BYTES     = MAX_MB * 1024 * 1024;
const TARGET_BYTES  = 1.8 * 1024 * 1024; // compress down to ~1.8 MB
const ACCEPTED      = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Compress an image File to below TARGET_BYTES.
 * Returns a new File (same name, image/jpeg).
 */
async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      let quality = 0.85;

      // Scale down if very large dimensions
      const MAX_DIM = 1920;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const attempt = (q) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error("Compression failed")); return; }

            if (blob.size <= TARGET_BYTES || q <= 0.3) {
              // Done — wrap in a File
              const compressed = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, ".jpg"),
                { type: "image/jpeg", lastModified: Date.now() }
              );
              resolve(compressed);
            } else {
              // Try lower quality
              attempt(Math.max(q - 0.1, 0.3));
            }
          },
          "image/jpeg",
          q
        );
      };

      attempt(quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };

    img.src = url;
  });
}

export default function FileDropZone({
  label,
  sublabel,
  name,
  required = false,
  value,
  onChange,
  onError,
}) {
  const galleryRef = useRef();
  const cameraRef  = useRef();
  const [drag, setDrag]           = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [sizeInfo, setSizeInfo]   = useState(null); // { original, compressed }

  const preview = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value]
  );
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const processFile = async (file) => {
    // Type check
    if (!ACCEPTED.includes(file.type)) {
      onError?.(name, `Only JPG, PNG, WebP or GIF images are allowed.`);
      return;
    }

    const originalMB = (file.size / 1024 / 1024).toFixed(2);

    // Already within limit — use as-is
    if (file.size <= MAX_BYTES) {
      setSizeInfo({ original: originalMB, compressed: null });
      onChange(name, file);
      return;
    }

    // Too large — compress
    setCompressing(true);
    try {
      const compressed    = await compressImage(file);
      const compressedMB  = (compressed.size / 1024 / 1024).toFixed(2);

      // Still too large after compression
      if (compressed.size > MAX_BYTES) {
        onError?.(
          name,
          `Image is too large (${compressedMB} MB after compression). Please use a smaller image.`
        );
        onChange(name, null);
        setSizeInfo(null);
        return;
      }

      setSizeInfo({ original: originalMB, compressed: compressedMB });
      onChange(name, compressed);
    } catch {
      onError?.(name, "Failed to compress image. Please try a different file.");
    } finally {
      setCompressing(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleRemove = () => {
    onChange(name, null);
    setSizeInfo(null);
  };

  return (
    <div>
      <label className="block text-xs font-bold text-white/55 uppercase tracking-widest mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {sublabel && (
        <p className="text-white/25 text-xs mb-3 leading-relaxed">{sublabel}</p>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {/* ── Preview ── */}
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 group">
          <img
            src={preview}
            alt="preview"
            className="w-full object-cover"
            style={{ height: "clamp(140px, 35vw, 180px)" }}
          />

          {/* Compression badge */}
          {sizeInfo?.compressed && (
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-lg">
              Compressed {sizeInfo.original} MB → {sizeInfo.compressed} MB
            </div>
          )}

          {/* Desktop hover remove */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleRemove}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2.5 touch-manipulation"
            >
              <X size={14} />
            </button>
          </div>

          {/* Mobile always-visible remove */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow touch-manipulation sm:hidden"
          >
            <X size={11} />
          </button>
        </div>
      ) : compressing ? (
        /* ── Compressing state ── */
        <div
          className="border-2 border-dashed border-amber-500/40 bg-amber-500/5 rounded-xl flex flex-col items-center justify-center gap-2"
          style={{ height: "clamp(110px, 26vw, 148px)" }}
        >
          <Loader2 size={18} className="text-amber-500 animate-spin" />
          <p className="text-amber-400 text-xs font-medium">Compressing image…</p>
        </div>
      ) : (
        <>
          {/* ── Drop zone ── */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => galleryRef.current?.click()}
            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer select-none transition-all touch-manipulation ${
              drag
                ? "border-amber-500/60 bg-amber-500/5"
                : "border-white/15 hover:border-white/25 bg-white/[0.03] hover:bg-white/5"
            }`}
            style={{ height: "clamp(110px, 26vw, 148px)" }}
          >
            <ImageIcon size={18} className="text-white/20 mb-2" />
            <p className="text-white/60 text-sm font-medium">Choose from gallery</p>
            <p className="text-white/20 text-xs mt-1 text-center px-4">
              JPG, PNG or WebP · max {MAX_MB} MB
            </p>
            <p className="text-white/15 text-[10px] mt-0.5">
              Larger images are compressed automatically
            </p>
          </div>

          {/* ── Camera button ── */}
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="mt-2 w-full flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/[0.01]0 text-white/50 hover:text-white/70 font-semibold text-sm rounded-xl py-3 transition-all touch-manipulation"
          >
            <Camera size={13} className="text-amber-500" />
            Take photo with camera
          </button>
        </>
      )}
    </div>
  );
}