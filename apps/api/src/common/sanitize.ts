import sanitizeHtml from 'sanitize-html';

/**
 * Texte riche limité (cahier des charges 4.3) : titres, gras, italique, listes, liens.
 * Tout le reste (styles, scripts, images, iframes) est supprimé.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'blockquote'],
  allowedAttributes: { a: ['href', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    // Le titre de premier niveau est réservé à la page : h1 devient h2.
    h1: 'h2',
    b: 'strong',
    i: 'em',
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}
