import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'span',
  'h1',
  'h2',
  'h3',
  'code',
  'pre',
];

const ALLOWED_ATTR = ['href', 'title'];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

export function htmlToText(html: string): string {
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function isHtmlEmpty(html: string): boolean {
  return htmlToText(html).length === 0;
}

export function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (/^(https?:\/\/|mailto:)/i.test(value)) return value;
  return null;
}
