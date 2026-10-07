export const CONTENT_REGISTRY = [
  {
    key: 'articles',
    label: 'Articles',
    singularLabel: 'Article',
    description: 'Essays and long-form writing.',
    route: '/articles',
    detailRoute: '/articles/:slug',
    api: '/content/articles',
    icon: 'article',
    filters: ['category', 'tag', 'language', 'q'],
    sorting: ['newest', 'oldest', 'popular', 'title'],
  },
  {
    key: 'research',
    label: 'Research',
    singularLabel: 'Research',
    description: 'Studies, papers, and documented inquiry.',
    route: '/research',
    detailRoute: '/research/:slug',
    api: '/content/research',
    icon: 'research',
    filters: ['category', 'tag', 'language', 'q'],
    sorting: ['newest', 'oldest', 'popular', 'title'],
  },
  {
    key: 'news',
    label: 'News',
    singularLabel: 'News',
    description: 'Current reports and briefings.',
    route: '/news',
    detailRoute: '/news/:slug',
    api: '/content/news',
    icon: 'news',
    filters: ['category', 'tag', 'language', 'q'],
    sorting: ['newest', 'oldest', 'popular', 'title'],
  },
  {
    key: 'books',
    label: 'Books',
    singularLabel: 'Book',
    description: 'Books and reading notes from the library.',
    route: '/books',
    detailRoute: '/books/:slug',
    api: '/content/books',
    icon: 'book',
    filters: ['category', 'tag', 'language', 'q'],
    sorting: ['newest', 'oldest', 'title'],
  },
  {
    key: 'columns',
    label: 'Columns',
    singularLabel: 'Column',
    description: 'Regular columns from contributing writers.',
    route: '/columns',
    detailRoute: '/columns/:slug',
    api: '/content/columns',
    icon: 'column',
    filters: ['category', 'tag', 'language', 'q'],
    sorting: ['newest', 'oldest', 'popular', 'title'],
  },
  {
    key: 'analysis',
    label: 'Analysis',
    singularLabel: 'Analysis',
    description: 'Closer readings of events and ideas.',
    route: '/analysis',
    detailRoute: '/analysis/:slug',
    api: '/content/analysis',
    icon: 'analysis',
    filters: ['category', 'tag', 'language', 'q'],
    sorting: ['newest', 'oldest', 'popular', 'title'],
  },
  {
    key: 'interesting-stories',
    label: 'Interesting Stories',
    singularLabel: 'Interesting Story',
    description: 'Narratives worth slowing down for.',
    route: '/interesting-stories',
    detailRoute: '/interesting-stories/:slug',
    api: '/content/interesting-stories',
    icon: 'story',
    filters: ['category', 'tag', 'language', 'q'],
    sorting: ['newest', 'oldest', 'popular', 'title'],
  },
  {
    key: 'inspirational-stories',
    label: 'Inspirational Stories',
    singularLabel: 'Inspirational Story',
    description: 'Stories of character, faith, and perseverance.',
    route: '/inspirational-stories',
    detailRoute: '/inspirational-stories/:slug',
    api: '/content/inspirational-stories',
    icon: 'story',
    filters: ['category', 'tag', 'language', 'q'],
    sorting: ['newest', 'oldest', 'popular', 'title'],
  },
  {
    key: 'videos',
    label: 'Videos',
    singularLabel: 'Video',
    description: 'Talks, lessons, and recorded programmes.',
    route: '/videos',
    detailRoute: '/videos/:slug',
    api: '/content/videos',
    icon: 'video',
    filters: ['category', 'tag', 'language', 'q'],
    sorting: ['newest', 'oldest', 'popular', 'title'],
  },
];

const byKey = Object.fromEntries(CONTENT_REGISTRY.map((item) => [item.key, item]));

export function getContentType(key) {
  return byKey[key] || null;
}

export function contentPath(typeKey, slug) {
  const type = getContentType(typeKey);
  if (!type || !slug) return '/';
  return `${type.route}/${slug}`;
}

export const FALLBACK_MENUS = {
  header: [
    { label: 'Articles', url: '/articles' },
    { label: 'Research', url: '/research' },
    { label: 'News', url: '/news' },
    { label: 'Columns', url: '/columns' },
    { label: 'Analysis', url: '/analysis' },
    { label: 'Videos', url: '/videos' },
    { label: 'Podcasts', url: '/podcasts' },
    { label: 'Books', url: '/books' },
    { label: 'Shop', url: '/shop' },
  ],
  footer: [
    { label: 'About', url: '/about' },
    { label: 'Contact', url: '/contact' },
    { label: 'Donate', url: '/donate' },
    { label: 'Newsletter', url: '/newsletter' },
    { label: 'Privacy', url: '/privacy' },
    { label: 'Terms', url: '/terms' },
  ],
  mobile: [
    { label: 'Articles', url: '/articles' },
    { label: 'Research', url: '/research' },
    { label: 'News', url: '/news' },
    { label: 'Analysis', url: '/analysis' },
    { label: 'Stories', url: '/interesting-stories', children: [
      { label: 'Interesting Stories', url: '/interesting-stories' },
      { label: 'Inspirational Stories', url: '/inspirational-stories' },
    ] },
    { label: 'Videos', url: '/videos' },
    { label: 'Podcasts', url: '/podcasts' },
    { label: 'Books', url: '/books' },
    { label: 'Shop', url: '/shop' },
    { label: 'Donate', url: '/donate' },
  ],
};

export const FALLBACK_SETTINGS = {
  siteName: 'ضیاء چترالی',
  tagline: 'Islamic educational content and discovery',
  logoUrl: '',
  footerText: 'A library for research, reflection, and public education.',
  contact: { email: '', phone: '', address: '' },
  social: [],
  defaultLanguage: 'en',
};
