export function absoluteUrl(path = '/') {
  if (/^https?:\/\//.test(path)) return path;
  const origin = window.location.origin;
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function articleSchema({ content, url }) {
  return {
    '@context': 'https://schema.org',
    '@type': content.type === 'books' ? 'Book' : content.type === 'videos' ? 'VideoObject' : 'Article',
    headline: content.title,
    description: content.excerpt || content.seo?.description || '',
    datePublished: content.publishedAt || undefined,
    image: content.coverImage?.url ? [content.coverImage.url] : undefined,
    author: content.author?.name ? { '@type': 'Person', name: content.author.name } : undefined,
    mainEntityOfPage: url,
    ...(content.type === 'books' ? { isbn: content.isbn || undefined, numberOfPages: content.pages || undefined } : {}),
    ...(content.type === 'videos' ? { embedUrl: content.videoUrl || undefined, duration: content.duration ? `PT${content.duration}S` : undefined } : {}),
  };
}

export function breadcrumbSchema(items, origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `${origin}${item.href}` : undefined,
    })),
  };
}

export function videoEmbed(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be' || host === 'youtube.com') {
      const id = host === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v');
      return id ? { kind: 'embed', src: `https://www.youtube.com/embed/${encodeURIComponent(id)}` } : { kind: 'link', url };
    }
    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      return id ? { kind: 'embed', src: `https://player.vimeo.com/video/${encodeURIComponent(id)}` } : { kind: 'link', url };
    }
    return { kind: 'file', url };
  } catch {
    return { kind: 'link', url };
  }
}
