'use client';

import { useEffect, useState } from 'react';
import { apiFetch, SlideDeck } from '@/lib/api';
import { TerminalHeading } from '@/components/TerminalHeading';

export default function SlidesPage() {
  const [decks, setDecks] = useState<SlideDeck[]>([]);

  useEffect(() => {
    apiFetch<SlideDeck[]>('/api/slides')
      .then((data) => setDecks(Array.isArray(data) ? data : []))
      .catch(() => setDecks([]));
  }, []);

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>
        <TerminalHeading text="$ ls ./slides" />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {decks.map((deck) => (
            <a
              key={deck.id}
              href={`/slides/${deck.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.75rem',
                backgroundColor: '#141414',
                border: '1px solid #1F1F1F',
                textDecoration: 'none',
              }}
            >
              <span
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#63E6A0' }}
              >
                {deck.slide_count} {deck.slide_count === 1 ? 'slide' : 'slides'} · members only
              </span>
              <h3
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: '#E8E8E8',
                  margin: 0,
                }}
              >
                {deck.title}
              </h3>
              {deck.description && (
                <p style={{ color: '#888888', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                  {deck.description}
                </p>
              )}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: '#63E6A0',
                  marginTop: 'auto',
                }}
              >
                View deck →
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
