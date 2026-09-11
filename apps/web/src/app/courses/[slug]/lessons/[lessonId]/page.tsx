'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTokens, useCaptureAuthTokens } from '@/lib/auth/client';
import { renderTiptapContent } from '@/lib/renderTiptap';
import type { CourseLessonFull } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CourseLessonPage() {
  return (
    <Suspense fallback={null}>
      <CourseLessonInner />
    </Suspense>
  );
}

function CourseLessonInner() {
  useCaptureAuthTokens();
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const [lesson, setLesson] = useState<CourseLessonFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [marking, setMarking] = useState(false);

  const loginHref = `${API}/api/auth/google?redirect=${encodeURIComponent(`/courses/${slug}/lessons/${lessonId}`)}`;

  function load() {
    const { accessToken } = getTokens();
    if (!accessToken) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    fetch(`${API}/api/courses/${slug}/lessons/${lessonId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => {
        if (r.status === 401) throw new Error('unauthorized');
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data: CourseLessonFull) => setLesson(data))
      .catch((err) => {
        if (err.message === 'unauthorized') setUnauthorized(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [slug, lessonId]);

  async function toggleComplete() {
    if (!lesson) return;
    setMarking(true);
    const { accessToken } = getTokens();
    try {
      await fetch(`${API}/api/courses/${slug}/lessons/${lessonId}/complete`, {
        method: lesson.completed ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setLesson({ ...lesson, completed: !lesson.completed });
    } finally {
      setMarking(false);
    }
  }

  if (loading) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', color: '#888888', fontFamily: 'var(--font-mono)' }}>
        Loading…
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center' }}>
        <p style={{ color: '#888888', marginBottom: '1.5rem' }}>Sign in to view this lesson.</p>
        <a
          href={loginHref}
          style={{
            display: 'inline-block',
            padding: '0.875rem 1.75rem',
            backgroundColor: '#63E6A0',
            color: '#0D0D0D',
            fontFamily: 'var(--font-space-grotesk)',
            fontWeight: 700,
            fontSize: '0.95rem',
            textDecoration: 'none',
          }}
        >
          Sign in with Google
        </a>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', color: '#888888', fontFamily: 'var(--font-mono)' }}>
        Lesson not found.
      </div>
    );
  }

  const html = renderTiptapContent(lesson.content);

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <article style={{ maxWidth: '740px', margin: '0 auto', padding: '4rem 2rem' }}>
        <a
          href={`/courses/${slug}`}
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#63E6A0', textDecoration: 'none' }}
        >
          ← {lesson.course_title}
        </a>

        <div style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#888888', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {lesson.phase_title} · Day {lesson.day_number} · {lesson.duration_minutes}m
          </span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: '#E8E8E8',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            marginBottom: '2rem',
          }}
        >
          {lesson.title}
        </h1>

        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} style={{ color: '#E8E8E8', lineHeight: 1.8, fontSize: '1.05rem' }} />

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #1F1F1F' }}>
          <button
            type="button"
            onClick={toggleComplete}
            disabled={marking}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: lesson.completed ? 'transparent' : '#63E6A0',
              color: lesson.completed ? '#63E6A0' : '#0D0D0D',
              border: lesson.completed ? '1px solid #63E6A0' : 'none',
              fontFamily: 'var(--font-space-grotesk)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: marking ? 'not-allowed' : 'pointer',
            }}
          >
            {lesson.completed ? '✓ Completed' : 'Mark as complete'}
          </button>
        </div>
      </article>
    </div>
  );
}
