'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client';
import type { Project } from '@/lib/api';

const EMPTY_FORM = { title: '', excerpt: '', tags: '', github_url: '', sort_order: 0 };

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

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    authFetch('/api/admin/projects')
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]));
  }

  useEffect(load, []);

  function startCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sort_order: projects.length });
    setShowForm(true);
  }

  function startEdit(p: Project) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      excerpt: p.excerpt || '',
      tags: p.tags.join(', '),
      github_url: p.github_url || '',
      sort_order: p.sort_order,
    });
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    const path = editingId ? `/api/admin/projects/${editingId}` : '/api/admin/projects';
    try {
      await authFetch(path, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(form),
      });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this project?')) return;
    await authFetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: '1.75rem', color: '#E8E8E8' }}>
          Projects
        </h1>
        <button
          onClick={startCreate}
          style={{ padding: '0.5rem 1.25rem', backgroundColor: '#63E6A0', color: '#0D0D0D', fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
        >
          + New
        </button>
      </div>

      {showForm && (
        <div style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Excerpt</label>
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Tags (comma-separated)</label>
              <input style={inputStyle} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="next.js, express, docker" />
            </div>
            <div>
              <label style={labelStyle}>GitHub URL</label>
              <input style={inputStyle} value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/..." />
            </div>
          </div>
          <div style={{ width: '120px' }}>
            <label style={labelStyle}>Sort order</label>
            <input type="number" style={inputStyle} value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
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
              onClick={() => setShowForm(false)}
              style={{ padding: '0.5rem 1.25rem', backgroundColor: 'transparent', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', border: '1px solid #1F1F1F', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F' }}>
        {projects.length === 0 && (
          <p style={{ padding: '1.5rem', color: '#888888', margin: 0 }}>No projects yet.</p>
        )}
        {projects.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderBottom: i < projects.length - 1 ? '1px solid #1F1F1F' : 'none' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#888888', width: '2rem' }}>{p.sort_order}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#E8E8E8', fontWeight: 700, fontSize: '0.9rem' }}>{p.title}</div>
              {p.tags.length > 0 && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#63E6A0', marginTop: '0.25rem' }}>
                  {p.tags.join(', ')}
                </div>
              )}
            </div>
            <button onClick={() => startEdit(p)} style={{ background: 'none', border: 'none', color: '#63E6A0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
              Edit
            </button>
            <button onClick={() => remove(p.id)} style={{ background: 'none', border: 'none', color: '#FF4444', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
