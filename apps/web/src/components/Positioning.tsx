// One-line positioning strip directly under the hero. Carries the site's primary
// keywords in visible, crawlable copy without touching the hero's designed headline.
export function Positioning() {
  return (
    <section
      aria-label="About"
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '0 2rem',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          lineHeight: 1.8,
          color: '#888888',
          maxWidth: '720px',
          margin: 0,
          borderLeft: '2px solid #63E6A0',
          paddingLeft: '1.25rem',
        }}
      >
        Filipino software engineer based in the Philippines — working worldwide as a{' '}
        <strong style={{ color: '#E8E8E8', fontWeight: 600 }}>Drupal developer</strong>,{' '}
        <strong style={{ color: '#E8E8E8', fontWeight: 600 }}>DevOps engineer</strong>, and{' '}
        <strong style={{ color: '#E8E8E8', fontWeight: 600 }}>AI engineer</strong>. Consulting,
        staff augmentation, and technical support leadership for teams that need senior,
        reliable coverage.
      </p>
    </section>
  );
}
