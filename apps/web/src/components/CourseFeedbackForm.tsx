'use client';

import { useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Feedback {
  id: string;
  rating: number;
  missing_topics: string | null;
  improvements: string | null;
}

interface Props {
  slug: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.6rem 0.85rem',
  backgroundColor: '#0D0D0D',
  border: '1px solid #1F1F1F',
  color: '#E8E8E8',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
  resize: 'vertical',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#888888',
  fontSize: '0.75rem',
  fontFamily: 'var(--font-mono)',
  marginBottom: '0.4rem',
};

// Shown on a course's outline page once a signed-in student has completed every lesson —
// the goal is specifically to surface what's missing or could be improved, not general
// praise, so the two text fields are framed that way rather than as an open "comments" box.
export function CourseFeedbackForm({ slug }: Props) {
  const [existing, setExisting] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [missingTopics, setMissingTopics] = useState('');
  const [improvements, setImprovements] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/courses/${slug}/feedback/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Feedback | null) => setExisting(data))
      .catch(() => setExisting(null))
      .finally(() => setLoading(false));
  }, [slug]);

  async function submit() {
    if (rating === 0) {
      setError('Please choose a rating.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/courses/${slug}/feedback`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          missing_topics: missingTopics || null,
          improvements: improvements || null,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
    } catch {
      setError('Something went wrong submitting your feedback — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  const wrapperStyle: React.CSSProperties = {
    backgroundColor: '#141414',
    border: '1px solid #1F1F1F',
    borderLeft: '3px solid #63E6A0',
    padding: '1.75rem',
    marginBottom: '3rem',
  };

  if (existing || submitted) {
    return (
      <div style={wrapperStyle}>
        <p style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: '#E8E8E8', fontSize: '1rem', margin: 0 }}>
          🎉 You&apos;ve completed this course — thanks for your feedback!
        </p>
        <p style={{ color: '#888888', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>
          It genuinely helps shape what gets added or fixed next.
        </p>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <p style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: '#E8E8E8', fontSize: '1.1rem', margin: 0 }}>
        🎉 You&apos;ve completed this course!
      </p>
      <p style={{ color: '#888888', fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
        Before you go — what was missing, or what could be improved? A couple of sentences is plenty.
      </p>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={labelStyle}>How would you rate this course overall?</label>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? 's' : ''}`}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                fontSize: '1.2rem',
                backgroundColor: n <= rating ? '#63E6A0' : 'transparent',
                color: n <= rating ? '#0D0D0D' : '#888888',
                border: '1px solid ' + (n <= rating ? '#63E6A0' : '#1F1F1F'),
                cursor: 'pointer',
              }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={labelStyle}>What topic or example felt missing?</label>
        <textarea
          style={{ ...inputStyle, minHeight: '70px' }}
          placeholder="e.g. I wish Day 3 covered how to handle..."
          value={missingTopics}
          onChange={(e) => setMissingTopics(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={labelStyle}>What would you improve?</label>
        <textarea
          style={{ ...inputStyle, minHeight: '70px' }}
          placeholder="e.g. The Day 5 project was too rushed for one hour..."
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
        />
      </div>

      {error && (
        <p style={{ color: '#FF4444', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '1rem' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        style={{
          padding: '0.7rem 1.5rem',
          backgroundColor: '#63E6A0',
          color: '#0D0D0D',
          fontFamily: 'var(--font-space-grotesk)',
          fontWeight: 700,
          fontSize: '0.9rem',
          border: 'none',
          cursor: submitting ? 'not-allowed' : 'pointer',
        }}
      >
        {submitting ? 'Submitting…' : 'Submit feedback'}
      </button>
    </div>
  );
}
