import type { Metadata } from 'next';

// Client page below, so its tags live here. Without this the page inherits the
// root canonical ('/'), telling Google this URL is a duplicate of the homepage.
export const metadata: Metadata = {
  title: 'Slides',
  description:
    'Slide decks by Gerald Villorente, Filipino software engineer: AI engineering, Drupal, DevOps, and software career talks.',
  alternates: { canonical: '/slides' },
};

export default function SlidesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
