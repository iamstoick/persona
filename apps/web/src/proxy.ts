import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// The homepage, /contact, and /blog/[slug] are rendered with `dynamic = 'force-dynamic'`
// so every request reads fresh from the DB (an earlier bug: static/ISR caching baked in a
// build-time snapshot with no DB access, showing empty/stale content until the next full
// rebuild). force-dynamic's side effect is a `Cache-Control: no-store` response header,
// which also stops Cloudflare from caching the response at all — every visitor's request
// hits the origin.
//
// Since the API already fires a scoped Cloudflare purge on post/course create-edit-delete
// (see apps/api/src/cache/cloudflare.js), it's safe to let the edge cache these pages for
// a while: content only actually changes on an explicit admin save, which purges instantly
// anyway. This overwrites the page's own no-store header with a real, cacheable one.
const CACHEABLE_PATHS = [/^\/$/, /^\/contact$/, /^\/blog\/[^/]+$/];

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
  matcher: ['/', '/contact', '/blog/:slug*'],
};
