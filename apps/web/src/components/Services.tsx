import type { Service } from '@/lib/api';

const DEFAULT_SERVICES: Service[] = [
  {
    id: 'default-1',
    title: 'Drupal architecture & audits',
    description: 'Site-building review, performance audits, and upgrade paths to Drupal 10/11.',
    sort_order: 0,
  },
  {
    id: 'default-2',
    title: 'DevOps & CI/CD setup',
    description: 'Pipelines, containerization, and Kubernetes deployments built for your team’s workflow.',
    sort_order: 1,
  },
  {
    id: 'default-3',
    title: 'Fractional platform engineering',
    description: 'Ongoing, part-time engineering support for teams that need senior coverage without a full hire.',
    sort_order: 2,
  },
];

interface Props {
  services?: Service[];
}

export function Services({ services = DEFAULT_SERVICES }: Props) {
  return (
    <section
      id="services"
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
        Services
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
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
    </section>
  );
}
