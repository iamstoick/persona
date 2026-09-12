'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface Props {
  badge?: string;
  tagline?: string;
}

const DEFAULT_BADGE = 'Senior Engineer · Drupal · DevOps';
const DEFAULT_TAGLINE = 'Support infrastructure. Ship things that scale.';

export function Hero({ badge = DEFAULT_BADGE, tagline = DEFAULT_TAGLINE }: Props) {
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let gsap: typeof import('gsap').gsap | null = null;

    async function animate() {
      const mod = await import('gsap');
      gsap = mod.gsap;

      if (!headingRef.current) return;
      const lines = headingRef.current.querySelectorAll('[data-line]');
      gsap.fromTo(
        lines,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
      );
    }

    animate();
  }, []);

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        padding: '80px 2rem 0',
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        <div ref={headingRef} style={{ textAlign: 'left', maxWidth: '620px' }}>
          <p
            data-line
            style={{
              fontFamily: 'var(--font-jetbrains)',
              fontSize: '0.875rem',
              color: '#63E6A0',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
              opacity: 0,
            }}
          >
            {badge}
          </p>

          <h1
            data-line
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.04em',
              color: '#E8E8E8',
              marginBottom: '1.5rem',
              opacity: 0,
            }}
          >
            Gerald<br />
            <span style={{ color: '#63E6A0' }}>Villorente</span>
          </h1>

          <p
            data-line
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              color: '#888888',
              maxWidth: '620px',
              margin: '0 0 2.5rem',
              lineHeight: 1.6,
              opacity: 0,
            }}
          >
            {tagline}
          </p>

          <div data-line style={{ display: 'flex', gap: '1rem', opacity: 0 }}>
            <a
              href="#projects"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.75rem',
                backgroundColor: '#63E6A0',
                color: '#0D0D0D',
                fontFamily: 'var(--font-space-grotesk)',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none',
                letterSpacing: '0.02em',
              }}
            >
              View projects →
            </a>
            <a
              href="#contact"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.75rem',
                border: '1px solid #1F1F1F',
                color: '#888888',
                fontFamily: 'var(--font-space-grotesk)',
                fontWeight: 600,
                fontSize: '0.9rem',
                textDecoration: 'none',
              }}
            >
              Get in touch
            </a>
          </div>
        </div>
      </div>

      <div className="hero-portrait" style={{ position: 'absolute', right: 0, bottom: 0, width: '320px', height: '85%', zIndex: 1 }}>
        <Image
          src="/images/hero-portrait.png"
          alt="Gerald Villorente"
          fill
          priority
          sizes="320px"
          style={{ objectFit: 'contain', objectPosition: 'right bottom' }}
        />
      </div>

      {/* A glowing edge accent roughly where the raised shoe meets the screen edge — closes the
          visual gap between the cutout and the viewport border. Sits outside .hero-portrait so
          its blur isn't clipped by the image wrapper, with a wide, gradual fade on both ends. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '4px',
          height: '100%',
          zIndex: 1,
          background:
            'linear-gradient(to top, transparent 0%, rgba(99,230,160,0.85) 18%, rgba(99,230,160,0.85) 26%, transparent 60%)',
          boxShadow: '0 0 24px 6px rgba(99,230,160,0.45)',
        }}
      />
    </section>
  );
}
