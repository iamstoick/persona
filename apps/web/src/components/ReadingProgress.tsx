'use client';

import { useEffect, useState } from 'react';

export function ReadingProgress() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    function update() {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setWidth(total > 0 ? (scrolled / total) * 100 : 0);
    }
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: '#1F1F1F',
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          backgroundColor: '#63E6A0',
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  );
}
