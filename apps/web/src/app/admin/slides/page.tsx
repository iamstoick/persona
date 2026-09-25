'use client';

import { useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/auth/client';
import { TiptapEditor } from '@/components/TiptapEditor';

interface SlideDeck {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published';
  sort_order: number;
  slide_count: number;
}

interface SlideRow {
  id: string;
  title: string;
  content: Record<string, unknown> | null;
  notes: Record<string, unknown> | null;
  sort_order: number;
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

const rowBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#63E6A0',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  cursor: 'pointer',
  padding: 0,
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
  const formRef = useRef<HTMLDivElement>(null);

  const [slidesForId, setSlidesForId] = useState<string | null>(null);
  const [slides, setSlides] = useState<SlideRow[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideForm, setSlideForm] = useState<{
    title: string;
    content: Record<string, unknown> | null;
    notes: Record<string, unknown> | null;
  }>({ title: '', content: null, notes: null });
  const [savingSlide, setSavingSlide] = useState(false);
  const [slideError, setSlideError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  // The form renders above the list: bring it into view (and focus it) when
  // editing starts, otherwise it can open outside the viewport unnoticed.
  useEffect(() => {
    if (!editingId) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    formRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    formRef.current?.querySelector('input')?.focus({ preventScroll: true });
  }, [editingId]);

  function load() {
    authFetch('/api/admin/slides')
      .then((r) => r.json())
      .then((data) => setDecks(Array.isArray(data) ? data : []))
      .catch(() => setDecks([]));
  }

  useEffect(load, []);

  function startEdit(d: SlideDeck) {
    // Toggle: clicking the row already being edited closes its form.
    if (editingId === d.id) {
      setEditingId(null);
      return;
    }
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

  function loadSlides(deckId: string) {
    setLoadingSlides(true);
    authFetch(`/api/admin/slides/${deckId}/slides`)
      .then((r) => r.json())
      .then((data) => setSlides(Array.isArray(data) ? data : []))
      .catch(() => setSlides([]))
      .finally(() => setLoadingSlides(false));
  }

  function toggleSlides(deckId: string) {
    if (slidesForId === deckId) {
      setSlidesForId(null);
      setEditingSlideId(null);
      return;
    }
    setSlidesForId(deckId);
    setEditingSlideId(null);
    setSlideError(null);
    loadSlides(deckId);
  }

  function startSlideAdd() {
    setEditingSlideId('new');
    setSlideForm({ title: '', content: null, notes: null });
    setSlideError(null);
  }

  function startSlideEdit(s: SlideRow) {
    // Toggle: clicking the slide already being edited closes its form.
    if (editingSlideId === s.id) {
      setEditingSlideId(null);
      return;
    }
    setEditingSlideId(s.id);
    setSlideForm({ title: s.title, content: s.content, notes: s.notes || null });
    setSlideError(null);
  }

  async function saveSlide() {
    if (!slidesForId || !editingSlideId) return;
    setSavingSlide(true);
    setSlideError(null);
    try {
      const isNew = editingSlideId === 'new';
      const res = await authFetch(
        isNew
          ? `/api/admin/slides/${slidesForId}/slides`
          : `/api/admin/slides/${slidesForId}/slides/${editingSlideId}`,
        { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(slideForm) }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSlideError(data?.error || `Save failed (${res.status})`);
        return;
      }
      setEditingSlideId(null);
      loadSlides(slidesForId);
      load();
    } finally {
      setSavingSlide(false);
    }
  }

  async function deleteSlide(s: SlideRow) {
    if (!slidesForId) return;
    if (!window.confirm(`Delete slide "${s.title}"? This cannot be undone.`)) return;
    await authFetch(`/api/admin/slides/${slidesForId}/slides/${s.id}`, { method: 'DELETE' });
    if (editingSlideId === s.id) setEditingSlideId(null);
    loadSlides(slidesForId);
    load();
  }

  async function moveSlide(index: number, dir: -1 | 1) {
    if (!slidesForId || moving) return;
    const next = [...slides];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setMoving(true);
    try {
      const res = await authFetch(`/api/admin/slides/${slidesForId}/slides/order`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds: next.map((s) => s.id) }),
      });
      if (res.ok) setSlides(next);
    } finally {
      setMoving(false);
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
          Edit deck title, description, and publish status, or expand a deck to manage its
          individual slides — title, content, speaker notes, and order.
        </p>
      </div>

      {editingId && (
        <div
          ref={formRef}
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
            style={{ borderBottom: i < decks.length - 1 ? '1px solid #1F1F1F' : 'none' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ color: '#E8E8E8', fontWeight: 700, fontSize: '0.9rem' }}>
                  {d.title}
                </div>
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
              <button onClick={() => toggleSlides(d.id)} style={{ ...rowBtnStyle, color: '#888888' }}>
                {slidesForId === d.id ? 'Hide slides' : 'Slides'}
              </button>
              <button onClick={() => startEdit(d)} style={rowBtnStyle}>
                {editingId === d.id ? 'Close' : 'Edit'}
              </button>
            </div>

            {slidesForId === d.id && (
              <div
                style={{
                  padding: '0 1.25rem 1.25rem',
                  backgroundColor: '#0D0D0D',
                  borderTop: '1px solid #1F1F1F',
                }}
              >
                <div style={{ paddingTop: '1rem' }}>
                  <button
                    onClick={startSlideAdd}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'transparent',
                      border: '1px solid #63E6A0',
                      color: '#63E6A0',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      marginBottom: '1rem',
                    }}
                  >
                    + Add slide
                  </button>

                  {loadingSlides && (
                    <p style={{ color: '#888888', fontSize: '0.8rem' }}>Loading…</p>
                  )}

                  {!loadingSlides &&
                    slides.map((s, si) => (
                      <div key={s.id} style={{ border: '1px solid #1F1F1F', marginBottom: '0.75rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.6rem 1rem',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.7rem',
                              color: '#888888',
                              width: '2rem',
                              flexShrink: 0,
                            }}
                          >
                            {String(si + 1).padStart(2, '0')}
                          </span>
                          <span
                            style={{
                              flex: 1,
                              color: '#E8E8E8',
                              fontSize: '0.85rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {s.title}
                          </span>
                          <button
                            onClick={() => moveSlide(si, -1)}
                            disabled={si === 0 || moving}
                            title="Move up"
                            style={{
                              ...rowBtnStyle,
                              color: '#888888',
                              cursor: si === 0 || moving ? 'not-allowed' : 'pointer',
                            }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveSlide(si, 1)}
                            disabled={si === slides.length - 1 || moving}
                            title="Move down"
                            style={{
                              ...rowBtnStyle,
                              color: '#888888',
                              cursor:
                                si === slides.length - 1 || moving ? 'not-allowed' : 'pointer',
                            }}
                          >
                            ↓
                          </button>
                          <button onClick={() => startSlideEdit(s)} style={rowBtnStyle}>
                            {editingSlideId === s.id ? 'Close' : 'Edit'}
                          </button>
                          <button
                            onClick={() => deleteSlide(s)}
                            style={{ ...rowBtnStyle, color: '#FF4444' }}
                          >
                            Delete
                          </button>
                        </div>

                        {editingSlideId === s.id && (
                          <div
                            style={{
                              borderTop: '1px solid #1F1F1F',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '1rem',
                            }}
                          >
                            <div>
                              <label style={labelStyle}>Slide title</label>
                              <input
                                style={inputStyle}
                                value={slideForm.title}
                                onChange={(e) =>
                                  setSlideForm({ ...slideForm, title: e.target.value })
                                }
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Content</label>
                              <TiptapEditor
                                key={s.id}
                                content={slideForm.content}
                                onChange={(json) => setSlideForm((f) => ({ ...f, content: json }))}
                              />
                            </div>
                            <div>
                              <label style={labelStyle}>Speaker notes</label>
                              <TiptapEditor
                                key={`notes-${s.id}`}
                                content={slideForm.notes}
                                onChange={(json) => setSlideForm((f) => ({ ...f, notes: json }))}
                              />
                            </div>
                            {slideError && (
                              <p
                                style={{
                                  color: '#FF4444',
                                  fontSize: '0.8rem',
                                  fontFamily: 'var(--font-mono)',
                                  margin: 0,
                                }}
                              >
                                {slideError}
                              </p>
                            )}
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <button
                                onClick={saveSlide}
                                disabled={savingSlide || !slideForm.title}
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
                                {savingSlide ? 'Saving…' : 'Save slide'}
                              </button>
                              <button
                                onClick={() => setEditingSlideId(null)}
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
                      </div>
                    ))}

                  {editingSlideId === 'new' && (
                    <div
                      style={{
                        border: '1px solid #63E6A0',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <div style={{ color: '#63E6A0', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        New slide (added at the end — reorder with ↑ ↓ afterwards)
                      </div>
                      <div>
                        <label style={labelStyle}>Slide title</label>
                        <input
                          style={inputStyle}
                          value={slideForm.title}
                          onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Content</label>
                        <TiptapEditor
                          key="new"
                          content={slideForm.content}
                          onChange={(json) => setSlideForm((f) => ({ ...f, content: json }))}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Speaker notes</label>
                        <TiptapEditor
                          key="notes-new"
                          content={slideForm.notes}
                          onChange={(json) => setSlideForm((f) => ({ ...f, notes: json }))}
                        />
                      </div>
                      {slideError && (
                        <p
                          style={{
                            color: '#FF4444',
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-mono)',
                            margin: 0,
                          }}
                        >
                          {slideError}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={saveSlide}
                          disabled={savingSlide || !slideForm.title}
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
                          {savingSlide ? 'Saving…' : 'Add slide'}
                        </button>
                        <button
                          onClick={() => setEditingSlideId(null)}
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
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
