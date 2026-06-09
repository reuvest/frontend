"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Tag, Folder, Clock, Eye, ArrowRight, X } from "lucide-react";

const appname      = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";
const API = process.env.NEXT_PUBLIC_API_URL;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "";

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error("fetch failed");
  return res.json();
}

/* ─── Post card ─────────────────────────────────────────────────────────── */
function PostCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="rounded-2xl border border-white/[0.07] bg-white/[0.02].5 overflow-hidden hover:border-white/[0.14] hover:bg-white/4 transition-all duration-300 h-full flex flex-col">

        {/* Cover image */}
        {post.cover_image_url ? (
          <div className="relative h-44 overflow-hidden">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(13,31,26,0.5), transparent)" }} />
          </div>
        ) : (
          <div className="h-44 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(200,135,58,0.08), rgba(45,122,85,0.08))" }}>
            <span className="text-amber-500/20 text-4xl font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {post.title[0]}
            </span>
          </div>
        )}

        <div className="p-5 flex flex-col flex-1">
          {/* Category */}
          {post.category && (
            <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/70 mb-2">
              {post.category.name}
            </span>
          )}

          {/* Title */}
          <h2 className="font-bold text-white/90 text-base leading-snug mb-2 group-hover:text-amber-400/90 transition-colors"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {post.title}
          </h2>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-xs text-white/40 leading-relaxed mb-4 flex-1 line-clamp-3">
              {post.excerpt}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
            <div className="flex items-center gap-3 text-[11px] text-white/25">
              <span className="flex items-center gap-1">
                <Clock size={10} /> {post.read_time_minutes}m read
              </span>
              <span className="flex items-center gap-1">
                <Eye size={10} /> {Number(post.views).toLocaleString()}
              </span>
            </div>
            <span className="text-[11px] text-white/25">{fmtDate(post.published_at)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ─── Skeleton card ─────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02].5 overflow-hidden animate-pulse">
      <div className="h-44 bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-2.5 bg-white/5 rounded w-1/4" />
        <div className="h-4 bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-2/3" />
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function BlogPage() {
  const [posts, setPosts]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeTag, setActiveTag]           = useState("");
  const [page, setPage]             = useState(1);
  const [meta, setMeta]             = useState(null);

  // Fetch categories and tags once
  useEffect(() => {
    apiFetch("/blog/categories").then((r) => setCategories(r.data ?? [])).catch(() => {});
    apiFetch("/blog/tags").then((r) => setTags(r.data ?? [])).catch(() => {});
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "9", page });
      if (search)         params.set("search",   search);
      if (activeCategory) params.set("category", activeCategory);
      if (activeTag)      params.set("tag",      activeTag);

      const res = await apiFetch(`/blog?${params}`);
      setPosts(res.data?.data ?? []);
      setMeta(res.data);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, activeTag, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Reset page on filter change
  const setFilter = (type, value) => {
    setPage(1);
    if (type === "category") { setActiveCategory(value); setActiveTag(""); }
    if (type === "tag")      { setActiveTag(value);      setActiveCategory(""); }
  };

  const clearFilters = () => {
    setActiveCategory("");
    setActiveTag("");
    setSearch("");
    setPage(1);
  };

  const hasFilters = search || activeCategory || activeTag;

  return (
    <div className="min-h-screen bg-[#0D1F1A] relative"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-175 h-75 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(200,135,58,0.06) 0%, transparent 70%)" }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[10px] font-black tracking-[0.35em] text-amber-500/60 uppercase mb-4">
            {appname} Blog
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Insights & Updates
          </h1>
          <p className="text-white/40 max-w-xl mx-auto text-sm leading-relaxed">
            Land investment guides, market updates, and property insights from the {appname} team.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-lg mx-auto mb-8 relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search articles…"
            className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 text-white placeholder-white/20 pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
          />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            <button
              onClick={() => setFilter("category", "")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                !activeCategory
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                  : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"
              }`}>
              All
            </button>
            {categories.map((c) => (
              <button key={c.id}
                onClick={() => setFilter("category", c.slug)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  activeCategory === c.slug
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"
                }`}>
                <Folder size={10} /> {c.name}
                <span className="text-white/20">({c.posts_count})</span>
              </button>
            ))}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center mb-8">
            {tags.map((t) => (
              <button key={t.id}
                onClick={() => setFilter("tag", t.slug)}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                  activeTag === t.slug
                    ? "border-amber-500/40 bg-amber-500/8 text-amber-400"
                    : "border-white/[0.07] bg-transparent text-white/25 hover:border-white/15 hover:text-white/40"
                }`}>
                <Tag size={8} /> {t.name}
              </button>
            ))}
          </div>
        )}

        {/* Active filter notice */}
        {hasFilters && (
          <div className="flex items-center justify-between mb-6 px-4 py-2.5 rounded-xl border border-amber-500/15 bg-amber-500/5">
            <p className="text-xs text-amber-400/70">
              {search && `Searching "${search}"`}
              {activeCategory && `Category: ${categories.find((c) => c.slug === activeCategory)?.name}`}
              {activeTag && `Tag: ${tags.find((t) => t.slug === activeTag)?.name}`}
              {meta?.total != null && ` · ${meta.total} result${meta.total !== 1 ? "s" : ""}`}
            </p>
            <button onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors">
              <X size={11} /> Clear
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/25 text-sm">No articles found.</p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="mt-3 text-xs text-amber-500/60 hover:text-amber-400 transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-white/40 hover:border-white/20 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              Previous
            </button>
            <span className="text-xs text-white/25 px-3">
              {page} / {meta.last_page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              disabled={page === meta.last_page}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-white/40 hover:border-white/20 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
              Next
            </button>
          </div>
        )}

      </div>
    </div>
  );
}