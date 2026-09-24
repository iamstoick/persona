import type { Metadata } from 'next';

// Client page below, so its tags live here. Without this the page inherits the
// root canonical ('/'), telling Google this URL is a duplicate of the homepage.
export const metadata: Metadata = {
  title: 'Projects',
  description:
    'Selected projects by Gerald Villorente, Filipino software engineer: Drupal platforms, DevOps tooling, and AI engineering work.',
  alternates: { canonical: '/projects' },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
