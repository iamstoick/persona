'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth/client';
import { SlidePresenter } from '@/components/SlidePresenter';
import type { SlideDeckDetail } from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function SlideDeckPage() {
  return (
    <Suspense fallback={null}>
      <SlideDeckInner />
    </Suspense>
  );
}

function SlideDeckInner() {
  const { slug } = useParams<{ slug: string }>();
  const [deck, setDeck] = useState<SlideDeckDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const loginHref = `${API}/api/auth/google?redirect=${encodeURIComponent(`/slides/${slug}`)}`;

  useEffect(() => {
    if (!isLoggedIn()) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    fetch(`${API}/api/slides/${slug}`, { credentials: 'include' })
      .then((r) => {
        if (r.status === 401) throw new Error('unauthorized');
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then((data: SlideDeckDetail) => setDeck(data))
      .catch((err) => {
        if (err.message === 'unauthorized') setUnauthorized(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div
        style={{
          paddingTop: '120px',
          textAlign: 'center',
          color: '#888888',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Loading…
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center' }}>
        <p style={{ color: '#888888', marginBottom: '1.5rem' }}>Sign in to view this slide deck.</p>
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

  if (!deck) {
    return (
      <div
        style={{
          paddingTop: '120px',
          textAlign: 'center',
          color: '#888888',
          fontFamily: 'var(--font-mono)',
        }}
      >
        Slide deck not found.
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          <a href="/slides" style={{ color: '#63E6A0', textDecoration: 'none' }}>
            ← All slides
          </a>
        </div>

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
          {deck.title}
        </h1>

        {deck.description && (
          <p
            style={{ color: '#888888', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '640px' }}
          >
            {deck.description}
          </p>
        )}

        <SlidePresenter deckTitle={deck.title} slides={deck.slides} />
      </div>
    </div>
  );
}
