'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth/client';
import { renderTiptapContent } from '@/lib/renderTiptap';
import type { CourseDetail, CourseLessonFull } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#63E6A0" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default function CourseLessonPage() {
  return (
    <Suspense fallback={null}>
      <CourseLessonInner />
    </Suspense>
  );
}

function CourseLessonInner() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const [lesson, setLesson] = useState<CourseLessonFull | null>(null);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [marking, setMarking] = useState(false);

  const loginHref = `${API}/api/auth/google?redirect=${encodeURIComponent(`/courses/${slug}/lessons/${lessonId}`)}`;

  function load() {
    if (!isLoggedIn()) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    Promise.all([
      fetch(`${API}/api/courses/${slug}/lessons/${lessonId}`, { credentials: 'include' }).then((r) => {
        if (r.status === 401) throw new Error('unauthorized');
        if (!r.ok) throw new Error('not found');
        return r.json();
      }),
      fetch(`${API}/api/courses/${slug}`, { credentials: 'include' }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([lessonData, courseData]: [CourseLessonFull, CourseDetail | null]) => {
        setLesson(lessonData);
        setCourse(courseData);
      })
      .catch((err) => {
        if (err.message === 'unauthorized') setUnauthorized(true);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [slug, lessonId]);

  async function toggleComplete() {
    if (!lesson) return;
    setMarking(true);
    try {
      await fetch(`${API}/api/courses/${slug}/lessons/${lessonId}/complete`, {
        method: lesson.completed ? 'DELETE' : 'POST',
        credentials: 'include',
      });
      const nowCompleted = !lesson.completed;
      setLesson({ ...lesson, completed: nowCompleted });
      setCourse((c) =>
        c
          ? {
              ...c,
              phases: c.phases.map((p) => ({
                ...p,
                lessons: p.lessons.map((l) => (l.id === lessonId ? { ...l, completed: nowCompleted } : l)),
              })),
            }
          : c
      );
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
  const allLessons = course?.phases.flatMap((p) => p.lessons) || [];
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const navBtnStyle: React.CSSProperties = {
    padding: '0.6rem 1rem',
    backgroundColor: 'transparent',
    border: '1px solid #1F1F1F',
    color: '#E8E8E8',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
  };

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <article style={{ maxWidth: '740px', margin: '0 auto', padding: '4rem 2rem' }}>
        {/* Breadcrumb */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          <a href={`/courses/${slug}`} style={{ color: '#63E6A0', textDecoration: 'none' }}>
            {lesson.course_title}
          </a>
          <span style={{ color: '#888888' }}> / {lesson.phase_title} / Day {lesson.day_number}</span>
        </div>

        {course && allLessons.length > 0 && (
          <details style={{ marginBottom: '2rem', border: '1px solid #1F1F1F', backgroundColor: '#141414' }}>
            <summary
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: '#888888',
              }}
            >
              Course contents ({allLessons.filter((l) => l.completed).length}/{allLessons.length} completed)
            </summary>
            <div style={{ borderTop: '1px solid #1F1F1F' }}>
              {allLessons.map((l) => (
                <a
                  key={l.id}
                  href={`/courses/${slug}/lessons/${l.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.6rem 1rem',
                    textDecoration: 'none',
                    backgroundColor: l.id === lessonId ? '#63E6A011' : 'transparent',
                    borderLeft: l.id === lessonId ? '2px solid #63E6A0' : '2px solid transparent',
                  }}
                >
                  <span style={{ width: '14px', flexShrink: 0 }}>{l.completed && <CheckIcon />}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#888888', flexShrink: 0, width: '3.5rem' }}>
                    Day {l.day_number}
                  </span>
                  <span style={{ color: l.id === lessonId ? '#E8E8E8' : '#888888', fontSize: '0.85rem' }}>{l.title}</span>
                </a>
              ))}
            </div>
          </details>
        )}

        <div style={{ marginBottom: '0.75rem' }}>
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
              marginBottom: '2rem',
            }}
          >
            {lesson.completed ? '✓ Completed' : 'Mark as complete'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            {prevLesson ? (
              <a href={`/courses/${slug}/lessons/${prevLesson.id}`} style={navBtnStyle}>
                ← Day {prevLesson.day_number}: {prevLesson.title}
              </a>
            ) : (
              <span />
            )}
            {nextLesson ? (
              <a href={`/courses/${slug}/lessons/${nextLesson.id}`} style={{ ...navBtnStyle, marginLeft: 'auto', backgroundColor: '#63E6A0', color: '#0D0D0D', border: 'none' }}>
                Day {nextLesson.day_number}: {nextLesson.title} →
              </a>
            ) : (
              <a href={`/courses/${slug}`} style={{ ...navBtnStyle, marginLeft: 'auto', backgroundColor: '#63E6A0', color: '#0D0D0D', border: 'none' }}>
                🎉 Back to course overview
              </a>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
