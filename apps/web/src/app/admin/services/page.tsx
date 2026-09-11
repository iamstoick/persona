'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client';
import type { Service } from '@/lib/api';

const EMPTY_FORM = { title: '', description: '', sort_order: 0 };

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

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    authFetch('/api/admin/services')
      .then((r) => r.json())
      .then((data) => setServices(Array.isArray(data) ? data : []))
      .catch(() => setServices([]));
  }

  useEffect(load, []);

  function startCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sort_order: services.length });
    setShowForm(true);
  }

  function startEdit(s: Service) {
    setEditingId(s.id);
    setForm({ title: s.title, description: s.description || '', sort_order: s.sort_order });
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    const path = editingId ? `/api/admin/services/${editingId}` : '/api/admin/services';
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
    if (!confirm('Delete this service?')) return;
    await authFetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: '1.75rem', color: '#E8E8E8' }}>
          Services
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
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
        {services.length === 0 && (
          <p style={{ padding: '1.5rem', color: '#888888', margin: 0 }}>No services yet.</p>
        )}
        {services.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', borderBottom: i < services.length - 1 ? '1px solid #1F1F1F' : 'none' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#888888', width: '2rem' }}>{s.sort_order}</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#E8E8E8', fontWeight: 700, fontSize: '0.9rem' }}>{s.title}</div>
              {s.description && (
                <div style={{ color: '#888888', fontSize: '0.8rem', marginTop: '0.25rem' }}>{s.description}</div>
              )}
            </div>
            <button onClick={() => startEdit(s)} style={{ background: 'none', border: 'none', color: '#63E6A0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
              Edit
            </button>
            <button onClick={() => remove(s.id)} style={{ background: 'none', border: 'none', color: '#FF4444', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
