import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://reu.ng";

const BACKEND_ROOT = (
  process.env.API_PROXY_TARGET ||
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "")
).replace(/\/$/, "");

async function getLandSlugs(): Promise<string[]> {
  if (!BACKEND_ROOT) return [];
  try {
    const res = await fetch(`${BACKEND_ROOT}/api/land`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json ?? [];
    return Array.isArray(data)
      ? data.map((l: { slug?: string; id: string | number }) => l.slug ?? String(l.id)).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getLandSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/lands`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  const landRoutes: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE_URL}/lands/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...landRoutes];
}