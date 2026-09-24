import type { MetadataRoute } from 'next';
import { apiFetch, PostsResponse, Course, SlideDeck } from '@/lib/api';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://geraldvillorente.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/services`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/courses`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/slides`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/projects`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/contact`, changeFrequency: 'yearly', priority: 0.4 },
  ];

  const [postRoutes, courseRoutes, slideRoutes] = await Promise.all([
    apiFetch<PostsResponse>('/api/posts?type=post&status=published&limit=100')
      .then((posts): MetadataRoute.Sitemap =>
        posts.data.map((post) => ({
          url: `${siteUrl}/blog/${post.slug}`,
          lastModified: post.updated_at,
          changeFrequency: 'monthly',
          priority: 0.7,
        }))
      )
      .catch(() => [] as MetadataRoute.Sitemap),
    apiFetch<Course[]>('/api/courses')
      .then((courses): MetadataRoute.Sitemap =>
        courses.map((course) => ({
          url: `${siteUrl}/courses/${course.slug}`,
          changeFrequency: 'monthly',
          priority: 0.7,
        }))
      )
      .catch(() => [] as MetadataRoute.Sitemap),
    apiFetch<SlideDeck[]>('/api/slides')
      .then((decks): MetadataRoute.Sitemap =>
        decks.map((deck) => ({
          url: `${siteUrl}/slides/${deck.slug}`,
          changeFrequency: 'monthly',
          priority: 0.7,
        }))
      )
      .catch(() => [] as MetadataRoute.Sitemap),
  ]);

  return [...staticRoutes, ...postRoutes, ...courseRoutes, ...slideRoutes];
}
