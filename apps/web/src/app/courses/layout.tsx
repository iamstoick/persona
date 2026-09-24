import type { Metadata } from 'next';

// Client page below, so its tags live here. Without this the page inherits the
// root canonical ('/'), telling Google this URL is a duplicate of the homepage.
export const metadata: Metadata = {
  title: 'Courses',
  description:
    'Practical courses by Gerald Villorente, Filipino software engineer: AI engineering from zero to hero and more. Learn at your own pace.',
  alternates: { canonical: '/courses' },
};

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
