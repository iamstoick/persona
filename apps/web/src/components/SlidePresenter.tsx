'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { renderTiptapContent } from '@/lib/renderTiptap';
import type { Slide } from '@/lib/api';

interface Props {
  deckTitle: string;
  slides: Slide[];
}

const btnStyle: React.CSSProperties = {
  padding: '0.6rem 1rem',
  backgroundColor: 'transparent',
  border: '1px solid #1F1F1F',
  color: '#E8E8E8',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
};

const btnDisabled: React.CSSProperties = {
  ...btnStyle,
  color: '#444444',
  borderColor: '#1F1F1F',
  cursor: 'not-allowed',
};

// Confluence-style present mode: one slide fills the stage, minimal chrome,
// keyboard-first navigation, and a real fullscreen toggle for presenting.
export function SlidePresenter({ deckTitle, slides }: Props) {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const total = slides.length;
  const slide = slides[Math.min(index, Math.max(total - 1, 0))];

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      setIndex(Math.min(Math.max(next, 0), total - 1));
    },
    [total]
  );

  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      stageRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowDown' ||
        e.key === 'PageDown' ||
        e.key === ' '
      ) {
        e.preventDefault();
        goTo(index + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(index - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(total - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'n' || e.key === 'N') {
        setShowNotes((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, total, goTo, toggleFullscreen]);

  if (!slide) {
    return (
      <div
        style={{
          border: '1px solid #1F1F1F',
          backgroundColor: '#141414',
          padding: '4rem 2rem',
          textAlign: 'center',
          color: '#888888',
          fontFamily: 'var(--font-mono)',
        }}
      >
        No slides in this deck yet.
      </div>
    );
  }

  const html = renderTiptapContent(slide.content);
  const progressPct = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;

  return (
    <div
      ref={stageRef}
      style={{
        backgroundColor: '#0D0D0D',
        border: isFullscreen ? 'none' : '1px solid #1F1F1F',
        width: isFullscreen ? '100vw' : 'auto',
        height: isFullscreen ? '100vh' : 'auto',
        minHeight: isFullscreen ? '100vh' : '70vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: isFullscreen ? 'auto' : 'visible',
      }}
    >
      {/* Progress */}
      <div style={{ height: '3px', backgroundColor: '#1F1F1F', flexShrink: 0 }}>
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            backgroundColor: '#63E6A0',
            transition: reducedMotion ? 'none' : 'width 0.25s',
          }}
        />
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '0.9rem 1.5rem',
          borderBottom: '1px solid #1F1F1F',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: '#888888',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {deckTitle}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#888888',
              marginRight: '0.5rem',
            }}
          >
            {index + 1} / {total}
          </span>
          {slide.notes && (
            <button
              type="button"
              onClick={() => setShowNotes((v) => !v)}
              style={{
                ...btnStyle,
                padding: '0.45rem 0.8rem',
                borderColor: showNotes ? '#63E6A0' : '#1F1F1F',
                color: showNotes ? '#63E6A0' : '#E8E8E8',
              }}
              aria-pressed={showNotes}
            >
              Notes
            </button>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              ...btnStyle,
              padding: '0.45rem 0.8rem',
              backgroundColor: '#63E6A0',
              color: '#0D0D0D',
              border: 'none',
              fontWeight: 700,
            }}
          >
            {isFullscreen ? 'Exit (Esc)' : '⛶ Present'}
          </button>
        </div>
      </div>

      {/* Slide */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: isFullscreen ? '3rem clamp(2rem, 8vw, 8rem)' : '3rem clamp(1.5rem, 5vw, 4rem)',
          maxWidth: '1000px',
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        <div key={slide.id} className={reducedMotion ? undefined : 'slide-enter'}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: '#63E6A0',
              letterSpacing: '0.15em',
              marginBottom: '1rem',
            }}
          >
            SLIDE {String(index + 1).padStart(2, '0')}
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontSize: 'clamp(1.7rem, 4.5vw, 2.75rem)',
              fontWeight: 800,
              color: '#E8E8E8',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              margin: '0 0 2rem',
            }}
          >
            {slide.title}
          </h2>
          <div
            className="prose slide-body"
            dangerouslySetInnerHTML={{ __html: html }}
            style={{ color: '#E8E8E8' }}
          />
          {showNotes && slide.notes && (
            <div
              style={{
                marginTop: '2.5rem',
                border: '1px solid #1F1F1F',
                backgroundColor: '#141414',
                padding: '1.25rem 1.5rem',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: '#63E6A0',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '0.6rem',
                }}
              >
                Speaker notes
              </div>
              <p style={{ color: '#888888', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
                {slide.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #1F1F1F',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          style={index === 0 ? btnDisabled : btnStyle}
        >
          ← Prev
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#555555' }}>
          ← → navigate · F fullscreen · N notes · Esc exit
        </span>
        {index < total - 1 ? (
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            style={{
              ...btnStyle,
              backgroundColor: '#63E6A0',
              color: '#0D0D0D',
              border: 'none',
              fontWeight: 700,
            }}
          >
            Next →
          </button>
        ) : (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#63E6A0' }}>
            — end of deck —
          </span>
        )}
      </div>
    </div>
  );
}
