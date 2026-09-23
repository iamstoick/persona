'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { anchor: 'skills', label: 'Skills' },
  { anchor: 'projects', label: 'Projects' },
  { anchor: 'writing', label: 'Writing' },
  { anchor: 'services', label: 'Services' },
  { anchor: 'courses', label: 'Courses' },
  { anchor: 'slides', label: 'Slides' },
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
  const [menuOpen, setMenuOpen] = useState(false);
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

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav
      className="site-nav"
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
          onClick={() => {
            closeMenu();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          style={logoStyle}
        >
          {logoContent}
        </button>
      ) : (
        <Link href="/" style={logoStyle} onClick={closeMenu}>
          {logoContent}
        </Link>
      )}

      <div className="site-nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
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

      <button
        type="button"
        className="site-nav-toggle"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
        style={{
          display: 'none',
          background: 'none',
          border: '1px solid #333333',
          borderRadius: '4px',
          width: '2.25rem',
          height: '2.25rem',
          padding: 0,
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '0.5rem',
            right: '0.5rem',
            top: '0.75rem',
            height: '2px',
            background: '#E8E8E8',
            transform: menuOpen ? 'translateY(6px) rotate(45deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '0.5rem',
            right: '0.5rem',
            top: '1.1875rem',
            height: '2px',
            background: '#E8E8E8',
            opacity: menuOpen ? 0 : 1,
            transition: 'opacity 0.2s',
          }}
        />
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '0.5rem',
            right: '0.5rem',
            top: '1.625rem',
            height: '2px',
            background: '#E8E8E8',
            transform: menuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        />
      </button>

      {menuOpen && (
        <div
          className="site-nav-mobile-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            padding: '1.5rem 2rem 2rem',
            backgroundColor: '#0D0D0D',
            borderBottom: '1px solid #1F1F1F',
          }}
        >
          {links.map(({ anchor, label }) =>
            isHome ? (
              <a key={anchor} href={`#${anchor}`} style={linkStyle} onClick={closeMenu}>
                {label}
              </a>
            ) : (
              <Link key={anchor} href={`/#${anchor}`} style={linkStyle} onClick={closeMenu}>
                {label}
              </Link>
            )
          )}
          {isHome ? (
            <a href="#contact" style={{ ...ctaStyle, textAlign: 'center' }} onClick={closeMenu}>
              say hi
            </a>
          ) : (
            <Link href="/#contact" style={{ ...ctaStyle, textAlign: 'center' }} onClick={closeMenu}>
              say hi
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
