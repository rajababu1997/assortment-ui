import DOMPurify from 'dompurify';

/**
 * Sanitize HTML string to prevent XSS while preserving safe formatting
 * (bold, italic, links, lists, spans, line breaks, etc.).
 *
 * Use this wherever `dangerouslySetInnerHTML` is needed with API data.
 */
export function sanitizeHtml(html: string | undefined | null): string {
  return html ? DOMPurify.sanitize(html) : '';
}
