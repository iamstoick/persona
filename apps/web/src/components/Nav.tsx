'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { anchor: 'skills', label: 'Skills' },
  { anchor: 'projects', label: 'Projects' },
  { anchor: 'writing', label: 'Writing' },
  { anchor: 'services', label: 'Services' },
  { anchor: 'courses', label: 'Courses' },
];

const linkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  color: '#888888',
  textDecoration: 'none',
  transition: 'color 0.2s',
};

const ctaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  padding: '0.5rem 1rem',
  border: '1px solid #63E6A0',
  color: '#63E6A0',
  textDecoration: 'none',
};

export function Nav() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  // On the homepage, a plain native anchor (#skills) is the only reliable way to jump
  // sections — next/link's hash handling could combine with an existing hash mid-click
  // (e.g. producing /#writing#services) when navigating hash-to-hash on the same route.
  // Off the homepage, we still need next/link's "/#skills" form to navigate home first.
  const isHome = pathname === '/';

  const logoStyle: React.CSSProperties = {
    fontFamily: 'var(--font-space-grotesk)',
    fontWeight: 700,
    fontSize: '1.1rem',
    color: '#E8E8E8',
    textDecoration: 'none',
    letterSpacing: '-0.02em',
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  };
  const logoContent = (
    <>
      gerald<span style={{ color: '#63E6A0' }}>.</span>villorente
    </>
  );

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        borderBottom: '1px solid #1F1F1F',
        backgroundColor: 'rgba(13,13,13,0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {isHome ? (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={logoStyle}
        >
          {logoContent}
        </button>
      ) : (
        <Link href="/" style={logoStyle}>
          {logoContent}
        </Link>
      )}

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        {links.map(({ anchor, label }) =>
          isHome ? (
            <a key={anchor} href={`#${anchor}`} style={linkStyle}>
              {label}
            </a>
          ) : (
            <Link key={anchor} href={`/#${anchor}`} style={linkStyle}>
              {label}
            </Link>
          )
        )}
        {isHome ? (
          <a href="#contact" style={ctaStyle}>
            say hi
          </a>
        ) : (
          <Link href="/#contact" style={ctaStyle}>
            say hi
          </Link>
        )}
      </div>
    </nav>
  );
}
