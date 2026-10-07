import sanitizeHtml from 'sanitize-html';

const allowedTags = sanitizeHtml.defaults.allowedTags.concat([
  'img', 'h1', 'h2', 'h3', 'figure', 'figcaption', 'iframe', 'u', 's', 'mark', 'span',
]);

const textAlign = [/^(left|center|right|justify)$/];

export function cleanHtml(value) {
  return sanitizeHtml(String(value || ''), {
    allowedTags,
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'title', 'data-align', 'style'],
      a: ['href', 'name', 'target', 'rel'],
      iframe: ['src', 'title', 'allow', 'allowfullscreen'],
      p: ['style'],
      h1: ['style'],
      h2: ['style', 'id'],
      h3: ['style', 'id'],
      h4: ['style'],
      li: ['style'],
      div: ['style'],
      span: ['style'],
    },
    allowedStyles: {
      p: { 'text-align': textAlign },
      h1: { 'text-align': textAlign },
      h2: { 'text-align': textAlign },
      h3: { 'text-align': textAlign },
      h4: { 'text-align': textAlign },
      li: { 'text-align': textAlign },
      div: { 'text-align': textAlign },
      span: { 'text-align': textAlign },
      img: { width: [/^(100|[1-9]\d?)%$/] },
    },
    allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com'],
  });
}
