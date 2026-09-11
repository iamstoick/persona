'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client';

interface Post {
  id: string;
  type: string;
  status: string;
  title: string;
  author_name: string;
  updated_at: string;
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState({ type: '', status: '', q: '' });

  function load() {
    const params = new URLSearchParams();
    if (filter.type) params.set('type', filter.type);
    if (filter.status) params.set('status', filter.status);
    if (filter.q) params.set('q', filter.q);

    authFetch(`/api/admin/posts?${params}`)
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]));
  }

  useEffect(() => { load(); }, [filter]);

  async function deletePost(id: string) {
    if (!confirm('Archive this post?')) return;
    await authFetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    load();
  }

  const selectStyle: React.CSSProperties = {
    padding: '0.4rem 0.75rem',
    backgroundColor: '#141414',
    border: '1px solid #1F1F1F',
    color: '#888888',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: '1.75rem', color: '#E8E8E8' }}>Posts</h1>
        <a
          href="/admin/posts/new"
          style={{ padding: '0.5rem 1.25rem', backgroundColor: '#63E6A0', color: '#0D0D0D', fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none' }}
        >
          + New
        </a>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <select style={selectStyle} value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}>
          <option value="">All types</option>
          <option value="post">Post</option>
          <option value="page">Page</option>
        </select>
        <select style={selectStyle} value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <input
          placeholder="Search title…"
          style={{ ...selectStyle, flex: 1 }}
          value={filter.q}
          onChange={(e) => setFilter({ ...filter, q: e.target.value })}
        />
      </div>

      <div style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1F1F1F' }}>
              {['Title', 'Type', 'Status', 'Author', 'Updated', ''].map((h) => (
                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 400 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} style={{ borderBottom: '1px solid #1F1F1F' }}>
                <td style={{ padding: '0.75rem 1rem', color: '#E8E8E8', fontSize: '0.9rem' }}>{post.title}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{post.type}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    backgroundColor: post.status === 'published' ? '#00C48C22' : post.status === 'draft' ? '#FFB80022' : '#88888822',
                    color: post.status === 'published' ? '#00C48C' : post.status === 'draft' ? '#FFB800' : '#888888',
                  }}>
                    {post.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem 1rem', color: '#888888', fontSize: '0.8rem' }}>{post.author_name}</td>
                <td style={{ padding: '0.75rem 1rem', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  {new Date(post.updated_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href={`/admin/posts/${post.id}`} style={{ color: '#63E6A0', fontSize: '0.8rem', textDecoration: 'none' }}>Edit</a>
                    <button onClick={() => deletePost(post.id)} style={{ background: 'none', border: 'none', color: '#FF4444', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>Archive</button>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  No posts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
