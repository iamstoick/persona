import { ImageResponse } from 'next/og';
import { apiFetch, Post } from '@/lib/api';
import { OgCard } from '@/lib/ogCard';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Blog post share card';

// Fallback card for posts without a featured image — posts WITH one set explicit
// openGraph.images in generateMetadata, which take precedence over this file.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let kicker = 'Blog';
  let title = 'Blog';
  let description: string | null = null;
  try {
    const post = await apiFetch<Post>(`/api/posts/${slug}`, { cache: 'no-store' });
    title = post.meta_title || post.title;
    kicker = post.categories?.[0] ? `Blog · ${post.categories[0]}` : 'Blog';
    description = post.meta_description || post.excerpt;
  } catch {
    // Fall through to the generic card — a broken API must not break the image route.
  }
  return new ImageResponse(
    <OgCard kicker={kicker} title={title} description={description} />,
    { ...size }
  );
}
