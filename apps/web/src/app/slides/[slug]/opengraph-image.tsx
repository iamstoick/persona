import { ImageResponse } from 'next/og';
import { apiFetch, SlideDeck } from '@/lib/api';
import { OgCard } from '@/lib/ogCard';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Slide deck share card';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let title = 'Slides';
  let description: string | null = null;
  try {
    const decks = await apiFetch<SlideDeck[]>('/api/slides', { cache: 'no-store' });
    const deck = decks.find((d) => d.slug === slug);
    if (deck) {
      title = deck.title;
      description = deck.description;
    }
  } catch {
    // Fall through to the generic card — a broken API must not break the image route.
  }
  return new ImageResponse(
    <OgCard kicker="Slides" title={title} description={description} />,
    { ...size }
  );
}
