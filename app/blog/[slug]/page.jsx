"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api  from "@/utils/api";
import { ArrowLeft, Clock, Eye, Folder, Tag, Calendar } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "";

export default function BlogPostPage() {
  const { slug }            = useParams();
  const [post, setPost]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
  api.get("/me")
    .then(res => setUser(res.data))
    .catch(() => setUser(null));
}, []);

const isLoggedIn = !!user;

  useEffect(() => {
    fetch(`${API}/blog/${slug}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((r) => setPost(r.data))
      .catch(() => setError("Article not found."))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1F1A] flex items-center justify-center"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="w-10 h-10 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#0D1F1A] flex items-center justify-center"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="text-center">
          <p className="text-white/40 mb-4">{error || "Article not found."}</p>
          <Link href="/blog" className="text-amber-500 hover:text-amber-400 text-sm">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  const seoTitle       = post.seo_title       || post.title;
  const seoDescription = post.seo_description || post.excerpt;

  return (
    <div className="min-h-screen bg-[#0D1F1A] relative"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* Cover image — full-width hero */}
      {post.cover_image_url && (
        <div className="relative h-64 sm:h-80 lg:h-96 overflow-hidden">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 30%, #0D1F1A)" }} />
        </div>
      )}

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Back nav */}
        <Link href="/blog"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
          <ArrowLeft size={13} /> Back to Blog
        </Link>

        {/* Category */}
        {post.category && (
        <Link
          href={`/blog?category=${post.category.slug}`}
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-amber-500/70 hover:text-amber-400 transition-colors mb-3 mt-2 ml-2"
        >
          <Folder size={10} /> {post.category.name}
        </Link>
      )}

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-white/50 text-base leading-relaxed mb-6 border-l-2 border-amber-500/30 pl-4">
            {post.excerpt}
          </p>
        )}

        {/* Meta strip */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/30 mb-8 pb-8 border-b border-white/[0.06]">
          <span className="flex items-center gap-1.5">
            <Calendar size={11} /> {fmtDate(post.published_at)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={11} /> {post.read_time_minutes} min read
          </span>
          <span className="flex items-center gap-1.5">
            <Eye size={11} /> {Number(post.views).toLocaleString()} views
          </span>
          {post.author && (
            <span className="text-white/25">By {post.author.name}</span>
          )}
        </div>

        {/* Body — render HTML from the backend */}
        <div
          className="prose-blog"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="mt-10 pt-8 border-t border-white/[0.06]">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25 mb-3">Tags</p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((t) => (
                <Link
                  key={t.id}
                  href={`/blog?tag=${t.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-white/40 hover:border-amber-500/30 hover:text-amber-400 hover:bg-amber-500/5 transition-all">
                  <Tag size={9} /> {t.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
       {!isLoggedIn && (
        <div className="mt-12 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
          <p className="text-sm font-bold text-white/80 mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Ready to start investing in Nigerian land?
          </p>
          <p className="text-xs text-white/35 mb-4">
            Join thousands of investors already on the platform.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0D1F1A] transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
            Get Started
          </Link>
        </div>
      )}

      </div>

      {/* Prose styles injected globally — add to your globals.css instead */}
      <style jsx global>{`
        .prose-blog {
          color: rgba(255,255,255,0.72);
          font-size: 1rem;
          line-height: 1.8;
        }
        .prose-blog h1, .prose-blog h2, .prose-blog h3,
        .prose-blog h4, .prose-blog h5, .prose-blog h6 {
          font-family: 'Playfair Display', Georgia, serif;
          color: #fff;
          margin: 1.8em 0 0.6em;
          line-height: 1.3;
        }
        .prose-blog h2 { font-size: 1.55rem; }
        .prose-blog h3 { font-size: 1.25rem; }
        .prose-blog p  { margin-bottom: 1.25em; }
        .prose-blog a  { color: #E8A850; text-decoration: underline; text-underline-offset: 3px; }
        .prose-blog a:hover { color: #C8873A; }
        .prose-blog strong { color: rgba(255,255,255,0.9); font-weight: 700; }
        .prose-blog em { color: rgba(255,255,255,0.6); }
        .prose-blog ul, .prose-blog ol {
          margin: 1em 0 1.25em 1.5em;
          color: rgba(255,255,255,0.65);
        }
        .prose-blog li { margin-bottom: 0.4em; }
        .prose-blog blockquote {
          border-left: 3px solid #C8873A;
          margin: 1.5em 0;
          padding: 0.5em 1.25em;
          color: rgba(255,255,255,0.5);
          font-style: italic;
          background: rgba(200,135,58,0.05);
          border-radius: 0 8px 8px 0;
        }
        .prose-blog code {
          background: rgba(255,255,255,0.07);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.875em;
          color: #E8A850;
        }
        .prose-blog pre {
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 1.25em;
          overflow-x: auto;
          margin: 1.5em 0;
        }
        .prose-blog pre code { background: none; padding: 0; color: rgba(255,255,255,0.75); }
        .prose-blog img {
          border-radius: 12px;
          max-width: 100%;
          margin: 1.5em 0;
        }
        .prose-blog hr {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.08);
          margin: 2em 0;
        }
        .prose-blog table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          font-size: 0.9em;
        }
        .prose-blog th {
          text-align: left;
          padding: 8px 12px;
          border-bottom: 1px solid rgba(200,135,58,0.3);
          color: #E8A850;
          font-weight: 700;
          font-size: 0.75em;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .prose-blog td {
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.65);
        }
      `}</style>
    </div>
  );
}