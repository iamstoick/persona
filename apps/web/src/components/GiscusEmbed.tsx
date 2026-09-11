'use client';

import { useEffect, useRef } from 'react';

interface Props {
  term: string;
}

export function GiscusEmbed({ term }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!process.env.NEXT_PUBLIC_GISCUS_REPO) return;

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', process.env.NEXT_PUBLIC_GISCUS_REPO);
    script.setAttribute('data-repo-id', process.env.NEXT_PUBLIC_GISCUS_REPO_ID || '');
    script.setAttribute('data-category', process.env.NEXT_PUBLIC_GISCUS_CATEGORY || 'General');
    script.setAttribute('data-category-id', process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || '');
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', term);
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'dark');
    script.setAttribute('data-lang', 'en');
    script.crossOrigin = 'anonymous';
    script.async = true;

    ref.current.appendChild(script);
    return () => { if (ref.current) ref.current.innerHTML = ''; };
  }, [term]);

  if (!process.env.NEXT_PUBLIC_GISCUS_REPO) {
    return (
      <p style={{ color: '#888888', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
        Comments disabled — configure NEXT_PUBLIC_GISCUS_* env vars.
      </p>
    );
  }

  return <div ref={ref} />;
}
