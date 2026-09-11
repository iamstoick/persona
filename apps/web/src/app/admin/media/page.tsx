'use client';

import { useEffect, useRef, useState } from 'react';
import { authFetch } from '@/lib/auth/client';

interface Media {
  id: string;
  filename: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string;
  created_at: string;
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function load() {
    authFetch('/api/admin/media').then((r) => r.json()).then((data) => setItems(Array.isArray(data) ? data : [])).catch(() => setItems([]));
  }

  useEffect(load, []);

  async function upload(files: FileList) {
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      await authFetch('/api/admin/media', {
        method: 'POST',
        headers: {},
        body: fd,
      }).catch(() => {});
    }
    setUploading(false);
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete this file?')) return;
    await authFetch(`/api/admin/media/${id}`, { method: 'DELETE' }).catch(() => {});
    load();
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: '1.75rem', color: '#E8E8E8', marginBottom: '2rem' }}>Media library</h1>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#63E6A0' : '#1F1F1F'}`,
          padding: '2.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '2rem',
          backgroundColor: dragging ? '#63E6A011' : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => e.target.files && upload(e.target.files)} />
        <p style={{ color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          {uploading ? 'Uploading…' : 'Drop files here or click to upload'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
        {items.map((item) => (
          <div key={item.id} style={{ position: 'relative', backgroundColor: '#141414', border: '1px solid #1F1F1F' }}>
            {item.mime_type?.startsWith('image/') ? (
              <div style={{ height: '120px', backgroundImage: `url(${item.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            ) : (
              <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                {item.mime_type}
              </div>
            )}
            <div style={{ padding: '0.5rem' }}>
              <p style={{ color: '#888888', fontSize: '0.7rem', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.filename}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#63E6A0', fontSize: '0.7rem', textDecoration: 'none' }}>View</a>
                <button onClick={() => del(item.id)} style={{ background: 'none', border: 'none', color: '#FF4444', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>Del</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
