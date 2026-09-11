'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

// Captures ?token=&refresh= left in the URL by the OAuth callback (apps/api/routes/auth.js),
// stores them, then strips them from the URL. Reusable by any page that can be a login
// redirect target (admin, course pages), not just /admin.
export function useCaptureAuthTokens() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const refresh = searchParams.get('refresh');
    if (token && refresh) {
      setTokens(token, refresh);
      router.replace(pathname);
    }
  }, [searchParams, router, pathname]);
}

export function getTokens() {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem('gv_access'),
    refreshToken: localStorage.getItem('gv_refresh'),
  };
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('gv_access', accessToken);
  localStorage.setItem('gv_refresh', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('gv_access');
  localStorage.removeItem('gv_refresh');
}

export async function authFetch(path: string, options: RequestInit = {}) {
  const { accessToken } = getTokens();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    const { refreshToken } = getTokens();
    if (refreshToken) {
      const refresh = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refresh.ok) {
        const data = await refresh.json();
        setTokens(data.accessToken, data.refreshToken);
        return authFetch(path, options);
      }
    }
    clearTokens();
    window.location.href = '/admin/login';
    throw new Error('Unauthenticated');
  }

  return res;
}
