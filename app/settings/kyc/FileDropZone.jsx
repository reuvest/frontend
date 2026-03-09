"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, Camera, ImageIcon } from "lucide-react";

export default function FileDropZone({ label, sublabel, name, required = false, value, onChange }) {
  const galleryRef = useRef();
  const cameraRef  = useRef();
  const [drag, setDrag] = useState(false);

  const preview = useMemo(() => value ? URL.createObjectURL(value) : null, [value]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) onChange(name, file);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onChange(name, file);
    e.target.value = "";
  };

  return (
    <div>
      <label className="block text-xs font-bold text-white/30 uppercase tracking-widest mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {sublabel && <p className="text-white/25 text-xs mb-3 leading-relaxed">{sublabel}</p>}

      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 group">
          <img
            src={preview}
            alt="preview"
            className="w-full object-cover"
            style={{ height: "clamp(140px, 35vw, 180px)" }}
          />
          {/* Desktop hover remove */}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onChange(name, null)}
              className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2.5 touch-manipulation"
            >
              <X size={14} />
            </button>
          </div>
          {/* Mobile always-visible remove */}
          <button
            type="button"
            onClick={() => onChange(name, null)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow touch-manipulation sm:hidden"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
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
            <p className="text-white/40 text-sm font-medium">Choose from gallery</p>
            <p className="text-white/20 text-xs mt-1 text-center px-4">JPG or PNG · max 5MB</p>
          </div>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="mt-2 w-full flex items-center justify-center gap-2 border border-white/10 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 font-semibold text-sm rounded-xl py-3 transition-all touch-manipulation"
          >
            <Camera size={13} className="text-amber-500" />
            Take photo with camera
          </button>
        </>
      )}
    </div>
  );
}