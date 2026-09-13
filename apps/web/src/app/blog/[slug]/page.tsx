import { notFound } from 'next/navigation';
import NextImage from 'next/image';
import { apiFetch, Post } from '@/lib/api';
import { ReadingProgress } from '@/components/ReadingProgress';
import { GiscusEmbed } from '@/components/GiscusEmbed';
import { ShareButtons } from '@/components/ShareButtons';
import { renderTiptapContent } from '@/lib/renderTiptap';

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://geraldvillorente.com';

// Without this, Next.js renders a dynamic-segment page once (no generateStaticParams
// here) and then caches that HTML indefinitely — an admin edit to the post's content
// in the DB would never show up on this page again without a full redeploy. Same class
// of bug already fixed on the homepage and /contact.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const post = await apiFetch<Post>(`/api/posts/${slug}`);
    const title = post.meta_title || post.title;
    const description = post.meta_description || post.excerpt || '';
    return {
      title,
      description,
      alternates: { canonical: `/blog/${slug}` },
      openGraph: {
        title,
        description,
        type: 'article',
        url: `${siteUrl}/blog/${slug}`,
        images: post.featured_image_url ? [post.featured_image_url] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  } catch {
    return {};
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let post: Post;
  try {
    post = await apiFetch<Post>(`/api/posts/${slug}`);
  } catch {
    notFound();
  }

  const html = renderTiptapContent(post.content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.featured_image_url || undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at,
    author: { '@type': 'Person', name: post.author_name || 'Gerald Villorente' },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
  };

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadingProgress />

      <article style={{ maxWidth: '740px', margin: '0 auto', padding: '4rem 2rem' }}>
        {post.categories && post.categories.length > 0 && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: '#63E6A0',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '1rem',
            }}
          >
            {post.categories.join(' · ')}
          </span>
        )}

        <h1
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            color: '#E8E8E8',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            marginBottom: '1.5rem',
          }}
        >
          {post.title}
        </h1>

        {post.tags && post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {post.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.65rem',
                  border: '1px solid #1F1F1F',
                  color: '#888888',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            marginBottom: '3rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid #1F1F1F',
          }}
        >
          {post.author_name && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#888888' }}>
              {post.author_name}
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#888888' }}>
            {formatDate(post.published_at)}
          </span>
          {post.read_time && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#888888' }}>
              {post.read_time} min read
            </span>
          )}
          <span style={{ marginLeft: 'auto' }}>
            <ShareButtons url={`${siteUrl}/blog/${post.slug}`} title={post.title} />
          </span>
        </div>

        {post.featured_image_url && (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', marginBottom: '3rem' }}>
            <NextImage
              src={post.featured_image_url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 740px"
              priority
              style={{ objectFit: 'cover' }}
            />
          </div>
        )}

        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            color: '#E8E8E8',
            lineHeight: 1.8,
            fontSize: '1.05rem',
          }}
        />

        <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid #1F1F1F' }}>
          <h2
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#E8E8E8',
              marginBottom: '1.5rem',
            }}
          >
            Comments
          </h2>
          <GiscusEmbed term={post.slug} />
        </div>
      </article>
    </div>
  );
}
