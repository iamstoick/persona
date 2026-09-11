import type { Post } from '@/lib/api';
import { ShareButtons } from '@/components/ShareButtons';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://geraldvillorente.com';

interface Props {
  featured: Post | null;
  posts: Post[];
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function Writing({ featured, posts }: Props) {
  const rest = posts.filter((p) => p.id !== featured?.id);

  return (
    <section
      id="writing"
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
        Writing
      </h2>

      {featured && (
        <a
          href={`/blog/${featured.slug}`}
          style={{
            display: 'block',
            padding: '2rem',
            marginBottom: '2.5rem',
            backgroundColor: '#141414',
            borderLeft: '3px solid #63E6A0',
            textDecoration: 'none',
          }}
        >
          {featured.categories && featured.categories.length > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: '#63E6A0',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '0.75rem',
              }}
            >
              {featured.categories[0]}
            </span>
          )}
          <h3
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#E8E8E8',
              marginBottom: '0.75rem',
              letterSpacing: '-0.02em',
            }}
          >
            {featured.title}
          </h3>
          {featured.excerpt && (
            <p style={{ color: '#888888', lineHeight: 1.7, marginBottom: '1rem' }}>{featured.excerpt}</p>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#63E6A0' }}>Read →</span>
        </a>
      )}

      {rest.length === 0 && !featured && (
        <p style={{ color: '#888888' }}>No articles yet. Check back soon.</p>
      )}

      <div>
        {rest.map((post, i) => (
          <div key={post.id}>
            {i > 0 && <hr style={{ border: 'none', borderTop: '1px solid #1F1F1F', margin: '1.25rem 0' }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.25rem 0' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: '#888888',
                  flexShrink: 0,
                  minWidth: '90px',
                }}
              >
                {formatDate(post.published_at)}
              </span>
              <a
                href={`/blog/${post.slug}`}
                style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: '#E8E8E8', flex: 1, textDecoration: 'none' }}
              >
                {post.title}
              </a>
              <ShareButtons url={`${siteUrl}/blog/${post.slug}`} title={post.title} />
            </div>
          </div>
        ))}
      </div>

      {(posts.length > 0 || featured) && (
        <div style={{ marginTop: '2rem' }}>
          <a href="/blog" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#63E6A0', textDecoration: 'none' }}>
            All articles →
          </a>
        </div>
      )}
    </section>
  );
}
