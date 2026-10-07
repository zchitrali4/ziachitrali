export const ADMIN_RESOURCES = {
  categories: {
    title: 'Categories',
    localized: ['name', 'description'],
    permission: 'taxonomy:manage',
    fields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'contentTypes', label: 'Content types', type: 'text', hint: 'Comma-separated keys such as articles, news' },
    ],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'slug', label: 'Slug' },
    ],
    toForm(row) {
      return { ...row, contentTypes: (row.contentTypes || []).join(', ') };
    },
    toBody(form) {
      return { ...form, contentTypes: String(form.contentTypes || '').split(',').map((item) => item.trim()).filter(Boolean), parent: form.parent || null };
    },
  },
  tags: {
    title: 'Tags',
    localized: ['name'],
    permission: 'taxonomy:manage',
    fields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'slug', label: 'Slug', type: 'text' },
    ],
    columns: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }],
  },
  authors: {
    title: 'Authors',
    localized: ['name', 'bio', 'roleTitle'],
    permission: 'taxonomy:manage',
    fields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'roleTitle', label: 'Role title', type: 'text' },
      { name: 'bio', label: 'Biography', type: 'textarea' },
      { name: 'imageUrl', label: 'Image URL', type: 'text' },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
    ],
    columns: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }],
    toForm(row) { return { ...row, imageUrl: row.image?.url || '' }; },
    toBody(form) { return { ...form, image: { url: form.imageUrl || '', alt: form.name || '' } }; },
  },
  users: {
    title: 'Users',
    permission: 'users:manage',
    fields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'password', label: 'Password', type: 'password', hint: 'Required for new users. Leave blank to keep the current password.' },
      { name: 'role', label: 'Role', type: 'relation', source: 'roles' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'disabled'] },
    ],
    columns: [{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'status', label: 'Status' }],
    toForm(row) {
      return { ...row, role: row.role?._id || row.role?.id || row.role || '', password: '' };
    },
    toBody(form) {
      const body = { ...form };
      if (!body.password) delete body.password;
      return body;
    },
  },
  roles: {
    title: 'Roles',
    permission: 'roles:manage',
    fields: [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'permissions', label: 'Permissions', type: 'textarea', hint: 'Comma-separated permission keys, or *' },
    ],
    columns: [{ key: 'name', label: 'Name' }, { key: 'slug', label: 'Slug' }, { key: 'id', label: 'Id' }],
    toForm(row) { return { ...row, permissions: (row.permissions || []).join(', ') }; },
    toBody(form) { return { ...form, permissions: String(form.permissions || '').split(',').map((item) => item.trim()).filter(Boolean) }; },
  },
  pages: {
    title: 'Pages',
    localized: ['title', 'body'],
    permission: 'pages:manage',
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
      { name: 'body', label: 'Body HTML', type: 'textarea' },
      { name: 'seoTitle', label: 'SEO title', type: 'text' },
      { name: 'seoDescription', label: 'SEO description', type: 'textarea' },
    ],
    columns: [{ key: 'title', label: 'Title' }, { key: 'slug', label: 'Slug' }, { key: 'status', label: 'Status' }],
    toForm(row) { return { ...row, seoTitle: row.seo?.title || '', seoDescription: row.seo?.description || '' }; },
    toBody(form) { return { ...form, seo: { title: form.seoTitle || '', description: form.seoDescription || '' } }; },
  },
  products: {
    title: 'Products',
    localized: ['title', 'description'],
    permission: 'products:manage',
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'priceRupees', label: 'Price (Rs)', type: 'number' },
      { name: 'stock', label: 'Stock', type: 'number' },
      { name: 'sku', label: 'SKU', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'archived'] },
      { name: 'colors', label: 'Colors', type: 'text', hint: 'Ink:#171410, Sand:#c4b49a' },
      { name: 'sizes', label: 'Sizes', type: 'text', hint: 'S, M, L' },
      { name: 'imageUrls', label: 'Images', type: 'textarea', hint: 'One image address per line' },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
    ],
    columns: [{ key: 'title', label: 'Title' }, { key: 'category', label: 'Category' }, { key: 'stock', label: 'Stock' }, { key: 'status', label: 'Status' }],
    toForm(row) {
      return {
        ...row,
        priceRupees: row.priceCents ? String(row.priceCents / 100) : '',
        colors: (row.colors || []).map((item) => `${item.name}:${item.hex || ''}`).join(', '),
        sizes: (row.sizes || []).join(', '),
        imageUrls: (row.images || []).map((item) => item.url).filter(Boolean).join('\n'),
      };
    },
    toBody(form) {
      const title = ['en', 'ur', 'ar'].map((lang) => form.translations?.[lang]?.title).find((value) => value && value.trim()) || '';
      return {
        ...form,
        title,
        description: form.translations?.en?.description || form.translations?.ur?.description || '',
        priceCents: Math.round(Number(form.priceRupees || 0) * 100),
        stock: Number(form.stock || 0),
        featured: Boolean(form.featured),
        colors: String(form.colors || '').split(',').map((part) => {
          const [name, hex] = part.split(':').map((item) => item.trim());
          return name ? { name, hex: hex || '#171410' } : null;
        }).filter(Boolean),
        sizes: String(form.sizes || '').split(',').map((item) => item.trim()).filter(Boolean),
        images: String(form.imageUrls || '').split('\n').map((url) => url.trim()).filter(Boolean).map((url) => ({ url, alt: title })),
      };
    },
  },
  coupons: {
    title: 'Coupons',
    permission: 'products:manage',
    fields: [
      { name: 'code', label: 'Code', type: 'text' },
      { name: 'type', label: 'Type', type: 'select', options: ['percent', 'fixed'] },
      { name: 'amount', label: 'Amount', type: 'number', hint: 'Percent 1-100, or fixed amount in cents' },
      { name: 'minSubtotalCents', label: 'Minimum subtotal cents', type: 'number' },
      { name: 'active', label: 'Active', type: 'checkbox' },
    ],
    columns: [{ key: 'code', label: 'Code' }, { key: 'type', label: 'Type' }, { key: 'amount', label: 'Amount' }],
    toBody(form) { return { ...form, amount: Number(form.amount || 0), minSubtotalCents: Number(form.minSubtotalCents || 0), active: Boolean(form.active) }; },
  },
  campaigns: {
    title: 'Donation campaigns',
    localized: ['title', 'summary', 'description'],
    permission: 'donations:manage',
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'summary', label: 'Summary', type: 'textarea' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'goalAmountCents', label: 'Goal in cents', type: 'number' },
      { name: 'currency', label: 'Currency', type: 'text' },
      { name: 'active', label: 'Active', type: 'checkbox' },
      { name: 'featured', label: 'Featured', type: 'checkbox' },
    ],
    columns: [{ key: 'title', label: 'Title' }, { key: 'active', label: 'Active' }],
    toBody(form) { return { ...form, goalAmountCents: Number(form.goalAmountCents || 0), active: form.active !== false, featured: Boolean(form.featured) }; },
  },
  media: {
    title: 'Media',
    permission: 'media:manage',
    fields: [
      { name: 'url', label: 'URL', type: 'text' },
      { name: 'alt', label: 'Alt text', type: 'text' },
      { name: 'filename', label: 'Filename', type: 'text' },
      { name: 'type', label: 'Type', type: 'text' },
    ],
    columns: [{ key: 'filename', label: 'File' }, { key: 'url', label: 'URL' }, { key: 'alt', label: 'Alt' }],
  },
  shows: {
    title: 'Podcast shows',
    localized: ['title', 'description'],
    permission: 'podcasts:manage',
    fields: [
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'coverUrl', label: 'Cover URL', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
    ],
    columns: [{ key: 'title', label: 'Title' }, { key: 'status', label: 'Status' }],
    toForm(row) { return { ...row, coverUrl: row.coverImage?.url || '' }; },
    toBody(form) { return { ...form, coverImage: { url: form.coverUrl || '', alt: form.title || '' } }; },
  },
  episodes: {
    title: 'Episodes',
    localized: ['title', 'description'],
    permission: 'podcasts:manage',
    fields: [
      { name: 'show', label: 'Show', type: 'relation', source: 'shows' },
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'slug', label: 'Slug', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'audioUrl', label: 'Audio URL', type: 'text' },
      { name: 'duration', label: 'Duration seconds', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['draft', 'published'] },
    ],
    columns: [{ key: 'title', label: 'Title' }, { key: 'status', label: 'Status' }],
    toBody(form) { return { ...form, duration: form.duration ? Number(form.duration) : null }; },
  },
  subscribers: {
    title: 'Newsletter',
    permission: 'newsletter:manage',
    fields: [
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['active', 'unsubscribed'] },
    ],
    columns: [{ key: 'email', label: 'Email' }, { key: 'status', label: 'Status' }],
  },
};
