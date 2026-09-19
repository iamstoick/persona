import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The homepage, /contact, /blog/[slug], and the course pages all end up server-rendered
// per request with a `Cache-Control: no-store` side effect — the first three because
// they're explicitly `dynamic = 'force-dynamic'` (an earlier bug: static/ISR caching baked
// in a build-time snapshot with no DB access, showing empty/stale content until the next
// full rebuild), and the course pages because Next treats a dynamic-segment route with no
// generateStaticParams as server-rendered per request by default. Either way, Cloudflare
// can't cache any of them — every visitor's request hits the origin.
//
// The course pages themselves are just a generic HTML shell — all per-user data (auth
// state, lesson completion) loads afterward via a separate client-side fetch that carries
// the auth cookie, so caching the shell doesn't leak anything between visitors.
//
// Since the API already fires a scoped Cloudflare purge on post/course create-edit-delete
// (see apps/api/src/cache/cloudflare.js), it's safe to let the edge cache these pages for
// a while: content only actually changes on an explicit admin save, which purges instantly
// anyway. This overwrites the page's own no-store header with a real, cacheable one.
const CACHEABLE_PATHS = [
  /^\/$/,
  /^\/contact$/,
  /^\/blog\/[^/]+$/,
  /^\/courses\/[^/]+$/,
  /^\/courses\/[^/]+\/lessons\/[^/]+$/,
];

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  if (CACHEABLE_PATHS.some((pattern) => pattern.test(request.nextUrl.pathname))) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=604800'
    );
  }

  return response;
}

export const config = {
  matcher: ['/', '/contact', '/blog/:slug*', '/courses/:path*'],
};
