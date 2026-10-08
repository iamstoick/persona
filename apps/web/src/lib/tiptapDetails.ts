import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    details: {
      setDetails: () => ReturnType;
    };
  }
}

// <summary>: the always-visible label row of a collapsible section.
export const DetailsSummary = Node.create({
  name: 'detailsSummary',
  group: 'detailsSummary',
  content: 'inline*',
  defining: true,

  parseHTML: () => [{ tag: 'summary' }],

  renderHTML: ({ HTMLAttributes }) => ['summary', mergeAttributes(HTMLAttributes), 0],
});

// <details>: a collapsible section. Closed unless explicitly opened, so the
// content stays opt-in reading for visitors.
export const Details = Node.create({
  name: 'details',
  group: 'block',
  content: 'detailsSummary block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      open: {
        default: false,
        parseHTML: (element) => element.hasAttribute('open'),
        renderHTML: (attributes) => (attributes.open ? { open: 'open' } : {}),
      },
    };
  },

  parseHTML: () => [{ tag: 'details' }],

  renderHTML: ({ HTMLAttributes }) => ['details', mergeAttributes(HTMLAttributes), 0],

  addCommands() {
    return {
      setDetails:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { open: false },
            content: [
              { type: 'detailsSummary', content: [{ type: 'text', text: 'Summary' }] },
              { type: 'paragraph' },
            ],
          }),
    };
  },
});
