import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import DOMPurify from 'isomorphic-dompurify';

// Sanitized as defense-in-depth before being injected via dangerouslySetInnerHTML: content
// is authored by trusted editor/admin roles today, but if that trust boundary is ever
// breached (compromised account, a future public-submission path, an editor bug), this is
// what stops it from becoming stored XSS served to every visitor of the post/lesson.
export function renderTiptapContent(content: Record<string, unknown> | null): string {
  if (!content) return '';
  try {
    const html = generateHTML(content as Parameters<typeof generateHTML>[0], [StarterKit, Image, Link]);
    return DOMPurify.sanitize(html);
  } catch {
    return '';
  }
}
