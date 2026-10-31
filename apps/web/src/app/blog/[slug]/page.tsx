import { notFound } from 'next/navigation';
import { apiFetch, Post } from '@/lib/api';
import { ReadingProgress } from '@/components/ReadingProgress';
import { BlogPostView, RelatedPost } from '@/components/BlogPostView';

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
        publishedTime: post.published_at || undefined,
        authors: [post.author_name || 'Gerald Villorente'],
        url: `${siteUrl}/blog/${slug}`,
        // Only set when a photo exists — otherwise the file-based card
        // (opengraph-image.tsx) applies. An explicit `images: undefined` key risks
        // suppressing it.
        ...(post.featured_image_url ? { images: [post.featured_image_url] } : {}),
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

  let related: RelatedPost[] = [];
  try {
    related = await apiFetch<RelatedPost[]>(`/api/posts/${slug}/related`);
  } catch {
    related = [];
  }

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
    <>
      <script
        type="application/ld+json"
        // Escape `<` so a `</script>` inside any DB-sourced field (title, excerpt,
        // author, slug…) can't break out of this block into stored XSS.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <ReadingProgress />
      <BlogPostView post={post} related={related} siteUrl={siteUrl} />
    </>
  );
}
