import { ImageResponse } from 'next/og';
import { OgCard } from '@/lib/ogCard';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Gerald Villorente — writing, courses, projects, and services';

// Default share card for every route without a closer opengraph-image file.
export default async function Image() {
  return new ImageResponse(
    (
      <OgCard
        kicker="geraldvillorente.com"
        title="Gerald Villorente"
        description="Senior software engineer — Drupal platform engineering and DevOps. Writing, courses, projects, and services."
      />
    ),
    { ...size }
  );
}
