'use client';

import { useState } from 'react';
import { TiptapEditor } from './TiptapEditor';
import { authFetch } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';

interface PostData {
  id?: string;
  type?: string;
  status?: string;
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: Record<string, unknown> | null;
  featured_image_url?: string;
  meta_title?: string;
  meta_description?: string;
}

interface Props {
  initial?: PostData;
}

export function PostForm({ initial = {} }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: initial.type || 'post',
    status: initial.status || 'draft',
    slug: initial.slug || '',
    title: initial.title || '',
    excerpt: initial.excerpt || '',
    featured_image_url: initial.featured_image_url || '',
    meta_title: initial.meta_title || '',
    meta_description: initial.meta_description || '',
    content: initial.content || null,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    backgroundColor: '#141414',
    border: '1px solid #1F1F1F',
    color: '#E8E8E8',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#888888',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    marginBottom: '0.35rem',
  };

  async function save(status?: string) {
    setSaving(true);
    setError(null);
    const body = { ...form, status: status || form.status };
    const method = initial.id ? 'PUT' : 'POST';
    const path = initial.id ? `/api/admin/posts/${initial.id}` : '/api/admin/posts';

    try {
      const res = await authFetch(path, { method, body: JSON.stringify(body) });
      if (res.ok) {
        router.push('/admin/posts');
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error || `Save failed (${res.status})`);
    } catch {
      setError('Save failed — check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Title</label>
          <input style={{ ...inputStyle, fontSize: '1.1rem' }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>Content</label>
          <TiptapEditor content={form.content} onChange={(json) => setForm({ ...form, content: json })} />
        </div>

        <div>
          <label style={labelStyle}>Excerpt</label>
          <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Meta title</label>
            <input style={inputStyle} value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Meta description</label>
            <input style={inputStyle} value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem' }}>
        <div style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F', padding: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: '#E8E8E8', fontSize: '0.9rem', marginBottom: '1rem' }}>Settings</h3>

          <label style={labelStyle}>Type</label>
          <select style={{ ...inputStyle, marginBottom: '0.75rem' }} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="post">Post</option>
            <option value="page">Page</option>
          </select>

          <label style={labelStyle}>Status</label>
          <select style={{ ...inputStyle, marginBottom: '0.75rem' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <label style={labelStyle}>Slug</label>
          <input style={{ ...inputStyle, marginBottom: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />

          <label style={labelStyle}>Featured image URL</label>
          <input style={inputStyle} value={form.featured_image_url} onChange={(e) => setForm({ ...form, featured_image_url: e.target.value })} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {error && (
            <p style={{ color: '#FF4444', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', margin: 0 }}>
              {error}
            </p>
          )}
          <button
            onClick={() => save('published')}
            disabled={saving}
            style={{ padding: '0.6rem', backgroundColor: '#63E6A0', color: '#0D0D0D', fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
          >
            {saving ? 'Saving…' : 'Publish'}
          </button>
          <button
            onClick={() => save('draft')}
            disabled={saving}
            style={{ padding: '0.6rem', backgroundColor: 'transparent', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', border: '1px solid #1F1F1F', cursor: 'pointer' }}
          >
            Save draft
          </button>
        </div>
      </div>
    </div>
  );
}
