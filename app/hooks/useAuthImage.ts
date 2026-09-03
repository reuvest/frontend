import { useEffect, useState } from "react";
import { fetchAuthedBlob } from "../../services/mediaService";

export function useAuthImage(url: string | null | undefined): string | null {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let objectUrl: string | undefined;

    fetchAuthedBlob(url)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => setSrc(null));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return src;
}