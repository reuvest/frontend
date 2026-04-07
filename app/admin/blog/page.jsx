"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../utils/api";
import toast from "react-hot-toast";
import {
  ArrowLeft, Plus, Eye, Pencil, Trash2, Search, X,
  FileText, Tag, Globe, BookOpen, Clock, TrendingUp,
  ChevronLeft, ChevronRight, Filter, RefreshCw,
  CheckCircle, AlertCircle, Image,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  published: { label: "Published", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: <Globe size={9} /> },
  draft:     { label: "Draft",     cls: "text-amber-400  bg-amber-500/10  border-amber-500/20",  icon: <Clock  size={9} /> },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 overflow-hidden group hover:border-white/20 hover:-translate-y-0.5 transition-all">
      <div className="absolute -top-5 -right-5 w-16 h-16 rounded-full opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }} />
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${accent}20`, color: accent }}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{value}</p>
    </div>
  );
}

// ── Post Form Modal ───────────────────────────────────────────────────────────

function PostModal({ post, categories, tags, onClose, onSaved }) {
  const isEdit = !!post;
  const [form, setForm] = useState({
    title:           post?.title           || "",
    slug:            post?.slug            || "",
    excerpt:         post?.excerpt         || "",
    content:         post?.content         || "",
    category_id:     post?.category_id     || "",
    status:          post?.status          || "draft",
    seo_title:       post?.seo_title       || "",
    seo_description: post?.seo_description || "",
  });
  const [selectedTags, setSelectedTags] = useState(post?.tags?.map(t => t.id) || []);
  const [coverFile, setCoverFile]       = useState(null);
  const [coverPreview, setCoverPreview] = useState(post?.cover_image_url || null);
  const [saving, setSaving]             = useState(false);

  const toggleTag = (id) =>
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const handleCover = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.content.trim()) { toast.error("Content is required"); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
      selectedTags.forEach(id => fd.append("tag_ids[]", id));
      if (coverFile) fd.append("cover_image", coverFile);
      if (isEdit) fd.append("_method", "POST");

      if (isEdit) {
        await api.post(`/admin/blog/${post.id}`, fd);
        toast.success("Post updated");
      } else {
        await api.post("/admin/blog", fd);
        toast.success("Post created");
      }
      onSaved();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) Object.values(errors).flat().forEach(e => toast.error(e));
      else toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 px-4 py-3 rounded-xl text-sm outline-none transition-all";
  const labelCls = "block text-xs font-bold uppercase tracking-widest text-white/30 mb-2";

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0f2820] shadow-2xl"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 sticky top-0 bg-[#0f2820] z-10">
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {isEdit ? "Edit Post" : "New Post"}
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className={labelCls}>Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: !isEdit ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : form.slug })}
              placeholder="Post title" className={inputCls} required />
          </div>

          {/* Slug */}
          <div>
            <label className={labelCls}>Slug</label>
            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              placeholder="auto-generated-from-title" className={inputCls} />
          </div>

          {/* Excerpt */}
          <div>
            <label className={labelCls}>Excerpt</label>
            <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })}
              rows={2} placeholder="Brief summary (max 500 chars)" maxLength={500}
              className={`${inputCls} resize-none`} />
          </div>

          {/* Content */}
          <div>
            <label className={labelCls}>Content *</label>
            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              rows={10} placeholder="Write your post content here…"
              className={`${inputCls} resize-y`} required />
          </div>

          {/* Category + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Category</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                className={`${inputCls} bg-[#0D1F1A] appearance-none`}>
                <option value="" className="bg-[#0D1F1A]">No category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-[#0D1F1A]">{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className={`${inputCls} bg-[#0D1F1A] appearance-none`}>
                <option value="draft" className="bg-[#0D1F1A]">Draft</option>
                <option value="published" className="bg-[#0D1F1A]">Published</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className={labelCls}>Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedTags.includes(tag.id)
                        ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                        : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/70"
                    }`}>
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cover image */}
          <div>
            <label className={labelCls}>Cover Image</label>
            <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed border-white/15 hover:border-amber-500/40 bg-white/5 cursor-pointer transition-all relative overflow-hidden">
              {coverPreview ? (
                <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Image size={18} className="text-white/20" />
                  <span className="text-xs text-white/30">Click to upload cover image</span>
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleCover} className="hidden" />
            </label>
          </div>

          {/* SEO */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30">SEO (optional)</p>
            <input value={form.seo_title} onChange={e => setForm({ ...form, seo_title: e.target.value })}
              placeholder="SEO title (max 70 chars)" maxLength={70} className={inputCls} />
            <textarea value={form.seo_description} onChange={e => setForm({ ...form, seo_description: e.target.value })}
              placeholder="Meta description (max 160 chars)" maxLength={160} rows={2}
              className={`${inputCls} resize-none`} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white/40 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-[#0D1F1A] transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#0D1F1A]/40 border-t-[#0D1F1A] rounded-full animate-spin" />
                  Saving…
                </span>
              ) : isEdit ? "Update Post" : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Category / Tag Manager ────────────────────────────────────────────────────

function TaxonomyManager({ type, items, onRefresh }) {
  const [newName, setNewName] = useState("");
  const [saving, setSaving]  = useState(false);
  const endpoint = type === "category" ? "/admin/blog/categories" : "/admin/blog/tags";
  const label    = type === "category" ? "Category" : "Tag";

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await api.post(endpoint, { name: newName });
      toast.success(`${label} added`);
      setNewName("");
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${label.toLowerCase()} "${name}"?`)) return;
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success(`${label} deleted`);
      onRefresh();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">{label}s</p>
      <div className="flex gap-2 mb-3">
        <input value={newName} onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder={`New ${label.toLowerCase()}…`}
          className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/40 text-white placeholder-white/20 px-3 py-2 rounded-xl text-sm outline-none transition-all" />
        <button onClick={handleAdd} disabled={saving || !newName.trim()}
          className="px-4 py-2 rounded-xl text-xs font-bold text-[#0D1F1A] disabled:opacity-50 transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
          {saving ? <div className="w-3 h-3 border border-[#0D1F1A]/30 border-t-[#0D1F1A] rounded-full animate-spin" /> : <Plus size={13} />}
        </button>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 group">
            <span className="text-sm text-white/60">{item.name}
              {item.posts_count !== undefined && (
                <span className="text-white/25 ml-1.5 text-xs">({item.posts_count})</span>
              )}
            </span>
            <button onClick={() => handleDelete(item.id, item.name)}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-white/20 text-center py-2">No {label.toLowerCase()}s yet</p>}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminBlogPage() {
  const [posts, setPosts]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [editPost, setEditPost]     = useState(null);
  const [deleting, setDeleting]     = useState(null);
  const [showTaxonomy, setShowTaxonomy] = useState(false);

  const published = posts.filter(p => p.status === "published").length;
  const drafts    = posts.filter(p => p.status === "draft").length;
  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: 20 });
      if (filterStatus) params.set("status", filterStatus);
      const res = await api.get(`/admin/blog?${params}`);
      const d   = res.data.data;
      setPosts(d.data ?? d ?? []);
      setPagination({ current_page: d.current_page ?? 1, last_page: d.last_page ?? 1, total: d.total ?? 0 });
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  const fetchTaxonomy = useCallback(async () => {
    try {
        const [catRes, tagRes] = await Promise.all([
        api.get("/admin/blog/categories"),
        api.get("/admin/blog/tags"),
        ]);
        setCategories(catRes.data.data ?? []);
        setTags(tagRes.data.data ?? []);
    } catch {}
    }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { fetchTaxonomy(); }, [fetchTaxonomy]);
  useEffect(() => { setPage(1); }, [filterStatus]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/blog/${id}`);
      toast.success("Post deleted");
      fetchPosts();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const openEdit = async (postId) => {
    try {
      const res = await api.get(`/admin/blog/${postId}`);
      setEditPost(res.data.data);
      setShowModal(true);
    } catch {
      toast.error("Failed to load post");
    }
  };

  const handleSaved = () => {
    setShowModal(false);
    setEditPost(null);
    fetchPosts();
  };

  const filtered = search.trim()
    ? posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(search.toLowerCase()))
    : posts;

  return (
    <div className="min-h-screen bg-[#0D1F1A] relative" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-purple-400 mb-2">Admin Panel</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Blog
            </h1>
            <p className="text-white/40 mt-1 text-sm">{pagination.total} total posts</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTaxonomy(!showTaxonomy)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                showTaxonomy
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
              }`}>
              <Tag size={14} /> Manage Tags & Categories
            </button>
            <button onClick={() => { setEditPost(null); setShowModal(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[#0D1F1A] text-sm transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
              <Plus size={16} /> New Post
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard icon={<FileText size={18} />}   label="Total Posts"  value={pagination.total} accent="#C8873A" />
          <StatCard icon={<Globe size={18} />}       label="Published"    value={published}        accent="#2D7A55" />
          <StatCard icon={<Clock size={18} />}       label="Drafts"       value={drafts}           accent="#F59E0B" />
          <StatCard icon={<TrendingUp size={18} />}  label="Total Views"  value={totalViews.toLocaleString()} accent="#8B5CF6" />
        </div>

        {/* Taxonomy manager */}
        {showTaxonomy && (
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <TaxonomyManager type="category" items={categories} onRefresh={fetchTaxonomy} />
            <TaxonomyManager type="tag"      items={tags}       onRefresh={fetchTaxonomy} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search posts…"
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-purple-500/40 text-white placeholder-white/20 pl-10 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60">
                <X size={13} />
              </button>
            )}
          </div>
          <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            {[["", "All"], ["published", "Published"], ["draft", "Drafts"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  filterStatus === v ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                }`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Posts table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-white/10 rounded-2xl">
            <BookOpen size={36} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/30 mb-4">No posts found</p>
            <button onClick={() => { setEditPost(null); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[#0D1F1A] text-sm"
              style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
              <Plus size={14} /> Write your first post
            </button>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block rounded-2xl border border-white/10 bg-white/5 overflow-hidden mb-5">
              <div className="grid grid-cols-[2.5fr_1fr_1fr_80px_80px_100px] gap-4 px-6 py-3 border-b border-white/10 bg-white/5">
                {["Title", "Category", "Status", "Views", "Read time", "Actions"].map(h => (
                  <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-white/30">{h}</span>
                ))}
              </div>
              {filtered.map((post, i) => (
                <div key={post.id}
                  className={`grid grid-cols-[2.5fr_1fr_1fr_80px_80px_100px] gap-4 px-6 py-4 items-center hover:bg-white/[0.025] transition-colors ${
                    i < filtered.length - 1 ? "border-b border-white/[0.04]" : ""
                  }`}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{post.title}</p>
                    <p className="text-xs text-white/25 mt-0.5 truncate">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                        : "Not published"}
                    </p>
                  </div>
                  <span className="text-xs text-white/50 truncate">{post.category?.name || "—"}</span>
                  <StatusBadge status={post.status} />
                  <span className="text-sm text-white/50 tabular-nums">{(post.views || 0).toLocaleString()}</span>
                  <span className="text-xs text-white/40">{post.read_time_minutes || 1} min</span>
                  <div className="flex items-center gap-1">
                    <Link href={`/blog/${post.slug}`} target="_blank" title="View"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all">
                      <Eye size={13} />
                    </Link>
                    <button onClick={() => openEdit(post.id)} title="Edit"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-400/60 hover:text-purple-400 hover:bg-purple-500/10 transition-all">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDelete(post.id, post.title)} disabled={deleting === post.id} title="Delete"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50">
                      {deleting === post.id
                        ? <div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3 mb-5">
              {filtered.map(post => (
                <div key={post.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{post.title}</p>
                      <p className="text-xs text-white/30 mt-0.5">{post.category?.name || "Uncategorised"}</p>
                    </div>
                    <StatusBadge status={post.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs text-white/30">
                      <span>{(post.views || 0).toLocaleString()} views</span>
                      <span>{post.read_time_minutes || 1} min read</span>
                    </div>
                    <div className="flex gap-1">
                      <Link href={`/blog/${post.slug}`} target="_blank"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10">
                        <Eye size={13} />
                      </Link>
                      <button onClick={() => openEdit(post.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-400/60 hover:text-purple-400 hover:bg-purple-500/10">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(post.id, post.title)} disabled={deleting === post.id}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/30">Page {pagination.current_page} of {pagination.last_page}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pagination.current_page === 1}
                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30">
                    <ChevronLeft size={15} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))} disabled={pagination.current_page === pagination.last_page}
                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Post modal */}
      {showModal && (
        <PostModal
          post={editPost}
          categories={categories}
          tags={tags}
          onClose={() => { setShowModal(false); setEditPost(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}