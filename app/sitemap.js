const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://reu.ng";
const API_URL  = process.env.NEXT_PUBLIC_API_URL;

async function getLandSlugs() {
  try {
    const res = await fetch(`${API_URL}/land`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json ?? [];
    return Array.isArray(data)
      ? data.map((l) => l.slug ?? String(l.id)).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const slugs = await getLandSlugs();

  const staticRoutes = [
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

  const landRoutes = slugs.map((slug) => ({
    url: `${BASE_URL}/lands/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...landRoutes];
}