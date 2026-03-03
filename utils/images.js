const FALLBACK = "/no-image.jpeg";

export function getLandImage(land) {
  const first = land?.images?.[0];
  if (!first) return FALLBACK;
  return first.image_url || first.image_path || first.url || FALLBACK;
}

/**
 * Returns all images from a land as lightbox-ready slide objects: [{ src }]
 * Falls back to a single getLandImage slide if images array is empty.
 */
export function getLandSlides(land) {
  if (land?.images?.length) {
    return land.images.map((img) => ({
      src: img.image_url || img.image_path || img.url || FALLBACK,
    }));
  }
  return [{ src: getLandImage(land) }];
}