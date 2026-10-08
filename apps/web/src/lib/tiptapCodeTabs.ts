import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    codeTabs: {
      setCodeTabs: () => ReturnType;
    };
  }
}

// One tab: exactly one code block plus its label. Rendered as a panel div;
// the tab bar itself is built client-side by CodeTabsEnhancer from data-labels,
// so server HTML stays static and the first panel is visible without JS.
export const CodeTab = Node.create({
  name: 'codeTab',
  group: 'codeTab',
  content: 'codeBlock',
  defining: true,

  addAttributes() {
    return {
      label: {
        default: 'Code',
        parseHTML: (element) => element.getAttribute('data-label') || 'Code',
        renderHTML: (attributes) => ({ 'data-label': attributes.label }),
      },
      language: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-language'),
        renderHTML: (attributes) =>
          attributes.language ? { 'data-language': attributes.language } : {},
      },
    };
  },

  parseHTML: () => [{ tag: 'div[data-code-tab]' }],

  renderHTML: ({ HTMLAttributes }) => [
    'div',
    mergeAttributes(HTMLAttributes, { class: 'code-tabs-panel', 'data-code-tab': '' }),
    0,
  ],
});

export const CodeTabs = Node.create({
  name: 'codeTabs',
  group: 'block',
  content: 'codeTab+',
  defining: true,
  isolating: true,

  parseHTML: () => [{ tag: 'div[data-code-tabs]' }],

  renderHTML: ({ HTMLAttributes }) => [
    'div',
    mergeAttributes(HTMLAttributes, { class: 'code-tabs', 'data-code-tabs': '' }),
    0,
  ],

  addCommands() {
    return {
      setCodeTabs:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            content: ['Python', 'JavaScript'].map((label) => ({
              type: 'codeTab',
              attrs: { label, language: label.toLowerCase() },
              content: [
                {
                  type: 'codeBlock',
                  attrs: { language: label.toLowerCase() },
                  content: [{ type: 'text', text: '# example' }],
                },
              ],
            })),
          }),
    };
  },
});
