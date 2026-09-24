import type { Metadata } from 'next';
import { apiFetch, CourseDetail } from '@/lib/api';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://geraldvillorente.com';

// The course page itself is a client component (progress tracking), which cannot
// export generateMetadata — so the per-course share tags live in this layout. The
// detail endpoint is optionalAuth, so an anonymous server fetch gets title/description.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const course = await apiFetch<CourseDetail>(`/api/courses/${slug}`, { cache: 'no-store' });
    const description = course.description || `A course by Gerald Villorente.`;
    return {
      title: course.title,
      description,
      alternates: { canonical: `/courses/${slug}` },
      openGraph: {
        title: course.title,
        description,
        type: 'website',
        url: `${siteUrl}/courses/${slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: course.title,
        description,
      },
    };
  } catch {
    return {};
  }
}

export default function CourseSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
