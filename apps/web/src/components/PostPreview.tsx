'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch, Post } from '@/lib/api';
import { AmbientBackground } from '@/components/AmbientBackground';
import { BlogPostView, RelatedPost } from '@/components/BlogPostView';
import { Nav } from '@/components/Nav';
import { ReadingProgress } from '@/components/ReadingProgress';

interface Draft {
  title: string;
  excerpt: string;
  content: Record<string, unknown> | null;
  featured_image_url: string;
  slug: string;
  categories: string;
  tags: string;
}

interface Props {
  draft: Draft;
  // Known metadata for the byline. Live author/date come from the public API
  // when the slug is already published; these are the fallback.
  authorName: string | null;
  publishedAt: string | null;
  onClose: () => void;
}

// Mirrors the API's read-time formula (apps/api/src/routes/posts.js) so the
// preview byline matches the published page exactly.
function readTime(content: Record<string, unknown> | null): number {
  const text = JSON.stringify(content || {});
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 200);
}

function parseList(value: string): string[] {
  return value.split(',').map((t) => t.trim()).filter(Boolean);
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://geraldvillorente.com';

export function PostPreview({ draft, authorName, publishedAt, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [related, setRelated] = useState<RelatedPost[]>([]);
  const [publicMeta, setPublicMeta] = useState<{ author_name: string | null; published_at: string | null } | null>(null);
  const slug = draft.slug.trim();

  // Lock the background scroll and close on Escape while the preview is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  // Author, publish date, and related posts come from the live public API when
  // the slug already exists there. Drafts 404 here and honestly show empty.
  useEffect(() => {
    if (!slug) {
      setRelated([]);
      setPublicMeta(null);
      return;
    }
    let cancelled = false;
    apiFetch<Post>(`/api/posts/${slug}`)
      .then((p) => {
        if (!cancelled) setPublicMeta({ author_name: p.author_name, published_at: p.published_at });
      })
      .catch(() => {});
    apiFetch<RelatedPost[]>(`/api/posts/${slug}/related`)
      .then((r) => {
        if (!cancelled) setRelated(r);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const post: Post = {
    id: 'preview',
    type: 'post',
    status: 'draft',
    slug,
    title: draft.title,
    excerpt: draft.excerpt || null,
    content: draft.content,
    featured_image_url: draft.featured_image_url || null,
    is_featured: false,
    author_id: null,
    author_name: publicMeta?.author_name ?? authorName,
    author_avatar: null,
    meta_title: null,
    meta_description: null,
    published_at: publicMeta?.published_at ?? publishedAt,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    read_time: readTime(draft.content),
    categories: parseList(draft.categories),
    tags: parseList(draft.tags),
  };

  // Same-tab links inside the preview (related posts, in-article links) would
  // navigate away and destroy unsaved editor state. Confirm first; share links
  // open in a new tab and are unaffected.
  function guardNavigation(e: React.MouseEvent) {
    const anchor = (e.target as HTMLElement).closest?.('a[href]') as HTMLAnchorElement | null;
    if (!anchor) return;
    const href = anchor.getAttribute('href') || '';
    const opensNewTab = anchor.getAttribute('target') === '_blank';
    const isSameTabNav = !opensNewTab && !href.startsWith('#');
    if (!isSameTabNav) return;
    e.preventDefault();
    if (window.confirm('Leave the preview and open this link? Any unsaved changes in the editor will be lost.')) {
      window.location.href = anchor.href;
    }
  }

  return (
    <div
      ref={overlayRef}
      onClickCapture={guardNavigation}
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        backgroundColor: '#0D0D0D',
        zIndex: 60,
      }}
    >
      <AmbientBackground />
      <Nav previewAsPath={slug ? `/blog/${slug}` : '/blog/preview'} />
      <ReadingProgress scrollRef={overlayRef} />
      <BlogPostView post={post} related={related} siteUrl={siteUrl} />

      <div
        style={{
          position: 'fixed',
          bottom: '1.25rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 70,
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '0.6rem 1.25rem',
          backgroundColor: '#141414',
          border: '1px solid #1F1F1F',
          borderRadius: '999px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: '#63E6A0',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          Draft preview
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#888888' }}>
          Esc to close
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '0.35rem 0.9rem',
            backgroundColor: '#63E6A0',
            color: '#0D0D0D',
            fontFamily: 'var(--font-space-grotesk)',
            fontWeight: 700,
            fontSize: '0.75rem',
            border: 'none',
            borderRadius: '999px',
            cursor: 'pointer',
          }}
        >
          Back to editor
        </button>
      </div>
    </div>
  );
}
