'use client';

import { useEffect, useState } from 'react';

interface Props {
  // Optional scroll container to track instead of the window. The admin draft
  // preview scrolls inside its own overlay; omitting this keeps the default
  // window behavior used by public pages.
  scrollRef?: React.RefObject<HTMLElement | null>;
}

export function ReadingProgress({ scrollRef }: Props) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const container = scrollRef?.current;
    function update() {
      const el = container || document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setWidth(total > 0 ? (scrolled / total) * 100 : 0);
    }
    const target = container || window;
    target.addEventListener('scroll', update, { passive: true });
    update();
    return () => target.removeEventListener('scroll', update);
  }, [scrollRef]);

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
