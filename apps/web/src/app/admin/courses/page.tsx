'use client';

import { useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/auth/client';
import { TiptapEditor } from '@/components/TiptapEditor';

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

interface AdminLesson {
  id: string;
  phase_id: string;
  day_number: number;
  title: string;
  duration_minutes: number;
  summary: string | null;
  content: Record<string, unknown> | null;
  sort_order: number;
}

interface AdminPhase {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: AdminLesson[];
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

const dimBtnStyle: React.CSSProperties = { ...rowBtnStyle, color: '#888888' };

const dangerBtnStyle: React.CSSProperties = { ...rowBtnStyle, color: '#FF4444' };

const errorStyle: React.CSSProperties = {
  color: '#FF4444',
  fontSize: '0.8rem',
  fontFamily: 'var(--font-mono)',
  margin: 0,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1.25rem',
  backgroundColor: '#63E6A0',
  color: '#0D0D0D',
  fontFamily: 'var(--font-space-grotesk)',
  fontWeight: 700,
  fontSize: '0.85rem',
  border: 'none',
  cursor: 'pointer',
};

const ghostBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1.25rem',
  backgroundColor: 'transparent',
  color: '#888888',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.85rem',
  border: '1px solid #1F1F1F',
  cursor: 'pointer',
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

  const [phasesForId, setPhasesForId] = useState<string | null>(null);
  const [phases, setPhases] = useState<AdminPhase[]>([]);
  const [loadingPhases, setLoadingPhases] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [phaseForm, setPhaseForm] = useState({ title: '', description: '' });
  const [savingPhase, setSavingPhase] = useState(false);
  const [phaseError, setPhaseError] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [addingLessonToPhase, setAddingLessonToPhase] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState<{
    phase_id: string;
    title: string;
    day_number: number;
    duration_minutes: number;
    summary: string;
    content: Record<string, unknown> | null;
  }>({ phase_id: '', title: '', day_number: 1, duration_minutes: 60, summary: '', content: null });
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
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

  function loadPhases(courseId: string) {
    setLoadingPhases(true);
    authFetch(`/api/admin/courses/${courseId}/phases`)
      .then((r) => r.json())
      .then((data) => setPhases(Array.isArray(data) ? data : []))
      .catch(() => setPhases([]))
      .finally(() => setLoadingPhases(false));
  }

  function togglePhases(courseId: string) {
    if (phasesForId === courseId) {
      setPhasesForId(null);
      setEditingPhaseId(null);
      setEditingLessonId(null);
      setAddingLessonToPhase(null);
      return;
    }
    setPhasesForId(courseId);
    setEditingPhaseId(null);
    setEditingLessonId(null);
    setAddingLessonToPhase(null);
    setPhaseError(null);
    setLessonError(null);
    loadPhases(courseId);
  }

  function startPhaseAdd() {
    setEditingPhaseId('new');
    setPhaseForm({ title: '', description: '' });
    setPhaseError(null);
  }

  function startPhaseEdit(p: AdminPhase) {
    if (editingPhaseId === p.id) {
      setEditingPhaseId(null);
      return;
    }
    setEditingPhaseId(p.id);
    setPhaseForm({ title: p.title, description: p.description || '' });
    setPhaseError(null);
  }

  async function savePhase() {
    if (!phasesForId || !editingPhaseId) return;
    setSavingPhase(true);
    setPhaseError(null);
    try {
      const isNew = editingPhaseId === 'new';
      const res = await authFetch(
        isNew ? `/api/admin/courses/${phasesForId}/phases` : `/api/admin/courses/${phasesForId}/phases/${editingPhaseId}`,
        { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(phaseForm) }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setPhaseError(data?.error || `Save failed (${res.status})`);
        return;
      }
      setEditingPhaseId(null);
      loadPhases(phasesForId);
    } finally {
      setSavingPhase(false);
    }
  }

  async function deletePhase(p: AdminPhase) {
    if (!phasesForId) return;
    const lessonWarn = p.lessons.length > 0 ? ` and its ${p.lessons.length} lesson${p.lessons.length === 1 ? '' : 's'}` : '';
    if (!window.confirm(`Delete phase "${p.title}"${lessonWarn}? This cannot be undone.`)) return;
    await authFetch(`/api/admin/courses/${phasesForId}/phases/${p.id}`, { method: 'DELETE' });
    if (editingPhaseId === p.id) setEditingPhaseId(null);
    setEditingLessonId(null);
    setAddingLessonToPhase(null);
    loadPhases(phasesForId);
  }

  async function movePhase(index: number, dir: -1 | 1) {
    if (!phasesForId || moving) return;
    const next = [...phases];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setMoving(true);
    try {
      const res = await authFetch(`/api/admin/courses/${phasesForId}/phases/order`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds: next.map((p) => p.id) }),
      });
      if (res.ok) setPhases(next);
    } finally {
      setMoving(false);
    }
  }

  function startLessonAdd(phaseId: string) {
    const maxDay = Math.max(0, ...phases.flatMap((p) => p.lessons.map((l) => l.day_number)));
    setAddingLessonToPhase(phaseId);
    setEditingLessonId(null);
    setLessonForm({ phase_id: phaseId, title: '', day_number: maxDay + 1, duration_minutes: 60, summary: '', content: null });
    setLessonError(null);
  }

  function startLessonEdit(phaseId: string, l: AdminLesson) {
    if (editingLessonId === l.id) {
      setEditingLessonId(null);
      return;
    }
    setAddingLessonToPhase(null);
    setEditingLessonId(l.id);
    setLessonForm({
      phase_id: phaseId,
      title: l.title,
      day_number: l.day_number,
      duration_minutes: l.duration_minutes,
      summary: l.summary || '',
      content: l.content,
    });
    setLessonError(null);
  }

  async function saveLesson() {
    if (!phasesForId || (!editingLessonId && !addingLessonToPhase)) return;
    setSavingLesson(true);
    setLessonError(null);
    try {
      const isNew = addingLessonToPhase !== null;
      const res = await authFetch(
        isNew
          ? `/api/admin/courses/${phasesForId}/phases/${addingLessonToPhase}/lessons`
          : `/api/admin/courses/${phasesForId}/lessons/${editingLessonId}`,
        { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(lessonForm) }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setLessonError(data?.error || `Save failed (${res.status})`);
        return;
      }
      setEditingLessonId(null);
      setAddingLessonToPhase(null);
      loadPhases(phasesForId);
    } finally {
      setSavingLesson(false);
    }
  }

  async function deleteLesson(l: AdminLesson) {
    if (!phasesForId) return;
    if (!window.confirm(`Delete lesson "${l.title}"? Student progress on it will go with it. This cannot be undone.`)) return;
    await authFetch(`/api/admin/courses/${phasesForId}/lessons/${l.id}`, { method: 'DELETE' });
    if (editingLessonId === l.id) setEditingLessonId(null);
    loadPhases(phasesForId);
  }

  // Lesson sort_order is course-global (the public outline sorts every lesson
  // of the course by it), so a move re-persists the FULL course ordering with
  // the swapped pair — never just the phase, which would tie-sort with others.
  async function moveLesson(phaseId: string, index: number, dir: -1 | 1) {
    if (!phasesForId || moving) return;
    const phase = phases.find((p) => p.id === phaseId);
    if (!phase) return;
    const j = index + dir;
    if (j < 0 || j >= phase.lessons.length) return;
    const nextLessons = [...phase.lessons];
    [nextLessons[index], nextLessons[j]] = [nextLessons[j], nextLessons[index]];
    const nextPhases = phases.map((p) => (p.id === phaseId ? { ...p, lessons: nextLessons } : p));
    const orderedIds = nextPhases.flatMap((p) => p.lessons.map((l) => l.id));
    setMoving(true);
    try {
      const res = await authFetch(`/api/admin/courses/${phasesForId}/lessons/order`, {
        method: 'PUT',
        body: JSON.stringify({ orderedIds }),
      });
      if (res.ok) setPhases(nextPhases);
    } finally {
      setMoving(false);
    }
  }

  function renderLessonForm(phaseId: string, key: string, isNew: boolean) {
    return (
      <div
        style={{
          borderTop: '1px solid #1F1F1F',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          backgroundColor: '#0D0D0D',
        }}
      >
        {isNew && (
          <div style={{ color: '#63E6A0', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
            New lesson (added at the end — reorder with ↑ ↓ afterwards)
          </div>
        )}
        <div>
          <label style={labelStyle}>Lesson title</label>
          <input
            style={inputStyle}
            value={lessonForm.title}
            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label style={labelStyle}>Phase</label>
            <select
              style={{ ...inputStyle, minWidth: '200px' }}
              value={lessonForm.phase_id}
              onChange={(e) => setLessonForm({ ...lessonForm, phase_id: e.target.value })}
            >
              {phases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div style={{ width: '110px' }}>
            <label style={labelStyle}>Day</label>
            <input
              type="number"
              min={1}
              style={inputStyle}
              value={lessonForm.day_number}
              onChange={(e) => setLessonForm({ ...lessonForm, day_number: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div style={{ width: '130px' }}>
            <label style={labelStyle}>Minutes</label>
            <input
              type="number"
              min={1}
              style={inputStyle}
              value={lessonForm.duration_minutes}
              onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: parseInt(e.target.value) || 60 })}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Summary</label>
          <textarea
            style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }}
            value={lessonForm.summary}
            onChange={(e) => setLessonForm({ ...lessonForm, summary: e.target.value })}
          />
        </div>
        <div>
          <label style={labelStyle}>Content</label>
          <TiptapEditor
            key={`${key}-${phaseId}`}
            content={lessonForm.content}
            onChange={(json) => setLessonForm((f) => ({ ...f, content: json }))}
          />
        </div>
        {lessonError && <p style={errorStyle}>{lessonError}</p>}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={saveLesson} disabled={savingLesson || !lessonForm.title} style={primaryBtnStyle}>
            {savingLesson ? 'Saving…' : isNew ? 'Add lesson' : 'Save lesson'}
          </button>
          <button
            onClick={() => {
              setEditingLessonId(null);
              setAddingLessonToPhase(null);
            }}
            style={ghostBtnStyle}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: '1.75rem', color: '#E8E8E8', margin: 0 }}>
          Courses
        </h1>
        <p style={{ color: '#888888', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Edit title, description, and publish status, or expand a course to manage its
          phases and lessons — including lesson content, day numbers, and order.
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
              <button onClick={() => togglePhases(c.id)} style={{ background: 'none', border: 'none', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
                {phasesForId === c.id ? 'Hide phases' : 'Phases'}
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

            {phasesForId === c.id && (
              <div style={{ padding: '0 1.25rem 1.25rem', backgroundColor: '#0D0D0D', borderTop: '1px solid #1F1F1F' }}>
                <div style={{ paddingTop: '1rem' }}>
                  <button
                    onClick={startPhaseAdd}
                    style={{ padding: '0.5rem 1rem', backgroundColor: 'transparent', border: '1px solid #63E6A0', color: '#63E6A0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1rem' }}
                  >
                    + Add phase
                  </button>

                  {loadingPhases && <p style={{ color: '#888888', fontSize: '0.8rem' }}>Loading…</p>}

                  {editingPhaseId === 'new' && (
                    <div style={{ border: '1px solid #63E6A0', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div style={{ color: '#63E6A0', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        New phase (added at the end)
                      </div>
                      <div>
                        <label style={labelStyle}>Phase title</label>
                        <input style={inputStyle} value={phaseForm.title} onChange={(e) => setPhaseForm({ ...phaseForm, title: e.target.value })} />
                      </div>
                      <div>
                        <label style={labelStyle}>Description</label>
                        <textarea
                          style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }}
                          value={phaseForm.description}
                          onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
                        />
                      </div>
                      {phaseError && <p style={errorStyle}>{phaseError}</p>}
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={savePhase} disabled={savingPhase || !phaseForm.title} style={primaryBtnStyle}>
                          {savingPhase ? 'Saving…' : 'Add phase'}
                        </button>
                        <button onClick={() => setEditingPhaseId(null)} style={ghostBtnStyle}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {!loadingPhases &&
                    phases.map((p, pi) => (
                      <div key={p.id} style={{ border: '1px solid #1F1F1F', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#63E6A0', flexShrink: 0 }}>
                            P{pi + 1}
                          </span>
                          <span style={{ flex: 1, color: '#E8E8E8', fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.title}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#888888', flexShrink: 0 }}>
                            {p.lessons.length} {p.lessons.length === 1 ? 'lesson' : 'lessons'}
                          </span>
                          <button onClick={() => movePhase(pi, -1)} disabled={pi === 0 || moving} title="Move up" style={{ ...dimBtnStyle, cursor: pi === 0 || moving ? 'not-allowed' : 'pointer' }}>
                            ↑
                          </button>
                          <button onClick={() => movePhase(pi, 1)} disabled={pi === phases.length - 1 || moving} title="Move down" style={{ ...dimBtnStyle, cursor: pi === phases.length - 1 || moving ? 'not-allowed' : 'pointer' }}>
                            ↓
                          </button>
                          <button onClick={() => startPhaseEdit(p)} style={rowBtnStyle}>
                            {editingPhaseId === p.id ? 'Close' : 'Edit'}
                          </button>
                          <button onClick={() => deletePhase(p)} style={dangerBtnStyle}>
                            Delete
                          </button>
                        </div>

                        {editingPhaseId === p.id && (
                          <div style={{ borderTop: '1px solid #1F1F1F', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                              <label style={labelStyle}>Phase title</label>
                              <input style={inputStyle} value={phaseForm.title} onChange={(e) => setPhaseForm({ ...phaseForm, title: e.target.value })} />
                            </div>
                            <div>
                              <label style={labelStyle}>Description</label>
                              <textarea
                                style={{ ...inputStyle, minHeight: '64px', resize: 'vertical' }}
                                value={phaseForm.description}
                                onChange={(e) => setPhaseForm({ ...phaseForm, description: e.target.value })}
                              />
                            </div>
                            {phaseError && <p style={errorStyle}>{phaseError}</p>}
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                              <button onClick={savePhase} disabled={savingPhase || !phaseForm.title} style={primaryBtnStyle}>
                                {savingPhase ? 'Saving…' : 'Save phase'}
                              </button>
                              <button onClick={() => setEditingPhaseId(null)} style={ghostBtnStyle}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        <div style={{ borderTop: '1px solid #1F1F1F', padding: '0.75rem 1rem 1rem' }}>
                          <button
                            onClick={() => startLessonAdd(p.id)}
                            style={{ padding: '0.4rem 0.8rem', backgroundColor: 'transparent', border: '1px solid #1F1F1F', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', cursor: 'pointer', marginBottom: '0.75rem' }}
                          >
                            + Add lesson
                          </button>
                          {addingLessonToPhase === p.id && renderLessonForm(p.id, 'new', true)}
                          {p.lessons.map((l, li) => (
                            <div key={l.id} style={{ border: '1px solid #1F1F1F', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.85rem' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#888888', flexShrink: 0, width: '3.5rem' }}>
                                  Day {l.day_number}
                                </span>
                                <span style={{ flex: 1, color: '#E8E8E8', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {l.title}
                                </span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#888888', flexShrink: 0 }}>
                                  {l.duration_minutes}m
                                </span>
                                <button onClick={() => moveLesson(p.id, li, -1)} disabled={li === 0 || moving} title="Move up" style={{ ...dimBtnStyle, cursor: li === 0 || moving ? 'not-allowed' : 'pointer' }}>
                                  ↑
                                </button>
                                <button onClick={() => moveLesson(p.id, li, 1)} disabled={li === p.lessons.length - 1 || moving} title="Move down" style={{ ...dimBtnStyle, cursor: li === p.lessons.length - 1 || moving ? 'not-allowed' : 'pointer' }}>
                                  ↓
                                </button>
                                <button onClick={() => startLessonEdit(p.id, l)} style={rowBtnStyle}>
                                  {editingLessonId === l.id ? 'Close' : 'Edit'}
                                </button>
                                <button onClick={() => deleteLesson(l)} style={dangerBtnStyle}>
                                  Delete
                                </button>
                              </div>
                              {editingLessonId === l.id && renderLessonForm(p.id, l.id, false)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
