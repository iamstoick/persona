import Image from 'next/image';
import { apiFetch, Post, PostsResponse } from '@/lib/api';

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function getBlogData(page = 1) {
  try {
    const [featured, all] = await Promise.all([
      apiFetch<Post>('/api/posts/featured'),
      apiFetch<PostsResponse>(`/api/posts?type=post&status=published&page=${page}&limit=12`),
    ]);
    return { featured, all };
  } catch {
    return { featured: null, all: { data: [], total: 0, page: 1, limit: 12 } };
  }
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || '1');
  const { featured, all } = await getBlogData(page);

  const rest = all.data.filter((p) => p.id !== featured?.id);
  const grid = rest.slice(0, 3);
  const list = rest.slice(3);

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      {/* Hero featured post */}
      {featured && (
        <section
          style={{
            position: 'relative',
            minHeight: '420px',
            background: featured.featured_image_url ? undefined : 'linear-gradient(135deg, #141414 0%, #0D0D0D 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '4rem 2rem',
            overflow: 'hidden',
          }}
        >
          {featured.featured_image_url && (
            <>
              <Image
                src={featured.featured_image_url}
                alt={featured.title}
                fill
                sizes="100vw"
                priority
                style={{ objectFit: 'cover', zIndex: 0 }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, rgba(13,13,13,0.3), rgba(13,13,13,0.95))',
                  zIndex: 1,
                }}
              />
            </>
          )}
          <div style={{ maxWidth: '700px', position: 'relative', zIndex: 2 }}>
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
            <h1
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                fontWeight: 800,
                color: '#E8E8E8',
                letterSpacing: '-0.03em',
                marginBottom: '1rem',
              }}
            >
              {featured.title}
            </h1>
            {featured.excerpt && (
              <p style={{ color: '#888888', lineHeight: 1.7, marginBottom: '1.25rem', maxWidth: '560px' }}>
                {featured.excerpt}
              </p>
            )}
            {featured.tags && featured.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                {featured.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.6rem',
                      border: '1px solid rgba(232,232,232,0.2)',
                      color: '#E8E8E8',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#888888' }}>
                {featured.author_name} · {formatDate(featured.published_at)} · {featured.read_time}m read
              </span>
              <a
                href={`/blog/${featured.slug}`}
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: '#0D0D0D',
                  backgroundColor: '#63E6A0',
                  padding: '0.5rem 1.25rem',
                  textDecoration: 'none',
                }}
              >
                Read
              </a>
            </div>
          </div>
        </section>
      )}

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem' }}>
        {/* Grid — latest 3 (excluding featured) */}
        {grid.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
              marginBottom: '4rem',
            }}
          >
            {grid.map((post) => (
              <a
                key={post.id}
                href={`/blog/${post.slug}`}
                style={{
                  display: 'block',
                  backgroundColor: '#141414',
                  border: '1px solid #1F1F1F',
                  textDecoration: 'none',
                  overflow: 'hidden',
                }}
              >
                {post.featured_image_url && (
                  <div style={{ position: 'relative', height: '160px' }}>
                    <Image
                      src={post.featured_image_url}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ padding: '1.25rem' }}>
                  {post.categories && post.categories.length > 0 && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.65rem',
                        color: '#63E6A0',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '0.5rem',
                      }}
                    >
                      {post.categories[0]}
                    </span>
                  )}
                  <h3
                    style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      color: '#E8E8E8',
                      marginBottom: '0.5rem',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {post.title}
                  </h3>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#888888' }}>
                    {formatDate(post.published_at)}
                  </span>
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.75rem' }}>
                      {post.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.65rem',
                            padding: '0.15rem 0.5rem',
                            border: '1px solid #1F1F1F',
                            color: '#888888',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Paginated list */}
        {list.length > 0 && (
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                fontWeight: 700,
                color: '#888888',
                marginBottom: '1.5rem',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontSize: '0.8rem',
              }}
            >
              All articles
            </h2>
            {list.map((post, i) => (
              <div key={post.id}>
                {i > 0 && (
                  <hr style={{ border: 'none', borderTop: '1px solid #1F1F1F', margin: '1rem 0' }} />
                )}
                <a
                  href={`/blog/${post.slug}`}
                  className="blog-list-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr auto',
                    gap: '1.5rem',
                    alignItems: 'center',
                    textDecoration: 'none',
                    padding: '0.5rem 0',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#888888' }}>
                    {formatDate(post.published_at)}
                  </span>
                  <span style={{ color: '#E8E8E8', fontSize: '1rem' }}>{post.title}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#888888' }}>
                    {post.read_time}m →
                  </span>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {all.total > all.limit && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3rem' }}>
            {page > 1 && (
              <a
                href={`/blog?page=${page - 1}`}
                style={{ color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              >
                ← Newer
              </a>
            )}
            {page * all.limit < all.total && (
              <a
                href={`/blog?page=${page + 1}`}
                style={{ color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
              >
                Older →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
