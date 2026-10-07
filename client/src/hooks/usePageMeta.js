import { useEffect } from 'react';
import { useSite } from '../context/SiteContext.jsx';

function upsertMeta(attribute, key, content) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector(selector);
  if (!content) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function usePageMeta({
  title,
  description = '',
  path = '/',
  image = '',
  type = 'website',
  jsonLd = [],
  noIndex = false,
}) {
  const { settings } = useSite();
  const schemaKey = JSON.stringify(jsonLd || []);

  useEffect(() => {
    const siteName = settings.siteName || 'ضیاء چترالی';
    const pageTitle = (title || '').trim();
    const fullTitle = !pageTitle || pageTitle === siteName.trim() ? siteName : `${pageTitle} · ${siteName}`;
    document.title = fullTitle;
    const url = `${window.location.origin}${path}`;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:site_name', siteName);
    upsertMeta('property', 'og:image', image);
    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    const entries = JSON.parse(schemaKey);
    const scripts = (Array.isArray(entries) ? entries : [entries]).filter(Boolean).map((entry) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.pageMeta = 'true';
      script.textContent = JSON.stringify(entry);
      document.head.appendChild(script);
      return script;
    });

    return () => {
      scripts.forEach((script) => script.remove());
    };
  }, [title, description, path, image, type, schemaKey, noIndex, settings.siteName]);
}
