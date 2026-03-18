import { useEffect, useState } from "react";
import api from "../../utils/api";

export function AuthImage({ url, alt, className, onBlobReady }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!url) return;
    let objectUrl;

    api.get(url, { responseType: "blob" })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
        onBlobReady?.(objectUrl);
      })
      .catch(() => setSrc(null));

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
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