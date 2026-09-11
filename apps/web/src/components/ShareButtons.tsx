'use client';

import { useState } from 'react';

interface Props {
  url: string;
  title: string;
}

const iconStyle = {
  width: '34px',
  height: '34px',
  borderRadius: '50%',
  border: '1px solid #1F1F1F',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#888888',
  textDecoration: 'none',
  transition: 'color 0.2s, border-color 0.2s',
} as const;

export function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.9 2H22l-7.6 8.7L23.3 22h-7.1l-5.6-6.9L4 22H1l8.1-9.3L1 2h7.3l5 6.3zm-1.2 18h1.7L7.4 4h-1.8z" />
        </svg>
      ),
    },
    {
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zm7 0h3.8v1.7h.05c.53-1 1.83-2 3.76-2 4 0 4.75 2.6 4.75 6v6.3H18.5v-5.6c0-1.35-.02-3.1-1.9-3.1-1.9 0-2.2 1.5-2.2 3v5.7H10z" />
        </svg>
      ),
    },
    {
      label: 'Share via email',
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 5h16v14H4z" />
          <path d="M4 6l8 7 8-7" />
        </svg>
      ),
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — no-op
    }
  }

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          title={l.label}
          aria-label={l.label}
          style={iconStyle}
        >
          {l.icon}
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        title="Copy link"
        aria-label="Copy link"
        style={{ ...iconStyle, backgroundColor: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
      >
        {copied ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00C48C" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11.5 4.5" />
            <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07L12.5 19.5" />
          </svg>
        )}
      </button>
    </div>
  );
}
