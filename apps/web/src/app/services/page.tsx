import type { Metadata } from 'next';
import { apiFetch, Service } from '@/lib/api';
import { TerminalHeading } from '@/components/TerminalHeading';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Hire a Filipino software engineer: Drupal development, DevOps and platform engineering, AI engineering, and technical support leadership. Consulting and staff augmentation.',
  alternates: { canonical: '/services' },
};

// Server-rendered (was client-side fetch): crawlers get the service list in the
// initial HTML instead of an empty grid that only fills in after hydration.
export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const services = await apiFetch<Service[]>('/api/services').catch(() => [] as Service[]);

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>
        <TerminalHeading text="$ ls ./services" />

        <p style={{ color: '#888888', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '640px' }}>
          Consulting and staff augmentation from a Filipino software engineer based in
          the Philippines, working remotely worldwide.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {services.map((svc, i) => (
            <div
              key={svc.id}
              style={{
                padding: '1.75rem',
                border: '1px solid #1F1F1F',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#63E6A0' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#E8E8E8',
                  margin: 0,
                }}
              >
                {svc.title}
              </h3>
              {svc.description && (
                <p style={{ color: '#888888', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                  {svc.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
