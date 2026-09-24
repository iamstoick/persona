import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Nav } from '@/components/Nav';
import { AmbientBackground } from '@/components/AmbientBackground';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://geraldvillorente.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Gerald Villorente — Drupal Developer & DevOps Engineer in the Philippines',
    template: '%s | Gerald Villorente',
  },
  description:
    'Filipino software engineer for hire: Drupal developer, DevOps engineer, and AI engineer based in the Philippines. Consulting, staff augmentation, courses, and writing.',
  keywords: [
    'Gerald Villorente',
    'Drupal Developer Philippines',
    'Filipino Drupal developer',
    'Web Developer Philippines',
    'Software Engineer Philippines',
    'Filipino DevOps engineer',
    'DevOps Engineer Philippines',
    'Pinoy AI engineer',
    'Filipino AI engineer',
    'AI Engineer Philippines',
    'Filipino AI expert',
    'Pinoy AI expert',
    'Filipino vibe coder',
    'Technical Support Engineer Philippines',
    'Technical Support Expert',
    'Filipino Technical Support Expert',
    'Platform Engineering',
    'Kubernetes',
  ],
  authors: [{ name: 'Gerald Villorente', url: siteUrl }],
  creator: 'Gerald Villorente',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    siteName: 'Gerald Villorente',
    title: 'Gerald Villorente — Drupal Developer & DevOps Engineer in the Philippines',
    description:
      'Filipino software engineer for hire: Drupal development, DevOps and platform engineering, and AI engineering. Based in the Philippines, working worldwide.',
    url: siteUrl,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gerald Villorente — Drupal Developer & DevOps Engineer in the Philippines',
    description:
      'Filipino software engineer for hire: Drupal development, DevOps and platform engineering, and AI engineering.',
  },
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Gerald Villorente',
  url: siteUrl,
  jobTitle: ['Senior Software Engineer', 'Drupal Developer', 'DevOps Engineer', 'AI Engineer'],
  nationality: 'Filipino',
  homeLocation: { '@type': 'Country', name: 'Philippines' },
  worksFor: { '@type': 'Organization', name: 'Independent / Consulting' },
  knowsAbout: [
    'Drupal',
    'Drupal 10',
    'Drupal 11',
    'PHP',
    'DevOps',
    'Kubernetes',
    'Platform Engineering',
    'Terraform',
    'AI Engineering',
    'AI Development',
    'LLM applications',
    'Technical Support',
    'Technical Support Leadership',
  ],
  sameAs: [
    'https://github.com/iamstoick',
    'https://linkedin.com/in/geraldvillorente',
    'https://twitter.com/geraldvillorente',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <AmbientBackground />
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}
