'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client';

interface MenuItem {
  id: string;
  label: string;
  url: string | null;
  post_slug: string | null;
  order: number;
  target: string;
}

export default function AdminMenusPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/menus/primary_nav`)
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .catch(() => {});
  }

  useEffect(load, []);

  function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    next.forEach((item, i) => { item.order = i + 1; });
    setItems(next);
  }

  async function save() {
    setSaving(true);
    for (const item of items) {
      await authFetch(`/api/admin/menu-items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ order: item.order }),
      }).catch(() => {});
    }
    setSaving(false);
    load();
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: '1.75rem', color: '#E8E8E8' }}>Menus</h1>
        <button
          onClick={save}
          disabled={saving}
          style={{ padding: '0.5rem 1.25rem', backgroundColor: '#63E6A0', color: '#0D0D0D', fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
        >
          {saving ? 'Saving…' : 'Save order'}
        </button>
      </div>

      <p style={{ color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>primary_nav</p>

      <div style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F' }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderBottom: '1px solid #1F1F1F' }}>
            <span style={{ color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', minWidth: '24px' }}>
              {item.order}
            </span>
            <span style={{ flex: 1, color: '#E8E8E8', fontSize: '0.9rem' }}>{item.label}</span>
            <span style={{ color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              {item.post_slug ? `/${item.post_slug}` : item.url}
            </span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button onClick={() => move(i, -1)} disabled={i === 0} style={{ background: 'none', border: '1px solid #1F1F1F', color: '#888888', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>↑</button>
              <button onClick={() => move(i, 1)} disabled={i === items.length - 1} style={{ background: 'none', border: '1px solid #1F1F1F', color: '#888888', padding: '0.2rem 0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>↓</button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>No menu items.</p>
        )}
      </div>
    </div>
  );
}
