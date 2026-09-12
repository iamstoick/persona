import type { SocialLink } from '@/lib/api';

const DEFAULT_EMAIL = 'gerald@geraldvillorente.com';
const DEFAULT_HEADLINE = "Have an infrastructure or Drupal problem worth solving? Let's talk.";
const DEFAULT_SOCIALS: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/iamstoick' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/geraldvillorente' },
  { label: 'X', href: 'https://twitter.com/geraldvillorente' },
];

interface Props {
  email?: string;
  headline?: string;
  socials?: SocialLink[];
}

export function Contact({ email = DEFAULT_EMAIL, headline = DEFAULT_HEADLINE, socials = DEFAULT_SOCIALS }: Props) {
  return (
    <section
      id="contact"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '6rem 2rem 8rem',
        scrollMarginTop: '80px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: '#63E6A0',
          display: 'block',
          marginBottom: '1.5rem',
        }}
      >
        Contact
      </span>

      <h2
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontSize: 'clamp(2rem, 4vw, 2.75rem)',
          fontWeight: 800,
          color: '#E8E8E8',
          letterSpacing: '-0.03em',
          maxWidth: '700px',
          marginBottom: '2rem',
        }}
      >
        {headline}
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center', marginBottom: '2rem' }}>
        <a
          href={`mailto:${email}`}
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
          {email}
        </a>
        <a
          href="/contact"
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: '#888888',
            textDecoration: 'none',
          }}
        >
          or use the contact form →
        </a>
      </div>

      <div style={{ display: 'flex', gap: '1.75rem' }}>
        {socials.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#888888', textDecoration: 'none' }}
          >
            {s.label}
          </a>
        ))}
      </div>
    </section>
  );
}
