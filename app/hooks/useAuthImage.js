import { useEffect, useState } from "react";
import api from "../../utils/api"; 

export function useAuthImage(url) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    if (!url) return;
    let objectUrl;

    api.get(url, { responseType: "blob" })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setSrc(objectUrl);
      })
      .catch(() => setSrc(null));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return src;
}