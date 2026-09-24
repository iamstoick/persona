// Visible FAQ section targeting long-tail searches ("drupal developer
// philippines", "filipino devops engineer", ...). The FAQPage JSON-LD below must
// always mirror the visible questions — Google only grants FAQ rich results when
// the structured data matches on-page content.
const FAQS = [
  {
    q: 'Are you available as a Drupal developer in the Philippines?',
    a: 'Yes. I am a Filipino Drupal developer working with Drupal 10 and 11: site building, custom modules and themes, migrations, performance audits, and managed hosting on platforms like Pantheon. I work with clients worldwide, remotely from the Philippines.',
  },
  {
    q: 'What does your DevOps and platform engineering work cover?',
    a: 'CI/CD pipelines, Docker and Kubernetes deployments, infrastructure as code with Terraform, and observability with Grafana and Prometheus. As a Filipino DevOps engineer, I offer both project-based setups and ongoing fractional platform support.',
  },
  {
    q: 'Are you taking work as a Filipino AI engineer?',
    a: 'Yes — I am a Filipino AI expert building LLM-powered applications: coding agents, RAG systems, and workflow automation. I also teach AI engineering and describe myself as a proud Pinoy vibe coder: a Pinoy AI expert shipping real software with AI-assisted development, properly reviewed and tested.',
  },
  {
    q: 'What is your technical support background?',
    a: 'Before consulting full-time, I spent years as a technical support engineer and support leader on hosting platforms — a Filipino technical support expert debugging production systems for customers around the clock. That background is why my builds emphasize reliability, clear documentation, and fast incident response.',
  },
  {
    q: 'Where are you based, and how do engagements work?',
    a: 'I am based in the Philippines and work remotely with clients in any timezone, with overlap hours for the US, Europe, and Australia. Engagements start with a short discovery call, then a fixed-scope proposal for projects or a monthly retainer for ongoing staff augmentation.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export function Faq() {
  return (
    <section
      id="faq"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '4rem 2rem 6rem',
        scrollMarginTop: '80px',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h2
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#E8E8E8',
          marginBottom: '2rem',
          letterSpacing: '-0.03em',
        }}
      >
        FAQ
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {FAQS.map((f) => (
          <div
            key={f.q}
            style={{
              padding: '1.5rem 0',
              borderTop: '1px solid #1F1F1F',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: '#E8E8E8',
                margin: '0 0 0.6rem',
              }}
            >
              {f.q}
            </h3>
            <p style={{ color: '#888888', fontSize: '0.95rem', lineHeight: 1.75, margin: 0, maxWidth: '720px' }}>
              {f.a}
            </p>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #1F1F1F' }} />
      </div>
    </section>
  );
}
