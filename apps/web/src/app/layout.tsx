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
  title: { default: 'Gerald Villorente', template: '%s | Gerald Villorente' },
  description:
    'Senior software engineer specializing in Drupal platform engineering and DevOps. Writing, projects, and services.',
  keywords: ['Gerald Villorente', 'Drupal', 'DevOps', 'Platform Engineering', 'Software Engineer'],
  authors: [{ name: 'Gerald Villorente', url: siteUrl }],
  creator: 'Gerald Villorente',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    siteName: 'Gerald Villorente',
    title: 'Gerald Villorente',
    description:
      'Senior software engineer specializing in Drupal platform engineering and DevOps.',
    url: siteUrl,
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gerald Villorente',
    description:
      'Senior software engineer specializing in Drupal platform engineering and DevOps.',
  },
};

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Gerald Villorente',
  url: siteUrl,
  jobTitle: 'Senior Software Engineer',
  worksFor: { '@type': 'Organization', name: 'Independent / Consulting' },
  knowsAbout: ['Drupal', 'DevOps', 'Kubernetes', 'Platform Engineering', 'Terraform'],
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
