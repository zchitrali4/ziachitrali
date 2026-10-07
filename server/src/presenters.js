import { resolveContentKey } from './config/catalog.js';

function idOf(value) {
  if (!value) return null;
  return String(value._id || value);
}

function brand(value) {
  if (typeof value !== 'string' || !value) return value || '';
  return value
    .replaceAll('IEDS Press', 'Zia Chitrali')
    .replaceAll('IEDS Library', 'Zia Chitrali')
    .replaceAll('آئی ای ڈی ایس پریس', 'ضیاء چترالی')
    .replaceAll('آئی ای ڈی ایس', 'ضیاء چترالی')
    .replaceAll('مطبعة آي إي دي إس', 'ضياء چترالي')
    .replaceAll('آي إي دي إس', 'ضياء چترالي')
    .replaceAll('IEDS', 'Zia Chitrali');
}

export function presentImage(image) {
  if (!image?.url) return null;
  return { url: image.url, alt: image.alt || '', blur: image.blur || '' };
}

export function presentAuthor(author) {
  if (!author?.name) return null;
  return {
    id: idOf(author),
    name: author.name,
    slug: author.slug,
    bio: author.bio || '',
    image: presentImage(author.image),
    roleTitle: author.roleTitle || '',
    featured: Boolean(author.featured),
    social: author.social || [],
  };
}

export function presentCategory(category, count) {
  if (!category?.name) return null;
  return {
    id: idOf(category),
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    contentTypes: category.contentTypes || [],
    ...(count === undefined ? {} : { count }),
  };
}

export function presentTag(tag, count) {
  if (!tag?.name) return null;
  return {
    id: idOf(tag),
    name: tag.name,
    slug: tag.slug,
    ...(count === undefined ? {} : { count }),
  };
}

export function presentContentCard(doc) {
  const type = resolveContentKey(doc.type);
  return {
    id: idOf(doc),
    type,
    title: brand(doc.title),
    slug: doc.slug,
    excerpt: brand(doc.excerpt || ''),
    language: doc.language || 'en',
    direction: doc.direction || (doc.language === 'en' ? 'ltr' : 'rtl'),
    coverImage: presentImage(doc.coverImage),
    author: presentAuthor(doc.author),
    category: presentCategory(doc.category),
    tags: (doc.tags || []).map((tag) => presentTag(tag)).filter(Boolean),
    publishedAt: doc.publishedAt,
    readingTime: doc.readingTime || 1,
    viewCount: doc.viewCount || 0,
    likeCount: doc.likeCount || 0,
    featured: Boolean(doc.featured),
    breaking: Boolean(doc.breaking),
    publisher: brand(doc.publisher || ''),
    pages: doc.pages ?? null,
    isbn: doc.isbn || '',
    priceCents: doc.priceCents ?? null,
    currency: doc.currency || 'PKR',
    duration: doc.duration ?? null,
    status: doc.status,
  };
}

export function presentContentDetail(doc, extras = {}) {
  return {
    ...presentContentCard(doc),
    body: brand(doc.body || ''),
    videoUrl: doc.videoUrl || '',
    productId: doc.productId ? idOf(doc.productId) : null,
    seo: {
      title: brand(doc.seo?.title || doc.title),
      description: brand(doc.seo?.description || doc.excerpt || ''),
    },
    prev: extras.prev || null,
    next: extras.next || null,
    engagement: extras.engagement || { liked: false, bookmarked: false },
  };
}

export function presentNavRef(doc) {
  if (!doc) return null;
  return {
    id: idOf(doc),
    type: resolveContentKey(doc.type),
    title: doc.title,
    slug: doc.slug,
  };
}

export function presentUser(user) {
  return {
    id: user.id || idOf(user),
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    status: user.status,
    role: user.role?.slug
      ? { id: idOf(user.role), name: user.role.name, slug: user.role.slug }
      : user.role || null,
    permissions: user.permissions || user.role?.permissions || [],
    profile: user.profile || {},
    settings: user.settings || {},
  };
}

export function presentComment(comment) {
  return {
    id: idOf(comment),
    targetType: comment.targetType,
    targetId: idOf(comment.targetId),
    body: comment.body,
    status: comment.status,
    createdAt: comment.createdAt,
    user: comment.user?.name
      ? {
          id: idOf(comment.user),
          name: comment.user.name,
          avatarUrl: comment.user.profile?.avatarUrl || '',
        }
      : null,
  };
}

export function presentProduct(product) {
  return {
    id: idOf(product),
    title: product.title,
    slug: product.slug,
    description: product.description || '',
    priceCents: product.priceCents,
    currency: product.currency || 'PKR',
    images: (product.images || []).map(presentImage).filter(Boolean),
    colors: (product.colors || []).map((color) => ({ name: color.name, hex: color.hex || '' })),
    sizes: product.sizes || [],
    category: product.category || '',
    featured: Boolean(product.featured),
    stock: product.stock ?? 0,
    sku: product.sku || '',
    status: product.status,
  };
}

export function presentOrder(order) {
  return {
    id: idOf(order),
    email: order.email,
    items: order.items || [],
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    currency: order.currency,
    couponCode: order.couponCode || '',
    customer: order.customer || {},
    method: order.method || (order.payment?.provider === 'cod' ? 'cod' : 'payfast'),
    status: order.status,
    payment: order.payment || { provider: null, status: 'not_configured' },
    notes: order.notes || '',
    createdAt: order.createdAt,
  };
}

export function presentShow(show, episodes) {
  return {
    id: idOf(show),
    title: show.title,
    slug: show.slug,
    description: show.description || '',
    coverImage: presentImage(show.coverImage),
    status: show.status,
    ...(episodes ? { episodes } : {}),
  };
}

export function presentEpisode(episode, show) {
  return {
    id: idOf(episode),
    title: episode.title,
    slug: episode.slug,
    description: episode.description || '',
    audioUrl: episode.audioUrl || '',
    coverImage: presentImage(episode.coverImage) || (show ? presentImage(show.coverImage) : null),
    duration: episode.duration ?? null,
    publishedAt: episode.publishedAt,
    status: episode.status,
    likeCount: episode.likeCount || 0,
    show: show
      ? { id: idOf(show), title: show.title, slug: show.slug, coverImage: presentImage(show.coverImage) }
      : (episode.show?.title
        ? { id: idOf(episode.show), title: episode.show.title, slug: episode.show.slug, coverImage: presentImage(episode.show.coverImage) }
        : null),
  };
}

export function presentCampaign(campaign, raisedCents = 0) {
  return {
    id: idOf(campaign),
    title: brand(campaign.title),
    slug: campaign.slug,
    summary: brand(campaign.summary || ''),
    description: brand(campaign.description || ''),
    goalAmountCents: campaign.goalAmountCents || 0,
    raisedAmountCents: raisedCents,
    currency: campaign.currency || 'PKR',
    active: Boolean(campaign.active),
    featured: Boolean(campaign.featured),
    coverImage: presentImage(campaign.coverImage),
  };
}

export function presentPage(page) {
  return {
    id: idOf(page),
    title: brand(page.title),
    slug: page.slug,
    body: brand(page.body || ''),
    status: page.status,
    seo: {
      title: brand(page.seo?.title || page.title),
      description: brand(page.seo?.description || ''),
    },
    updatedAt: page.updatedAt,
  };
}

export function presentMenu(menu) {
  return {
    location: menu.location,
    items: (menu.items || []).map((item) => ({
      label: brand(item.label),
      url: item.url,
      children: (item.children || []).map((child) => ({ label: brand(child.label), url: child.url })),
    })),
  };
}

export function presentSettings(settings) {
  return {
    siteName: brand(settings?.siteName || 'ضیاء چترالی'),
    tagline: brand(settings?.tagline || ''),
    logoUrl: settings?.logoUrl || '',
    footerText: brand(settings?.footerText || ''),
    contact: {
      email: settings?.contact?.email || '',
      phone: settings?.contact?.phone || '',
      address: settings?.contact?.address || '',
    },
    social: settings?.social || [],
    defaultLanguage: settings?.defaultLanguage || 'en',
  };
}
