'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/client';
import { PostForm } from '@/components/PostForm';
import { use } from 'react';

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState(null);

  useEffect(() => {
    authFetch(`/api/admin/posts/${id}`)
      .then((r) => r.json())
      .then(setPost)
      .catch(() => {});
  }, [id]);

  if (!post) return (
    <div style={{ color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>Loading…</div>
  );

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 800, fontSize: '1.75rem', color: '#E8E8E8', marginBottom: '2rem' }}>
        Edit post
      </h1>
      <PostForm initial={post} />
    </div>
  );
}
