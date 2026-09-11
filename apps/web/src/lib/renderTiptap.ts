import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';

export function renderTiptapContent(content: Record<string, unknown> | null): string {
  if (!content) return '';
  try {
    return generateHTML(content as Parameters<typeof generateHTML>[0], [StarterKit, Image, Link]);
  } catch {
    return '';
  }
}
