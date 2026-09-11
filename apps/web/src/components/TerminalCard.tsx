'use client';

import { useState } from 'react';
import type { Project } from '@/lib/api';

export function GithubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
    </svg>
  );
}

export function TerminalCard({ project }: { project: Project }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#141414',
        border: `1px solid ${hovered ? '#63E6A033' : '#1F1F1F'}`,
        fontFamily: 'var(--font-mono)',
        transition: 'border-color 0.2s',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 1rem',
          borderBottom: '1px solid #1F1F1F',
          backgroundColor: '#0D0D0D',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['#FF4444', '#FFB800', '#00C48C'].map((c) => (
            <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c }} />
          ))}
        </div>
        {project.github_url && (
          <a
            href={project.github_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${project.title} on GitHub`}
            style={{ color: '#888888', display: 'flex' }}
          >
            <GithubIcon />
          </a>
        )}
      </div>

      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p style={{ color: '#888888', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
          <span style={{ color: '#63E6A0' }}>~/projects</span> $
        </p>
        <p style={{ color: '#E8E8E8', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
          {project.title}
          {hovered && (
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '1.1em',
                backgroundColor: '#63E6A0',
                marginLeft: '4px',
                verticalAlign: 'text-bottom',
              }}
            />
          )}
        </p>

        {project.excerpt && (
          <p style={{ color: '#888888', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            {project.excerpt}
          </p>
        )}

        {project.tags && project.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 'auto' }}>
            {project.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.6rem',
                  border: '1px solid #1F1F1F',
                  color: '#888888',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
