'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

interface Props {
  content?: Record<string, unknown> | null;
  onChange?: (json: Record<string, unknown>) => void;
}

const TOOLBAR_BUTTONS = [
  { label: 'B', command: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBold().run(), title: 'Bold' },
  { label: 'I', command: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleItalic().run(), title: 'Italic' },
  { label: 'H2', command: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 2 }).run(), title: 'Heading 2' },
  { label: 'H3', command: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleHeading({ level: 3 }).run(), title: 'Heading 3' },
  { label: '•', command: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBulletList().run(), title: 'Bullet list' },
  { label: '1.', command: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleOrderedList().run(), title: 'Ordered list' },
  { label: '❝', command: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleBlockquote().run(), title: 'Quote' },
  { label: '<>', command: (e: ReturnType<typeof useEditor>) => e?.chain().focus().toggleCode().run(), title: 'Code' },
];

export function TiptapEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    content: content || undefined,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON() as Record<string, unknown>);
    },
  });

  const btnBase: React.CSSProperties = {
    padding: '0.25rem 0.6rem',
    backgroundColor: 'transparent',
    border: '1px solid #1F1F1F',
    color: '#888888',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    cursor: 'pointer',
  };

  return (
    <div style={{ border: '1px solid #1F1F1F', backgroundColor: '#141414' }}>
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.5rem', borderBottom: '1px solid #1F1F1F', flexWrap: 'wrap' }}>
        {TOOLBAR_BUTTONS.map(({ label, command, title }) => (
          <button
            key={title}
            type="button"
            title={title}
            onClick={() => command(editor)}
            style={btnBase}
          >
            {label}
          </button>
        ))}
      </div>
      <EditorContent
        editor={editor}
        style={{
          minHeight: '400px',
          padding: '1rem',
          color: '#E8E8E8',
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          lineHeight: 1.8,
          outline: 'none',
        }}
      />
    </div>
  );
}
