function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightText(value, query) {
  const safe = escapeHtml(value);
  const term = String(query || '').trim();
  if (!term) return safe;
  return safe.replace(new RegExp(`(${escapeRegex(term)})`, 'ig'), '<mark>$1</mark>');
}

const RICH_TAGS = new Set(['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'strike', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'hr', 'span', 'mark', 'code', 'pre']);

function keepAlign(value) {
  const match = String(value || '').match(/text-align:\s*(left|center|right|justify)/i);
  return match ? `text-align: ${match[1].toLowerCase()}` : '';
}

function keepWidth(value) {
  const match = String(value || '').match(/width:\s*(100|[1-9]\d?)%/i);
  return match ? `${match[1]}%` : '';
}

export function sanitizeRichHtml(html) {
  const source = String(html || '');
  if (!source || typeof DOMParser === 'undefined') return source;
  const doc = new DOMParser().parseFromString(`<div>${source}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return '';
  const out = doc.createElement('div');
  const appendClean = (sourceNode, target) => {
    sourceNode.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        target.appendChild(doc.createTextNode(child.textContent));
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const tag = child.tagName.toLowerCase();
      if (['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta'].includes(tag)) return;
      if (!RICH_TAGS.has(tag)) {
        appendClean(child, target);
        return;
      }
      const el = doc.createElement(tag);
      if (tag === 'a') {
        const href = child.getAttribute('href') || '';
        if (/^(https?:|mailto:|\/(?!\/)|#)/i.test(href)) {
          el.setAttribute('href', href);
          el.setAttribute('rel', 'noopener noreferrer');
          if (/^https?:/i.test(href)) el.setAttribute('target', '_blank');
        }
      } else if (tag === 'img') {
        const src = child.getAttribute('src') || '';
        if (!/^(https?:|\/(?!\/))/i.test(src)) return;
        const align = child.getAttribute('data-align');
        const width = keepWidth(child.getAttribute('style'));
        el.setAttribute('src', src);
        el.setAttribute('alt', child.getAttribute('alt') || '');
        el.setAttribute('data-align', ['left', 'center', 'right'].includes(align) ? align : 'center');
        if (width) el.setAttribute('style', `width: ${width}`);
      } else {
        const style = keepAlign(child.getAttribute('style'));
        if (style) el.setAttribute('style', style);
      }
      appendClean(child, el);
      target.appendChild(el);
    });
  };
  appendClean(root, out);
  return out.innerHTML;
}

export function headingIds(html) {
  let index = 0;
  return String(html || '').replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, inner) => {
    if (/\sid=/.test(attrs)) return match;
    index += 1;
    const text = inner.replace(/<[^>]+>/g, '').trim();
    const id = `section-${index}-${text.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/gi, '-').replace(/^-|-$/g, '') || index}`;
    return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
  });
}

export function extractHeadings(html) {
  const headings = [];
  const pattern = /<h([23])[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match = pattern.exec(html);
  while (match) {
    headings.push({
      level: Number(match[1]),
      id: match[2],
      text: match[3].replace(/<[^>]+>/g, '').trim(),
    });
    match = pattern.exec(html);
  }
  return headings;
}
