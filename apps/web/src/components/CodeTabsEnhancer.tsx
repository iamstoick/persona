'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

// Progressively enhances static .code-tabs markup (first panel visible by CSS
// alone) with a tab bar built from each panel's data-label, plus switching.
export function CodeTabsEnhancer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    root.querySelectorAll('.code-tabs:not([data-enhanced])').forEach((tabs) => {
      const panels = [...tabs.querySelectorAll(':scope > .code-tabs-panel')];
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
        panel.classList.toggle('is-active', i === 0);
      });
      tabs.prepend(bar);
      tabs.classList.add('is-ready');
      tabs.setAttribute('data-enhanced', '');
    });

    const onClick = (event: Event) => {
      const button = (event.target as HTMLElement).closest?.('.code-tab-btn');
      const tabs = button?.closest('.code-tabs');
      if (!button || !tabs || !root.contains(tabs)) return;
      const index = button.getAttribute('data-tab');
      tabs.querySelectorAll('.code-tab-btn').forEach((other) => {
        other.setAttribute('aria-selected', String(other === button));
      });
      tabs.querySelectorAll('.code-tabs-panel').forEach((panel) => {
        panel.classList.toggle('is-active', panel.getAttribute('data-panel') === index);
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
