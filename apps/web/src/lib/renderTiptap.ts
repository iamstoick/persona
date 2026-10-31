import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import DOMPurify from 'isomorphic-dompurify';
import { Details, DetailsSummary } from './tiptapDetails';
import { CodeTabs, CodeTab } from './tiptapCodeTabs';

// Sanitized as defense-in-depth before being injected via dangerouslySetInnerHTML: content
// is authored by trusted editor/admin roles today, but if that trust boundary is ever
// breached (compromised account, a future public-submission path, an editor bug), this is
// what stops it from becoming stored XSS served to every visitor of the post/lesson.
export function renderTiptapContent(content: Record<string, unknown> | null): string {
  if (!content) return '';
  try {
    const html = generateHTML(content as Parameters<typeof generateHTML>[0], [
      StarterKit,
      Image,
      Link,
      Details,
      DetailsSummary,
      CodeTabs,
      CodeTab,
    ]);
    // Explicit policy instead of bare defaults: dangerous tags are dropped even if
    // a DOMPurify upgrade changes what the defaults allow, and only http(s),
    // mailto, tel, and relative URLs survive in href/src (no javascript:/data:).
    // Editor-created links are further constrained by Tiptap's own protocol
    // allowlist; this is the render-layer guarantee.
    return DOMPurify.sanitize(html, {
      FORBID_TAGS: [
        'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button',
        'select', 'textarea', 'option', 'link', 'meta', 'base', 'title',
        'frame', 'frameset', 'noscript', 'template', 'slot', 'math', 'svg',
      ],
      FORBID_ATTR: ['style'],
      ALLOW_UNKNOWN_PROTOCOLS: false,
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-zA-Z0-9+.\-]|#)/i,
    });
  } catch {
    return '';
  }
}
