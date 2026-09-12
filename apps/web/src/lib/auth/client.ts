// Auth tokens live in httpOnly cookies set by the API (apps/api/routes/auth.js) — never
// readable by JS, so an XSS bug can no longer steal them straight out of localStorage.
// The only cookie JS can see is `gv_logged_in`, a non-secret flag mirroring the access
// token's lifetime, used purely to decide whether to show the login redirect or the app.

export function isLoggedIn(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c === 'gv_logged_in=1');
}

export async function authFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 && isLoggedIn()) {
    const refresh = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (refresh.ok) {
      return fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
    }
  }

  if (res.status === 401) {
    window.location.href = '/admin/login';
    throw new Error('Unauthenticated');
  }

  return res;
}
