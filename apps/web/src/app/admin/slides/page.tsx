'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client';

interface SlideDeck {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published';
  sort_order: number;
  slide_count: number;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.85rem',
  backgroundColor: '#0D0D0D',
  border: '1px solid #1F1F1F',
  color: '#E8E8E8',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.85rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#888888',
  fontSize: '0.75rem',
  marginBottom: '0.35rem',
  fontFamily: 'var(--font-mono)',
};

export default function AdminSlidesPage() {
  const [decks, setDecks] = useState<SlideDeck[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'published' as 'draft' | 'published',
    sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  function load() {
    authFetch('/api/admin/slides')
      .then((r) => r.json())
      .then((data) => setDecks(Array.isArray(data) ? data : []))
      .catch(() => setDecks([]));
  }

  useEffect(load, []);

  function startEdit(d: SlideDeck) {
    setEditingId(d.id);
    setForm({
      title: d.title,
      description: d.description || '',
      status: d.status,
      sort_order: d.sort_order,
    });
  }

  async function save() {
    if (!editingId) return;
    setSaving(true);
    try {
      await authFetch(`/api/admin/slides/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontWeight: 800,
            fontSize: '1.75rem',
            color: '#E8E8E8',
            margin: 0,
          }}
        >
          Slides
        </h1>
        <p style={{ color: '#888888', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Edit title, description, and publish status here. Individual slides aren&apos;t editable
          from this screen yet — they&apos;re managed directly in the database for now.
        </p>
      </div>

      {editingId && (
        <div
          style={{
            backgroundColor: '#141414',
            border: '1px solid #1F1F1F',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div>
            <label style={labelStyle}>Title</label>
            <input
              style={inputStyle}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                style={{ ...inputStyle, width: '160px' }}
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as 'draft' | 'published' })
                }
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <div style={{ width: '120px' }}>
              <label style={labelStyle}>Sort order</label>
              <input
                type="number"
                style={inputStyle}
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={save}
              disabled={saving || !form.title}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: '#63E6A0',
                color: '#0D0D0D',
                fontFamily: 'var(--font-space-grotesk)',
                fontWeight: 700,
                fontSize: '0.85rem',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditingId(null)}
              style={{
                padding: '0.5rem 1.25rem',
                backgroundColor: 'transparent',
                color: '#888888',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                border: '1px solid #1F1F1F',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F' }}>
        {decks.length === 0 && (
          <p style={{ padding: '1.5rem', color: '#888888', margin: 0 }}>No slide decks yet.</p>
        )}
        {decks.map((d, i) => (
          <div
            key={d.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem 1.25rem',
              borderBottom: i < decks.length - 1 ? '1px solid #1F1F1F' : 'none',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ color: '#E8E8E8', fontWeight: 700, fontSize: '0.9rem' }}>{d.title}</div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: d.status === 'published' ? '#63E6A0' : '#888888',
                  marginTop: '0.25rem',
                }}
              >
                {d.status} · /slides/{d.slug} · {d.slide_count}{' '}
                {d.slide_count === 1 ? 'slide' : 'slides'}
              </div>
            </div>
            <button
              onClick={() => startEdit(d)}
              style={{
                background: 'none',
                border: 'none',
                color: '#63E6A0',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
