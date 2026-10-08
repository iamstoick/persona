'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

const STORAGE_KEY = 'gv-code-tab-language';

// Progressively enhances static .code-tabs markup (first panel visible by CSS
// alone) with a tab bar built from each panel's data-label. All groups in the
// block stay in sync: picking a language once switches every example, and the
// choice persists across visits.
export function CodeTabsEnhancer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const panelsOf = (tabs: Element) => [...tabs.querySelectorAll(':scope > .code-tabs-panel')];

    const setActiveByIndex = (tabs: Element, index: number) => {
      tabs.classList.add('is-ready');
      panelsOf(tabs).forEach((panel, i) => {
        panel.classList.toggle('is-active', i === index);
      });
      tabs.querySelectorAll('.code-tab-btn').forEach((button) => {
        button.setAttribute(
          'aria-selected',
          String(button.getAttribute('data-tab') === String(index))
        );
      });
    };

    // Returns false when the group has no tab with that label (caller decides
    // whether to fall back or leave the group untouched).
    const setActiveByLabel = (tabs: Element, label: string): boolean => {
      const index = panelsOf(tabs).findIndex((panel) => panel.getAttribute('data-label') === label);
      if (index < 0) return false;
      setActiveByIndex(tabs, index);
      return true;
    };

    root.querySelectorAll('.code-tabs:not([data-enhanced])').forEach((tabs) => {
      const panels = panelsOf(tabs);
      if (panels.length < 2) return; // a single panel needs no tab bar
      const bar = document.createElement('div');
      bar.className = 'code-tabs-list';
      bar.setAttribute('role', 'tablist');
      panels.forEach((panel, i) => {
        const button = document.createElement('button');
        button.className = 'code-tab-btn';
        button.setAttribute('role', 'tab');
        button.setAttribute('data-tab', String(i));
        button.setAttribute('aria-selected', String(i === 0));
        button.textContent = panel.getAttribute('data-label') || `Tab ${i + 1}`;
        bar.appendChild(button);
        panel.setAttribute('data-panel', String(i));
      });
      tabs.prepend(bar);
      tabs.setAttribute('data-enhanced', '');
    });

    const groups = [...root.querySelectorAll('.code-tabs')];
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    groups.forEach((tabs) => {
      if (!saved || !setActiveByLabel(tabs, saved)) setActiveByIndex(tabs, 0);
    });

    const onClick = (event: Event) => {
      const button = (event.target as HTMLElement).closest?.('.code-tab-btn');
      const tabs = button?.closest('.code-tabs');
      if (!button || !tabs || !root.contains(tabs)) return;
      const label = button.textContent ?? '';
      try {
        window.localStorage.setItem(STORAGE_KEY, label);
      } catch {
        // Private browsing: sync still works for this page view.
      }
      groups.forEach((group) => {
        setActiveByLabel(group, label);
      });
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

  return (
    <div ref={ref} style={{ display: 'contents' }}>
      {children}
    </div>
  );
}
