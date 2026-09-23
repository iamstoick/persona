import type { SlideDeck } from '@/lib/api';

const DEFAULT_SLIDES: SlideDeck[] = [
  {
    id: 'default-1',
    slug: 'how-to-be-an-ai-engineer',
    title: 'AI for professors: use it, teach with it, earn from it',
    description:
      'A plain-language talk for educators with little or no AI background: what AI can do for you this week, how it works, why your expertise is the rare skill, side-hustle paths, what it pays, and a 90-day roadmap. 14 slides, about 15 minutes.',
    slide_count: 14,
    sort_order: 0,
  },
];

interface Props {
  decks?: SlideDeck[];
}

export function Slides({ decks = DEFAULT_SLIDES }: Props) {
  return (
    <section
      id="slides"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '4rem 2rem 6rem',
        scrollMarginTop: '80px',
      }}
    >
      <h2
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#E8E8E8',
          marginBottom: '2.5rem',
          letterSpacing: '-0.03em',
        }}
      >
        Slides
      </h2>

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
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#63E6A0' }}>
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

      <div style={{ marginTop: '2rem' }}>
        <a
          href="/slides"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: '#63E6A0',
            textDecoration: 'none',
          }}
        >
          View all slides →
        </a>
      </div>
    </section>
  );
}
