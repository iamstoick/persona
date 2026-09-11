'use client';

import { useEffect, useRef } from 'react';

interface Props {
  text: string;
}

export function TerminalHeading({ text }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;

    async function typewrite() {
      if (!el) return;
      el.textContent = '';
      for (let i = 0; i < text.length; i++) {
        if (cancelled) return;
        el.textContent = text.slice(0, i + 1);
        await new Promise((r) => setTimeout(r, 45));
      }
    }

    if (typeof IntersectionObserver === 'undefined') {
      typewrite();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          typewrite();
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [text]);

  return (
    <h2
      ref={ref}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)',
        fontWeight: 700,
        color: '#63E6A0',
        marginBottom: '2.5rem',
        letterSpacing: '-0.02em',
        scrollMarginTop: '80px',
        minHeight: '1.2em',
      }}
    >
      {text}
    </h2>
  );
}
