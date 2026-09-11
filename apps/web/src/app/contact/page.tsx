import { apiFetch, SiteSettings } from '@/lib/api';
import { ContactForm } from '@/components/ContactForm';

const DEFAULT_EMAIL = 'gerald@geraldvillorente.com';
const DEFAULT_SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/geraldvillorente' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/geraldvillorente' },
  { label: 'X', href: 'https://twitter.com/geraldvillorente' },
];

async function getContactSettings() {
  const settings = await apiFetch<SiteSettings>('/api/settings').catch(() => ({}) as SiteSettings);
  return {
    email: settings.contact?.email || DEFAULT_EMAIL,
    socials: settings.contact?.socials || DEFAULT_SOCIALS,
  };
}

export default async function ContactPage() {
  const { email, socials } = await getContactSettings();
  const links = [...socials, { label: 'Email', href: `mailto:${email}` }];

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 2rem' }}>
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
          Contact
        </h1>

        <p style={{ color: '#888888', lineHeight: 1.7, marginBottom: '3rem', maxWidth: '480px' }}>
          Open to consulting, staff augmentation, speaking invitations, and interesting technical
          conversations. Response time is usually within two business days.
        </p>

        <ContactForm email={email} />

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #1F1F1F' }}>
          {links.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target={s.label !== 'Email' ? '_blank' : undefined}
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#888888',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                transition: 'color 0.2s',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '28px',
                  height: '28px',
                  border: '1px solid #1F1F1F',
                  textAlign: 'center',
                  lineHeight: '28px',
                  fontSize: '0.7rem',
                  color: '#888888',
                }}
              >
                {s.label === 'Email' ? '@' : s.label.slice(0, 2).toUpperCase()}
              </span>
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
