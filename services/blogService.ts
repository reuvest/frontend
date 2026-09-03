import api from "../utils/api";

/* ── Public blog types (used by app/blog list + [slug] pages, which fetch
   directly against NEXT_PUBLIC_API_URL rather than through this service's
   axios client — kept here as the shared shape so both pages agree). ── */

export interface BlogCategory {
  id: number | string;
  name: string;
  slug: string;
  posts_count?: number;
}

export interface BlogTag {
  id: number | string;
  name: string;
  slug: string;
}

export interface BlogAuthor {
  id?: number | string;
  name: string;
  [key: string]: unknown;
}

export interface BlogPost {
  id: number | string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string;
  read_time_minutes?: number;
  views?: number;
  published_at?: string;
  category?: BlogCategory;
  tags?: BlogTag[];
  author?: BlogAuthor;
  seo_title?: string;
  seo_description?: string;
  [key: string]: unknown;
}

export interface BlogListMeta {
  data?: BlogPost[];
  total?: number;
  last_page?: number;
  current_page?: number;
  [key: string]: unknown;
}

/* ── Posts ───────────────────────────────────────────────────────────── */

export async function getAdminBlogPosts(params: string): Promise<unknown> {
  const res = await api.get(`/admin/blog?${params}`);
  return res.data;
}

export async function getAdminBlogPost(postId: string | number): Promise<unknown> {
  const res = await api.get(`/admin/blog/${postId}`);
  return res.data.data;
}

/* POST /admin/blog — create (multipart form) */
export async function createBlogPost(fd: FormData): Promise<void> {
  await api.post("/admin/blog", fd);
}

/* POST /admin/blog/:id (method-spoofed) — update (multipart form) */
export async function updateBlogPost(
  id: string | number,
  fd: FormData
): Promise<void> {
  await api.post(`/admin/blog/${id}`, fd);
}

export async function deleteBlogPost(id: string | number): Promise<void> {
  await api.delete(`/admin/blog/${id}`);
}

/* ── Categories / Tags ───────────────────────────────────────────────── */

export type TaxonomyType = "category" | "tag";

function taxonomyEndpoint(type: TaxonomyType): string {
  return type === "category" ? "/admin/blog/categories" : "/admin/blog/tags";
}

export async function getBlogCategories(): Promise<unknown[]> {
  const res = await api.get("/admin/blog/categories");
  return res.data.data ?? [];
}

export async function getBlogTags(): Promise<unknown[]> {
  const res = await api.get("/admin/blog/tags");
  return res.data.data ?? [];
}

export async function addTaxonomyItem(
  type: TaxonomyType,
  name: string
): Promise<void> {
  await api.post(taxonomyEndpoint(type), { name });
}

export async function deleteTaxonomyItem(
  type: TaxonomyType,
  id: string | number
): Promise<void> {
  await api.delete(`${taxonomyEndpoint(type)}/${id}`);
}