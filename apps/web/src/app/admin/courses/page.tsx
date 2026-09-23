'use client';

import { useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/auth/client';

interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published';
  sort_order: number;
}

interface Feedback {
  id: string;
  rating: number;
  missing_topics: string | null;
  improvements: string | null;
  user_name: string;
  user_email: string;
  created_at: string;
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

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'published' as 'draft' | 'published', sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [feedbackForId, setFeedbackForId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // The form renders above the list: bring it into view (and focus it) when
  // editing starts, otherwise it can open outside the viewport unnoticed.
  useEffect(() => {
    if (!editingId) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    formRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    formRef.current?.querySelector('input')?.focus({ preventScroll: true });
  }, [editingId]);

  function load() {
    authFetch('/api/admin/courses')
      .then((r) => r.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]));
  }

  useEffect(load, []);

  function startEdit(c: Course) {
    // Toggle: clicking the row already being edited closes its form.
    if (editingId === c.id) {
      setEditingId(null);
      return;
    }
    setEditingId(c.id);
    setForm({ title: c.title, description: c.description || '', status: c.status, sort_order: c.sort_order });
  }

  function toggleFeedback(courseId: string) {
    if (feedbackForId === courseId) {
      setFeedbackForId(null);
      return;
    }
    setFeedbackForId(courseId);
    setLoadingFeedback(true);
    authFetch(`/api/admin/courses/${courseId}/feedback`)
      .then((r) => r.json())
      .then((data) => setFeedback(Array.isArray(data) ? data : []))
      .catch(() => setFeedback([]))
      .finally(() => setLoadingFeedback(false));
  }

  async function save() {
    if (!editingId) return;
    setSaving(true);
    try {
      await authFetch(`/api/admin/courses/${editingId}`, { method: 'PUT', body: JSON.stringify(form) });
      setEditingId(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: '1.75rem', color: '#E8E8E8', margin: 0 }}>
          Courses
        </h1>
        <p style={{ color: '#888888', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Edit title, description, and publish status here. Phases and lessons aren&apos;t editable from
          this screen yet — they&apos;re managed directly in the database for now.
        </p>
      </div>

      {editingId && (
        <div ref={formRef} style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
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
                onChange={(e) => setForm({ ...form, status: e.target.value as 'draft' | 'published' })}
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
              style={{ padding: '0.5rem 1.25rem', backgroundColor: '#63E6A0', color: '#0D0D0D', fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, fontSize: '0.85rem', border: 'none', cursor: 'pointer' }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setEditingId(null)}
              style={{ padding: '0.5rem 1.25rem', backgroundColor: 'transparent', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', border: '1px solid #1F1F1F', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F' }}>
        {courses.length === 0 && <p style={{ padding: '1.5rem', color: '#888888', margin: 0 }}>No courses yet.</p>}
        {courses.map((c, i) => (
          <div key={c.id} style={{ borderBottom: i < courses.length - 1 ? '1px solid #1F1F1F' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#E8E8E8', fontWeight: 700, fontSize: '0.9rem' }}>{c.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: c.status === 'published' ? '#63E6A0' : '#888888', marginTop: '0.25rem' }}>
                  {c.status} · /courses/{c.slug}
                </div>
              </div>
              <button onClick={() => toggleFeedback(c.id)} style={{ background: 'none', border: 'none', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
                {feedbackForId === c.id ? 'Hide feedback' : 'Feedback'}
              </button>
              <button onClick={() => startEdit(c)} style={{ background: 'none', border: 'none', color: '#63E6A0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
                {editingId === c.id ? 'Close' : 'Edit'}
              </button>
            </div>

            {feedbackForId === c.id && (
              <div style={{ padding: '0 1.25rem 1.25rem', backgroundColor: '#0D0D0D' }}>
                {loadingFeedback && <p style={{ color: '#888888', fontSize: '0.8rem' }}>Loading…</p>}
                {!loadingFeedback && feedback.length === 0 && (
                  <p style={{ color: '#888888', fontSize: '0.8rem', margin: 0 }}>No feedback submitted yet.</p>
                )}
                {!loadingFeedback && feedback.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem' }}>
                    {feedback.map((f) => (
                      <div key={f.id} style={{ border: '1px solid #1F1F1F', padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ color: '#63E6A0', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                            {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                          </span>
                          <span style={{ color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                            {f.user_name} · {new Date(f.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {f.missing_topics && (
                          <p style={{ color: '#E8E8E8', fontSize: '0.8rem', margin: '0.35rem 0' }}>
                            <strong>Missing:</strong> {f.missing_topics}
                          </p>
                        )}
                        {f.improvements && (
                          <p style={{ color: '#E8E8E8', fontSize: '0.8rem', margin: '0.35rem 0' }}>
                            <strong>Improve:</strong> {f.improvements}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
