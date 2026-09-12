'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth/client';

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/settings', label: 'Site Settings' },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/services', label: 'Services' },
  { href: '/admin/courses', label: 'Courses' },
  { href: '/admin/posts', label: 'Posts' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/menus', label: 'Menus' },
  { href: '/admin/users', label: 'Users' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      const loginUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/google?redirect=${encodeURIComponent(pathname)}`;
      window.location.href = loginUrl;
      return;
    }

    setReady(true);
  }, [pathname]);

  function logout() {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
      .catch(() => {})
      .finally(() => {
        window.location.href = '/';
      });
  }

  if (!ready) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#888888', fontFamily: 'var(--font-mono)' }}>
      Authenticating…
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '0' }}>
      <aside
        style={{
          width: '220px',
          flexShrink: 0,
          backgroundColor: '#141414',
          borderRight: '1px solid #1F1F1F',
          padding: '2rem 0',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '0 1.5rem 2rem', borderBottom: '1px solid #1F1F1F', marginBottom: '1rem' }}>
          <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: '#E8E8E8', fontSize: '1rem' }}>
            gv<span style={{ color: '#63E6A0' }}>.</span>admin
          </span>
        </div>
        <nav style={{ flex: 1 }}>
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              style={{
                display: 'block',
                padding: '0.6rem 1.5rem',
                color: pathname === href ? '#63E6A0' : '#888888',
                textDecoration: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                backgroundColor: pathname === href ? '#63E6A011' : 'transparent',
                borderLeft: pathname === href ? '2px solid #63E6A0' : '2px solid transparent',
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #1F1F1F' }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: '1px solid #1F1F1F',
              color: '#888888',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, marginLeft: '220px', padding: '2rem' }}>
        {children}
      </div>
    </div>
  );
}
