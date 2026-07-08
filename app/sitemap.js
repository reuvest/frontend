const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://reu.ng";
const API_URL  = process.env.NEXT_PUBLIC_API_URL;

async function getLandEntries() {
  try {
    const res = await fetch(`${API_URL}/land`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json ?? [];
    return Array.isArray(data)
      ? data
          .filter((l) => l.slug ?? l.id)
          .map((l) => ({
            slug: l.slug ?? String(l.id),
            updatedAt: l.updated_at ? new Date(l.updated_at) : new Date(),
          }))
      : [];
  } catch {
    return [];
  }
}

async function getBlogEntries() {
  try {
    const res = await fetch(`${API_URL}/blog`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json ?? [];
    return Array.isArray(data)
      ? data
          .filter((p) => p.slug)
          .map((p) => ({
            slug: p.slug,
            updatedAt: p.updated_at ? new Date(p.updated_at) : new Date(),
          }))
      : [];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const [lands, posts] = await Promise.all([
    getLandEntries(),
    getBlogEntries(),
  ]);

  const staticRoutes = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/lands`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  const landRoutes = lands.map(({ slug, updatedAt }) => ({
    url: `${BASE_URL}/lands/${slug}`,
    lastModified: updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogRoutes = posts.map(({ slug, updatedAt }) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: updatedAt,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...landRoutes, ...blogRoutes];
}