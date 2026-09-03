import { useEffect, useState } from "react";
import { toRelativePath, fetchAuthedBlob } from "../../services/mediaService";

type AuthImageProps = {
  url?: string;
  alt?: string;
  className?: string;
  onBlobReady?: (objectUrl: string) => void;
};

interface LoadResult {
  url: string;
  src: string | null;
  error: boolean;
}

export function AuthImage({ url, alt, className, onBlobReady }: AuthImageProps) {
  // Result is tagged with the `url` it belongs to, so a stale in-flight
  // fetch for a previous `url` is detected at render time (below) rather
  // than needing a synchronous "reset" setState call at the top of the
  // effect — every setState here happens inside the fetch's .then/.catch.
  const [result, setResult] = useState<LoadResult | null>(null);

  useEffect(() => {
    if (!url) return;
    let objectUrl: string | undefined;
    let cancelled = false;

    fetchAuthedBlob(toRelativePath(url))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setResult({ url, src: objectUrl, error: false });
        onBlobReady?.(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("AuthImage failed:", err?.response?.status, url);
          setResult({ url, src: null, error: true });
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  const isCurrent = !!url && result?.url === url;
  const src   = isCurrent ? result!.src   : null;
  const error = isCurrent ? result!.error : false;

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 bg-white/5 text-white/55 ${className}`}>
        <span className="text-lg">⚠</span>
        <span className="text-[10px]">Failed to load</span>
      </div>
    );
  }

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-white/5 ${className}`}>
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}