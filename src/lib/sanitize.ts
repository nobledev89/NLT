/**
 * Minimal HTML sanitizer for rich-text content authored by trusted staff via
 * Tiptap. Strips script/style/iframe/object/event-handler vectors. This is a
 * defense-in-depth layer; only staff+ can write content (enforced by RLS), and
 * Tiptap already produces a constrained tag set.
 *
 * For untrusted input you would want a full sanitizer (e.g. DOMPurify on the
 * client / sanitize-html on the server) — documented in docs/architecture.md.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '');
}
