import { ImageResponse } from 'next/og';
import { apiFetch, CourseDetail } from '@/lib/api';
import { OgCard } from '@/lib/ogCard';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Course share card';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let title = 'Course';
  let description: string | null = null;
  try {
    const course = await apiFetch<CourseDetail>(`/api/courses/${slug}`, { cache: 'no-store' });
    title = course.title;
    description = course.description;
  } catch {
    // Fall through to the generic card — a broken API must not break the image route.
  }
  return new ImageResponse(
    <OgCard kicker="Course" title={title} description={description} />,
    { ...size }
  );
}
