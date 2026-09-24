import type { Metadata } from 'next';
import { apiFetch, SlideDeck } from '@/lib/api';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://geraldvillorente.com';

// Deck detail is login-gated, but the deck list endpoint is public — so the layout
// resolves this slug's title/description from the list for share tags. Recipients
// still have to sign in to view the deck itself.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const decks = await apiFetch<SlideDeck[]>('/api/slides', { cache: 'no-store' });
    const deck = decks.find((d) => d.slug === slug);
    if (!deck) return {};
    const description = deck.description || 'A slide deck by Gerald Villorente. Sign in to view.';
    return {
      title: deck.title,
      description,
      alternates: { canonical: `/slides/${slug}` },
      openGraph: {
        title: deck.title,
        description,
        type: 'website',
        url: `${siteUrl}/slides/${slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: deck.title,
        description,
      },
    };
  } catch {
    return {};
  }
}

export default function SlideSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
