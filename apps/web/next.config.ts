import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const csp = [
  "default-src 'self'",
  `script-src 'self'${isProd ? '' : " 'unsafe-eval'"} 'unsafe-inline'`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: https:${isProd ? '' : ' http://localhost:4000'}`,
  `connect-src 'self'${isProd ? '' : ' http://localhost:4000'}`,
  "frame-src https://giscus.app",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  isProd ? 'upgrade-insecure-requests' : '',
]
  .filter(Boolean)
  .join('; ');

// X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy are
// already set by the production nginx vhost (/etc/nginx/sites-available/geraldvillorente.com)
// in front of this app — kept only here for local dev (no nginx in front) plus CSP/HSTS,
// which nginx does not set.
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  ...(isProd
    ? []
    : [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ]),
];

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        // Legacy post URL (pre-/blog prefix) — keep old links and bookmarks working.
        source: '/understanding-pointers-go-practical-guide',
        destination: '/blog/understanding-pointers-go-practical-guide',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    // This proxy runs in the Next.js server process, so it needs the API's address as seen
    // from that server (API_INTERNAL_URL inside Docker), not the browser-facing public URL.
    const apiOrigin =
      process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        // In production nginx proxies /uploads straight to the API before it ever reaches
        // this app (see docker/nginx/default.conf), so this rewrite is only exercised in
        // local dev, where there's no nginx in front. Keeping it here means relative
        // `/uploads/...` image paths (used for re-hosted blog images) resolve the same way
        // in both environments, on whatever domain the site is actually served from.
        source: '/uploads/:path*',
        destination: `${apiOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
