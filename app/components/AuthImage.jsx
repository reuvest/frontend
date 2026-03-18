import { useEffect, useState } from "react";
import api from "../../utils/api";

function toRelativePath(url) {
  try {
    return new URL(url).pathname; 
  } catch {
    return url;
  }
}

export function AuthImage({ url, alt, className, onBlobReady }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!url) return;
    let objectUrl;
    let cancelled = false;

    api.get(toRelativePath(url), { responseType: "blob" })  
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
        onBlobReady?.(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-white/5 ${className}`}>
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}