import bcrypt from 'bcryptjs';
import { CONTENT_ENUMS, PERMISSIONS } from '../config/catalog.js';
import { ApiError, getPaging, pageMeta } from '../utils/http.js';
import { slugify } from '../utils/security.js';
import { cleanHtml } from '../utils/sanitize.js';
import { hasPermission } from '../middleware/common.js';
import {
  Author, Category, Comment, Content, Coupon, Donation, DonationCampaign, Media, Menu,
  NewsletterSubscriber, Order, Page, PodcastEpisode, PodcastShow, Product, Role, SiteSetting,
  Tag, User,
} from '../models.js';
import { trafficSeries } from './trafficService.js';
import { presentComment, presentOrder } from '../presenters.js';
import { announceContent, announceProduct } from './mailService.js';

function clean(doc) {
  if (!doc) return null;
  const obj = doc.toObject({ virtuals: false });
  obj.id = String(obj._id);
  delete obj.password;
  delete obj.accessKeyHash;
  return obj;
}

function canEditAnyContent(user) {
  return hasPermission(user, '*') || hasPermission(user, 'content:delete');
}

function translationsOf(body, fields) {
  if (!body?.translations) return undefined;
  const translations = {};
  ['en', 'ur', 'ar'].forEach((lang) => {
    translations[lang] = {};
    fields.forEach((field) => {
      const value = body.translations?.[lang]?.[field];
      translations[lang][field] = typeof value === 'string' ? (field === 'body' ? cleanHtml(value) : value) : '';
    });
  });
  return translations;
}

function primaryField(translations, field) {
  if (!translations) return '';
  const lang = ['en', 'ur', 'ar'].find((code) => String(translations[code]?.[field] || '').trim());
  return lang ? translations[lang][field].trim() : '';
}

const resources = {
  content: {
    model: Content,
    read: 'content:read',
    write: 'content:write',
    remove: 'content:delete',
    search: ['title', 'slug'],
    populate: ['author', 'category', 'tags'],
    ownUnless: canEditAnyContent,
    prepare(body, user, existing) {
      const translations = translationsOf(body, ['title', 'excerpt', 'body']);
      const title = primaryField(translations, 'title') || body.title;
      const language = translations
        ? (['en', 'ur', 'ar'].find((code) => String(translations[code]?.title || '').trim()) || 'en')
        : (body.language || 'en');
      if (!title) throw new ApiError(422, 'Title is required.', [{ field: 'title', message: 'Title is required.' }]);
      if (!CONTENT_ENUMS.includes(body.type)) {
        throw new ApiError(422, 'Choose a content type.', [{ field: 'type', message: 'Invalid content type.' }]);
      }
      return {
        type: body.type,
        title,
        slug: body.slug || slugify(title),
        excerpt: primaryField(translations, 'excerpt') || body.excerpt || '',
        body: primaryField(translations, 'body') || body.body || '',
        language,
        translations,
        status: body.status || 'draft',
        featured: Boolean(body.featured),
        breaking: Boolean(body.breaking),
        coverImage: body.coverImage || {},
        author: body.author || null,
        category: body.category || null,
        tags: body.tags || [],
        publishedAt: body.publishedAt || existing?.publishedAt || null,
        publisher: body.publisher || '',
        pages: body.pages || null,
        isbn: body.isbn || '',
        priceCents: body.priceCents ?? null,
        currency: body.currency || 'PKR',
        videoUrl: body.videoUrl || '',
        duration: body.duration ?? null,
        productId: body.productId || null,
        seo: body.seo || {},
        createdBy: existing?.createdBy || user.id,
      };
    },
  },
  categories: {
    model: Category,
    permission: 'taxonomy:manage',
    search: ['name', 'slug'],
    prepare(body) {
      if (!body.name) throw new ApiError(422, 'Name is required.', [{ field: 'name', message: 'Name is required.' }]);
      return {
        name: body.name,
        slug: body.slug || slugify(body.name),
        description: body.description || '',
        contentTypes: body.contentTypes || [],
        parent: body.parent || null,
      };
    },
  },
  tags: {
    model: Tag,
    permission: 'taxonomy:manage',
    search: ['name', 'slug'],
    prepare(body) {
      if (!body.name) throw new ApiError(422, 'Name is required.', [{ field: 'name', message: 'Name is required.' }]);
      return { name: body.name, slug: body.slug || slugify(body.name) };
    },
  },
  authors: {
    model: Author,
    permission: 'taxonomy:manage',
    search: ['name', 'slug'],
    prepare(body) {
      if (!body.name) throw new ApiError(422, 'Name is required.', [{ field: 'name', message: 'Name is required.' }]);
      return {
        name: body.name,
        slug: body.slug || slugify(body.name),
        bio: body.bio || '',
        image: body.image || {},
        roleTitle: body.roleTitle || '',
        featured: Boolean(body.featured),
        social: body.social || [],
        user: body.user || null,
      };
    },
  },
  users: {
    model: User,
    permission: 'users:manage',
    search: ['name', 'email'],
    populate: ['role'],
    async prepare(body, user, existing) {
      if (!existing && (!body.name || !body.email || !body.password)) {
        throw new ApiError(422, 'Name, email, and password are required.');
      }
      const next = {
        name: body.name ?? existing?.name,
        email: (body.email ?? existing?.email)?.toLowerCase(),
        status: body.status || existing?.status || 'active',
        emailVerified: body.emailVerified ?? existing?.emailVerified ?? false,
        role: body.role || existing?.role,
      };
      if (!existing) next.password = await bcrypt.hash(body.password, 12);
      else if (body.password) next.password = await bcrypt.hash(body.password, 12);
      return next;
    },
  },
  roles: {
    model: Role,
    permission: 'roles:manage',
    search: ['name', 'slug'],
    prepare(body, user, existing) {
      if (existing?.slug === 'super_admin') return { permissions: ['*'], description: body.description ?? existing.description, name: existing.name };
      const permissions = (body.permissions || []).filter((item) => PERMISSIONS.includes(item) || item === '*');
      return {
        name: body.name || existing?.name,
        slug: existing?.isSystem ? existing.slug : (body.slug || slugify(body.name)),
        description: body.description || '',
        permissions,
        isSystem: existing?.isSystem || false,
      };
    },
  },
  menus: {
    model: Menu,
    permission: 'menus:manage',
    search: ['location'],
    prepare(body) {
      if (!['header', 'footer', 'mobile'].includes(body.location)) {
        throw new ApiError(422, 'Menu location is invalid.', [{ field: 'location', message: 'Use header, footer, or mobile.' }]);
      }
      return { location: body.location, items: body.items || [] };
    },
  },
  pages: {
    model: Page,
    permission: 'pages:manage',
    search: ['title', 'slug'],
    prepare(body) {
      const translations = translationsOf(body, ['title', 'body']);
      const title = primaryField(translations, 'title') || body.title;
      if (!title) throw new ApiError(422, 'Title is required.', [{ field: 'title', message: 'Title is required.' }]);
      return {
        title,
        slug: body.slug || slugify(title),
        body: cleanHtml(primaryField(translations, 'body') || body.body || ''),
        translations,
        status: body.status || 'draft',
        seo: body.seo || {},
      };
    },
  },
  products: {
    model: Product,
    permission: 'products:manage',
    search: ['title', 'slug', 'sku'],
    prepare(body) {
      const translations = translationsOf(body, ['title', 'description']);
      const title = primaryField(translations, 'title') || body.title;
      if (!title) throw new ApiError(422, 'Title is required.', [{ field: 'title', message: 'Title is required.' }]);
      return {
        title,
        slug: body.slug || slugify(title),
        description: primaryField(translations, 'description') || body.description || '',
        translations,
        priceCents: Number(body.priceCents || 0),
        currency: body.currency || 'PKR',
        images: body.images || [],
        colors: Array.isArray(body.colors) ? body.colors : [],
        sizes: Array.isArray(body.sizes) ? body.sizes : [],
        category: body.category || '',
        featured: Boolean(body.featured),
        stock: Number(body.stock || 0),
        sku: body.sku || '',
        status: body.status || 'draft',
      };
    },
  },
  coupons: {
    model: Coupon,
    permission: 'products:manage',
    search: ['code'],
    prepare(body) {
      return {
        code: String(body.code || '').toUpperCase(),
        type: body.type,
        amount: Number(body.amount || 0),
        active: body.active !== false,
        expiresAt: body.expiresAt || null,
        minSubtotalCents: Number(body.minSubtotalCents || 0),
      };
    },
  },
  campaigns: {
    model: DonationCampaign,
    permission: 'donations:manage',
    search: ['title', 'slug'],
    prepare(body) {
      if (!body.title) throw new ApiError(422, 'Title is required.', [{ field: 'title', message: 'Title is required.' }]);
      return {
        title: body.title,
        slug: body.slug || slugify(body.title),
        summary: body.summary || '',
        description: body.description || '',
        goalAmountCents: Number(body.goalAmountCents || 0),
        currency: body.currency || 'PKR',
        active: body.active !== false,
        featured: Boolean(body.featured),
        coverImage: body.coverImage || {},
      };
    },
  },
  media: {
    model: Media,
    permission: 'media:manage',
    search: ['filename', 'alt', 'url'],
    prepare(body, user) {
      if (!body.url) throw new ApiError(422, 'A media URL is required.', [{ field: 'url', message: 'URL is required.' }]);
      return {
        url: body.url,
        alt: body.alt || '',
        type: body.type || 'image',
        filename: body.filename || '',
        uploadedBy: user.id,
      };
    },
  },
  shows: {
    model: PodcastShow,
    permission: 'podcasts:manage',
    search: ['title', 'slug'],
    prepare(body) {
      if (!body.title) throw new ApiError(422, 'Title is required.', [{ field: 'title', message: 'Title is required.' }]);
      return {
        title: body.title,
        slug: body.slug || slugify(body.title),
        description: body.description || '',
        coverImage: body.coverImage || {},
        status: body.status || 'draft',
      };
    },
  },
  episodes: {
    model: PodcastEpisode,
    permission: 'podcasts:manage',
    search: ['title', 'slug'],
    populate: ['show'],
    prepare(body) {
      if (!body.title || !body.show) throw new ApiError(422, 'Title and show are required.');
      return {
        show: body.show,
        title: body.title,
        slug: body.slug || slugify(body.title),
        description: body.description || '',
        audioUrl: body.audioUrl || '',
        coverImage: body.coverImage || {},
        duration: body.duration ?? null,
        publishedAt: body.publishedAt || (body.status === 'published' ? new Date() : null),
        status: body.status || 'draft',
      };
    },
  },
  subscribers: {
    model: NewsletterSubscriber,
    permission: 'newsletter:manage',
    search: ['email', 'name'],
    prepare(body) {
      return { email: String(body.email || '').toLowerCase(), name: body.name || '', status: body.status || 'active' };
    },
  },
};

export function getResource(name) {
  const resource = resources[name];
  if (!resource) throw new ApiError(404, 'Resource not found.');
  return resource;
}

export function permissionFor(resource, action) {
  if (action === 'read') return resource.read || resource.permission;
  if (action === 'delete') return resource.remove || resource.permission;
  return resource.write || resource.permission;
}

export async function listResource(name, query) {
  const resource = getResource(name);
  const { page, limit, skip } = getPaging(query, 20);
  const filter = {};
  if (query.q && resource.search) {
    const rx = new RegExp(String(query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = resource.search.map((field) => ({ [field]: rx }));
  }
  if (query.status) filter.status = query.status;
  if (query.type && name === 'content') filter.type = query.type;
  let cursor = resource.model.find(filter).sort({ updatedAt: -1, createdAt: -1 }).skip(skip).limit(limit);
  if (resource.populate) cursor = cursor.populate(resource.populate);
  const [items, total] = await Promise.all([
    cursor,
    resource.model.countDocuments(filter),
  ]);
  return { data: items.map(clean), meta: pageMeta(page, limit, total) };
}

async function announceSaved(name, before, item) {
  try {
    if (name === 'content' && item.status === 'published' && before !== 'published') await announceContent(item);
    if (name === 'products' && item.status === 'active' && before !== 'active') await announceProduct(item);
  } catch (error) {
    console.error('[mail]', error.message);
  }
}

export async function createResource(name, body, user) {
  const resource = getResource(name);
  const payload = await resource.prepare(body, user, null);
  const doc = await resource.model.create(payload);
  const item = clean(doc);
  await announceSaved(name, null, item);
  return item;
}

export async function updateResource(name, id, body, user) {
  const resource = getResource(name);
  const existing = await resource.model.findById(id);
  if (!existing) throw new ApiError(404, 'Record not found.');
  if (resource.ownUnless && !resource.ownUnless(user) && String(existing.createdBy) !== String(user.id)) {
    throw new ApiError(403, 'You can only edit your own content.');
  }
  if (name === 'roles' && existing.isSystem && body.slug && body.slug !== existing.slug) {
    throw new ApiError(403, 'System role slugs cannot be changed.');
  }
  const before = existing.status;
  const payload = await resource.prepare(body, user, existing);
  Object.assign(existing, payload);
  await existing.save();
  const item = clean(existing);
  await announceSaved(name, before, item);
  return item;
}

export async function deleteResource(name, id, user) {
  const resource = getResource(name);
  const existing = await resource.model.findById(id);
  if (!existing) throw new ApiError(404, 'Record not found.');
  if (name === 'roles' && existing.isSystem) throw new ApiError(403, 'System roles cannot be deleted.');
  if (resource.ownUnless && !resource.ownUnless(user) && String(existing.createdBy) !== String(user.id)) {
    throw new ApiError(403, 'You can only delete your own content.');
  }
  await existing.deleteOne();
  return { deleted: true };
}

export async function dashboardCounts() {
  const [content, orders, products, subscribers, campaigns, donations, comments, pages, signups, countries, traffic] = await Promise.all([
    Content.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments(),
    NewsletterSubscriber.countDocuments({ status: 'active' }),
    DonationCampaign.countDocuments({ active: true }),
    Donation.countDocuments(),
    Comment.countDocuments({ status: 'pending' }),
    Page.countDocuments(),
    User.countDocuments({ status: { $ne: 'deleted' } }),
    User.aggregate([
      { $match: { status: { $ne: 'deleted' } } },
      { $group: { _id: { $ifNull: ['$signupCountry', ''] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    trafficSeries(14),
  ]);
  return {
    content,
    orders,
    products,
    subscribers,
    campaigns,
    donations,
    comments,
    pages,
    signups,
    signupCountries: countries.map((row) => ({ code: row._id || '', count: row.count })),
    traffic,
  };
}

export async function updateSettings(body) {
  const settings = await SiteSetting.findOneAndUpdate(
    { key: 'public' },
    {
      key: 'public',
      siteName: body.siteName || 'ضیاء چترالی',
      tagline: body.tagline || '',
      logoUrl: '',
      footerText: body.footerText || '',
      contact: body.contact || {},
      social: body.social || [],
      defaultLanguage: body.defaultLanguage || 'en',
    },
    { upsert: true, new: true },
  );
  return clean(settings);
}

export async function listCommentsAdmin(query) {
  const { page, limit, skip } = getPaging(query, 20);
  const filter = {};
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    Comment.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Comment.countDocuments(filter),
  ]);
  return { data: items.map(presentComment), meta: pageMeta(page, limit, total) };
}

export async function moderateComment(id, status) {
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw new ApiError(422, 'Invalid comment status.');
  }
  const comment = await Comment.findByIdAndUpdate(id, { status }, { new: true }).populate('user', 'name email');
  if (!comment) throw new ApiError(404, 'Comment not found.');
  return presentComment(comment);
}

export async function listOrdersAdmin(query) {
  const { page, limit, skip } = getPaging(query, 20);
  const filter = {};
  if (query.status) filter.status = query.status;
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  return { data: items.map(presentOrder), meta: pageMeta(page, limit, total) };
}

export async function updateOrderStatus(id, status) {
  if (!['pending_payment', 'paid', 'cancelled'].includes(status)) {
    throw new ApiError(422, 'Invalid order status.');
  }
  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, 'Order not found.');
  const previous = order.status;
  const codOpen = order.payment?.provider === 'cod' && previous === 'pending_payment';
  if (status === 'paid' && previous !== 'paid' && order.payment?.provider !== 'cod') {
    for (const item of order.items) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
    }
  }
  if (status === 'paid' && previous !== 'paid') {
    if (!order.payment) order.payment = { provider: order.method === 'cod' ? 'cod' : null, status: 'recorded_manually' };
    else order.payment.status = 'recorded_manually';
  }
  if ((previous === 'paid' && status !== 'paid') || (codOpen && status === 'cancelled')) {
    for (const item of order.items) {
      await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
    }
  }
  order.status = status;
  await order.save();
  return presentOrder(order);
}

export async function listDonationsAdmin(query) {
  const { page, limit, skip } = getPaging(query, 20);
  const [items, total] = await Promise.all([
    Donation.find().populate('campaign', 'title slug').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Donation.countDocuments(),
  ]);
  return {
    data: items.map((item) => ({
      id: item._id.toString(),
      amountCents: item.amountCents,
      currency: item.currency,
      donorName: item.anonymous ? 'Anonymous' : item.donorName,
      donorEmail: item.donorEmail,
      phone: item.phone || '',
      method: item.method || '',
      proofUrl: item.proofUrl || '',
      reference: item.reference || '',
      status: item.status,
      payment: item.payment,
      createdAt: item.createdAt,
      campaign: item.campaign ? { id: item.campaign._id.toString(), title: item.campaign.title, slug: item.campaign.slug } : null,
    })),
    meta: pageMeta(page, limit, total),
  };
}

export async function deleteDonation(id) {
  const donation = await Donation.findById(id);
  if (!donation) throw new ApiError(404, 'Donation not found.');
  await donation.deleteOne();
  return { deleted: true };
}
