'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { CourseDetail } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#63E6A0" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default function CourseOutlinePage() {
  return (
    <Suspense fallback={null}>
      <CourseOutlineInner />
    </Suspense>
  );
}

function CourseOutlineInner() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/courses/${slug}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data: CourseDetail) => setCourse(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const loginHref = `${API}/api/auth/google?redirect=${encodeURIComponent(`/courses/${slug}`)}`;

  if (loading) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', color: '#888888', fontFamily: 'var(--font-mono)' }}>
        Loading…
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', color: '#888888', fontFamily: 'var(--font-mono)' }}>
        Course not found.
      </div>
    );
  }

  const allLessons = course.phases.flatMap((p) => p.lessons);
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l) => l.completed).length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const nextLesson = allLessons.find((l) => !l.completed) || allLessons[0];

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '4rem 2rem' }}>
        <h1
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            color: '#E8E8E8',
            letterSpacing: '-0.04em',
            marginBottom: '1rem',
          }}
        >
          {course.title}
        </h1>

        {course.description && (
          <p style={{ color: '#888888', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '600px' }}>
            {course.description}
          </p>
        )}

        {course.authenticated ? (
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#63E6A0' }}>
                {completedCount} / {totalLessons} lessons completed
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#888888' }}>{progressPct}%</span>
            </div>
            <div style={{ height: '6px', backgroundColor: '#1F1F1F', marginBottom: '1.25rem' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: '#63E6A0', transition: 'width 0.3s' }} />
            </div>
            {nextLesson && (
              <a
                href={`/courses/${slug}/lessons/${nextLesson.id}`}
                style={{
                  display: 'inline-block',
                  padding: '0.7rem 1.5rem',
                  backgroundColor: '#63E6A0',
                  color: '#0D0D0D',
                  fontFamily: 'var(--font-space-grotesk)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                {completedCount === 0 ? 'Start course →' : completedCount === totalLessons ? 'Review from the start →' : 'Continue →'}
              </a>
            )}
          </div>
        ) : (
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
              marginBottom: '3rem',
            }}
          >
            Sign in with Google to start
          </a>
        )}

        {course.phases.map((phase, phaseIndex) => (
          <div key={phase.id} style={{ marginBottom: '3rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#63E6A0', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Phase {phaseIndex + 1}
              </span>
              <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '1.3rem', fontWeight: 700, color: '#E8E8E8', margin: '0.35rem 0 0' }}>
                {phase.title}
              </h2>
              {phase.description && (
                <p style={{ color: '#888888', fontSize: '0.9rem', marginTop: '0.35rem' }}>{phase.description}</p>
              )}
            </div>

            <div style={{ backgroundColor: '#141414', border: '1px solid #1F1F1F' }}>
              {phase.lessons.map((lesson, i) => {
                const locked = !course.authenticated;
                const content = (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      padding: '1.1rem 1.25rem',
                      borderBottom: i < phase.lessons.length - 1 ? '1px solid #1F1F1F' : 'none',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#888888', flexShrink: 0, width: '3.5rem' }}>
                      Day {lesson.day_number}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: locked ? '#888888' : '#E8E8E8', fontWeight: 700, fontSize: '0.95rem' }}>
                          {lesson.title}
                        </span>
                        {lesson.completed && <CheckIcon />}
                      </div>
                      {lesson.summary && (
                        <p style={{ color: '#888888', fontSize: '0.85rem', lineHeight: 1.6, margin: '0.35rem 0 0' }}>
                          {lesson.summary}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.7rem',
                        color: '#888888',
                        flexShrink: 0,
                      }}
                    >
                      {locked && <LockIcon />}
                      {lesson.duration_minutes}m
                    </span>
                  </div>
                );

                return locked ? (
                  <a key={lesson.id} href={loginHref} style={{ display: 'block', textDecoration: 'none' }}>
                    {content}
                  </a>
                ) : (
                  <a
                    key={lesson.id}
                    href={`/courses/${slug}/lessons/${lesson.id}`}
                    style={{ display: 'block', textDecoration: 'none' }}
                  >
                    {content}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
