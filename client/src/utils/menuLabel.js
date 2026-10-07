import { t } from './i18n.js';

const BY_URL = {
  '/articles': 'articles',
  '/research': 'research',
  '/news': 'news',
  '/columns': 'columns',
  '/analysis': 'analysis',
  '/videos': 'videos',
  '/podcasts': 'podcasts',
  '/books': 'books',
  '/shop': 'shop',
  '/donate': 'donate',
  '/newsletter': 'newsletter',
  '/about': 'about',
  '/contact': 'contact',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/interesting-stories': 'interesting-stories',
  '/inspirational-stories': 'inspirational-stories',
};

export function menuLabel(language, item) {
  if (item?.children?.length && item.url === '/interesting-stories') return t(language, 'stories');
  const key = BY_URL[item?.url];
  if (!key) return item?.label || '';
  const text = t(language, key);
  return text === key ? (item?.label || '') : text;
}
