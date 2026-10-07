export const PERMISSIONS = [
  'dashboard:view',
  'content:read',
  'content:write',
  'content:delete',
  'taxonomy:manage',
  'users:manage',
  'roles:manage',
  'menus:manage',
  'pages:manage',
  'comments:moderate',
  'products:manage',
  'orders:manage',
  'donations:manage',
  'newsletter:manage',
  'media:manage',
  'podcasts:manage',
  'settings:manage',
];

export const CONTENT_TYPES = {
  articles: {
    type: 'article',
    label: 'Articles',
    singular: 'Article',
    route: '/articles',
  },
  research: {
    type: 'research',
    label: 'Research',
    singular: 'Research',
    route: '/research',
  },
  news: {
    type: 'news',
    label: 'News',
    singular: 'News',
    route: '/news',
  },
  books: {
    type: 'book',
    label: 'Books',
    singular: 'Book',
    route: '/books',
  },
  columns: {
    type: 'column',
    label: 'Columns',
    singular: 'Column',
    route: '/columns',
  },
  analysis: {
    type: 'analysis',
    label: 'Analysis',
    singular: 'Analysis',
    route: '/analysis',
  },
  'interesting-stories': {
    type: 'interesting_story',
    label: 'Interesting Stories',
    singular: 'Interesting Story',
    route: '/interesting-stories',
  },
  'inspirational-stories': {
    type: 'inspirational_story',
    label: 'Inspirational Stories',
    singular: 'Inspirational Story',
    route: '/inspirational-stories',
  },
  videos: {
    type: 'video',
    label: 'Videos',
    singular: 'Video',
    route: '/videos',
  },
};

const typeToKey = Object.fromEntries(
  Object.entries(CONTENT_TYPES).map(([key, value]) => [value.type, key]),
);

export function resolveContentKey(keyOrType) {
  if (!keyOrType) return null;
  if (CONTENT_TYPES[keyOrType]) return keyOrType;
  return typeToKey[keyOrType] || null;
}

export function contentEnum(key) {
  return CONTENT_TYPES[key]?.type || null;
}

export const CONTENT_ENUMS = Object.values(CONTENT_TYPES).map((item) => item.type);

export const ROLE_SEEDS = [
  {
    slug: 'super_admin',
    name: 'Super Admin',
    description: 'Full access.',
    permissions: ['*'],
    isSystem: true,
  },
  {
    slug: 'admin',
    name: 'Admin',
    description: 'Operational access across the site.',
    permissions: PERMISSIONS.filter((item) => item !== 'roles:manage'),
    isSystem: true,
  },
  {
    slug: 'editor',
    name: 'Editor',
    description: 'Publishes and organises content.',
    permissions: [
      'dashboard:view',
      'content:read',
      'content:write',
      'content:delete',
      'taxonomy:manage',
      'pages:manage',
      'menus:manage',
      'comments:moderate',
      'media:manage',
      'podcasts:manage',
    ],
    isSystem: true,
  },
  {
    slug: 'author',
    name: 'Author',
    description: 'Creates and edits their own content.',
    permissions: ['dashboard:view', 'content:read', 'content:write'],
    isSystem: true,
  },
  {
    slug: 'user',
    name: 'Member',
    description: 'Public member account.',
    permissions: [],
    isSystem: true,
  },
];
