import { env } from './config/env.js';
import { contentEnum, resolveContentKey } from './config/catalog.js';
import { blankTranslations, previewStore } from './previewCatalog.js';
import { checkPreviewPassword, dropPreviewToken, dropPreviewUser, hashPreviewPassword, issuePreviewAccess, issuePreviewSession, userIdFromToken } from './previewSession.js';
import { announceContent, announceProduct, devLink, sendPasswordReset, sendVerification, sendWelcome, verificationDelivery } from './services/mailService.js';
import { createOpaqueToken, hashToken } from './utils/security.js';
import { cleanHtml } from './utils/sanitize.js';
import { saveImageUpload } from './uploads.js';
import { lookupCountry } from './services/geo.js';
import { trafficSeries } from './services/trafficService.js';

const LANGS = ['en', 'ur', 'ar'];
const PREVIEW_USER = {
  id: 'u-admin',
  name: 'Zia Chitrali',
  email: env.adminEmail,
  emailVerified: true,
  status: 'active',
  permissions: ['*'],
  role: { id: 'role-admin', name: 'Administrator', slug: 'super_admin' },
  settings: {},
};

const TEXT = {
  content: ['title', 'excerpt', 'body'],
  pages: ['title', 'body'],
  products: ['title', 'description'],
  campaigns: ['title', 'summary', 'description'],
  shows: ['title', 'description'],
  episodes: ['title', 'description'],
  categories: ['name', 'description'],
  tags: ['name'],
  authors: ['name', 'bio', 'roleTitle'],
};

function slugify(value) {
  const slug = String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug || `item-${Date.now()}`;
}

function fail(res, status, message) {
  res.status(status).json({ success: false, message });
  return true;
}

function ok(res, data, meta, status = 200) {
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });
  return true;
}

function pageOf(items, query) {
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const page = Math.max(1, Number(query.page) || 1);
  const needle = String(query.q || '').toLowerCase();
  const filtered = needle
    ? items.filter((item) => JSON.stringify(item).toLowerCase().includes(needle))
    : items;
  const start = (page - 1) * limit;
  return {
    data: filtered.slice(start, start + limit),
    meta: {
      page,
      limit,
      total: filtered.length,
      pages: Math.max(1, Math.ceil(filtered.length / limit) || 1),
    },
  };
}

function readTranslations(body, fields, existing) {
  const translations = blankTranslations(fields, existing || {});
  LANGS.forEach((lang) => {
    fields.forEach((field) => {
      const value = body.translations?.[lang]?.[field];
      if (typeof value === 'string') translations[lang][field] = value;
    });
  });
  return translations;
}

function primaryText(translations, field) {
  const lang = LANGS.find((code) => String(translations[code]?.[field] || '').trim());
  return { lang: lang || 'en', value: lang ? translations[lang][field].trim() : '' };
}

function cleanBodies(translations) {
  LANGS.forEach((lang) => {
    if (typeof translations[lang]?.body === 'string') translations[lang].body = cleanHtml(translations[lang].body);
  });
}

function applyText(item, translations, fields) {
  const lead = fields.find((field) => primaryText(translations, field).value) || fields[0];
  const primary = primaryText(translations, lead);
  item.translations = translations;
  item.language = primary.lang;
  item.direction = primary.lang === 'en' ? 'ltr' : 'rtl';
  fields.forEach((field) => {
    const written = String(translations[primary.lang]?.[field] || '').trim();
    const english = String(translations.en?.[field] || '').trim();
    item[field] = written || english || item[field] || '';
  });
}

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function sessionCookie() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: SESSION_MS,
  };
}

function readerRole() {
  return { id: 'role-reader', name: 'Reader', slug: 'reader' };
}

function publicPreviewUser(user) {
  if (!user) return null;
  if (user.id === 'u-admin') {
    return { ...PREVIEW_USER, name: user.name || PREVIEW_USER.name, email: user.email || PREVIEW_USER.email };
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: Boolean(user.emailVerified),
    status: user.status || 'active',
    permissions: user.permissions || [],
    role: user.role || readerRole(),
    profile: user.profile || {},
    settings: user.settings || {},
  };
}

function userById(id) {
  return previewStore.users.find((item) => item.id === id) || null;
}

function bearerToken(req) {
  const header = req.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

export function previewActor(req) {
  const id = userIdFromToken(bearerToken(req));
  if (!id) return null;
  return publicPreviewUser(userById(id) || (id === 'u-admin' ? PREVIEW_USER : null));
}

function setSession(res, user, extra = {}) {
  const session = issuePreviewSession(user.id);
  res.cookie('ieds_refresh', session.refresh, sessionCookie());
  return ok(res, { accessToken: session.access, user: publicPreviewUser(user), ...extra });
}

function guard(req, res) {
  const id = userIdFromToken(bearerToken(req));
  if (id === 'u-admin') return false;
  return fail(res, 401, 'Sign in required.');
}

async function handleAuth(req, res) {
  if (req.method === 'POST' && req.path === '/auth/register') {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (name.length < 2) return fail(res, 422, 'Enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 422, 'Enter a valid email.');
    if (password.length < 8) return fail(res, 422, 'Use at least 8 characters.');
    if (previewStore.users.some((item) => item.email === email) || email === env.adminEmail.toLowerCase()) {
      return fail(res, 409, 'An account with this email already exists.');
    }
    const user = {
      id: `u-${Date.now()}`,
      name,
      email,
      status: 'active',
      passwordHash: await hashPreviewPassword(password),
      emailVerified: false,
      role: readerRole(),
      permissions: [],
      profile: {},
      settings: {},
      signupCountry: await lookupCountry(req),
    };
    previewStore.users.push(user);
    const verifyUrl = `${env.publicSiteUrl}/verify-email?token=${issuePreviewToken('emailTokens', user.id, 24)}`;
    const delivery = await deliverPreviewVerification(() => sendWelcome({ name: user.name, email: user.email, verifyUrl }), verifyUrl);
    return setSession(res, user, delivery);
  }
  if (req.method === 'POST' && req.path === '/auth/login') {
    const email = String(req.body?.email || '').toLowerCase();
    const password = String(req.body?.password || '');
    const expected = env.adminPassword || 'ChangeMe123!';
    if (email === env.adminEmail.toLowerCase()) {
      const admin = userById('u-admin') || PREVIEW_USER;
      const ok = admin.passwordHash
        ? await checkPreviewPassword(admin.passwordHash, password)
        : password === expected;
      if (!ok) return fail(res, 401, 'Email or password is incorrect.');
      return setSession(res, admin);
    }
    const user = previewStore.users.find((item) => item.email === email && item.status !== 'disabled');
    if (!user || !(await checkPreviewPassword(user.passwordHash, password))) {
      return fail(res, 401, 'Email or password is incorrect.');
    }
    return setSession(res, user);
  }
  if (req.method === 'POST' && req.path === '/auth/refresh') {
    const token = req.cookies?.ieds_refresh;
    const id = userIdFromToken(token);
    const user = id ? (userById(id) || (id === 'u-admin' ? PREVIEW_USER : null)) : null;
    if (!user) return fail(res, 401, 'Sign in required.');
    const access = token === 'preview' ? 'preview' : issuePreviewAccess(user.id);
    return ok(res, { accessToken: access, user: publicPreviewUser(user) });
  }
  if (req.method === 'POST' && (req.path === '/auth/logout' || req.path === '/auth/logout-all')) {
    dropPreviewToken(req.cookies?.ieds_refresh);
    res.clearCookie('ieds_refresh', { path: '/api/auth' });
    return ok(res, { ok: true });
  }
  if (req.method === 'POST' && req.path === '/auth/forgot-password') {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 422, 'Enter a valid email.');
    const user = previewStore.users.find((item) => item.email === email && item.status !== 'disabled');
    let devResetUrl;
    if (user) {
      const resetUrl = `${env.publicSiteUrl}/reset-password?token=${issuePreviewToken('passwordResets', user.id, 1)}`;
      await sendPasswordReset({ name: user.name, email: user.email, resetUrl });
      devResetUrl = devLink(resetUrl);
    }
    return ok(res, {
      message: 'If an account exists for that email, we sent a reset link.',
      ...(devResetUrl ? { devResetUrl } : {}),
    });
  }
  if (req.method === 'POST' && req.path === '/auth/reset-password') {
    const password = String(req.body?.password || '');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return fail(res, 422, 'Use at least 8 characters, with a letter and a number.');
    }
    const record = takePreviewToken('passwordResets', req.body?.token);
    const user = record ? userById(record.userId) : null;
    if (!user) return fail(res, 400, 'This reset link is invalid or expired.');
    user.passwordHash = await hashPreviewPassword(password);
    dropPreviewUser(user.id);
    return ok(res, { reset: true });
  }
  if (req.method === 'POST' && req.path === '/auth/verify-email') {
    const record = findPreviewToken('emailTokens', req.body?.token);
    const user = record ? userById(record.userId) : null;
    if (!user || user.status === 'disabled') return fail(res, 400, 'This verification link is invalid or expired.');
    user.emailVerified = true;
    record.usedAt = Date.now();
    return ok(res, { verified: true });
  }
  if (req.method === 'POST' && req.path === '/auth/resend-verification') {
    const id = userIdFromToken(bearerToken(req));
    const user = id ? (userById(id) || (id === 'u-admin' ? PREVIEW_USER : null)) : null;
    if (!user) return fail(res, 401, 'Sign in required.');
    if (user.emailVerified) return ok(res, { alreadyVerified: true });
    const verifyUrl = `${env.publicSiteUrl}/verify-email?token=${issuePreviewToken('emailTokens', user.id, 24)}`;
    const delivery = await deliverPreviewVerification(() => sendVerification({ name: user.name, email: user.email, verifyUrl }), verifyUrl);
    return ok(res, delivery);
  }
  return false;
}

function issuePreviewToken(bucket, userId, hours) {
  const raw = createOpaqueToken();
  const now = Date.now();
  previewStore[bucket] = previewStore[bucket].filter((item) => item.userId !== userId && item.expiresAt > now);
  previewStore[bucket].push({
    userId,
    tokenHash: hashToken(raw),
    expiresAt: now + hours * 60 * 60 * 1000,
  });
  return raw;
}

async function deliverPreviewVerification(send, url) {
  try {
    return verificationDelivery(await send(), url);
  } catch (error) {
    console.error('[mail]', error.message);
    return verificationDelivery({ status: 'failed' }, url);
  }
}

function findPreviewToken(bucket, raw) {
  const tokenHash = hashToken(String(raw || ''));
  const record = previewStore[bucket].find((item) => item.tokenHash === tokenHash);
  if (!record || record.expiresAt < Date.now()) return null;
  return record;
}

function takePreviewToken(bucket, raw) {
  const tokenHash = hashToken(String(raw || ''));
  const index = previewStore[bucket].findIndex((item) => item.tokenHash === tokenHash);
  if (index === -1) return null;
  const [record] = previewStore[bucket].splice(index, 1);
  if (record.expiresAt < Date.now()) return null;
  return record;
}

function contentForAdmin(item) {
  const copy = {
    ...item,
    type: contentEnum(resolveContentKey(item.type) || item.type) || item.type,
    translations: blankTranslations(TEXT.content, item),
    author: item.author?.id || item.author || '',
    category: item.category?.id || item.category || '',
    tags: (item.tags || []).map((tag) => tag.id || tag),
  };
  return copy;
}

function saveContent(body, existing) {
  const translations = readTranslations(body, TEXT.content, existing);
  cleanBodies(translations);
  const title = primaryText(translations, 'title');
  if (!title.value) return { error: 'Add a title in at least one language.' };
  const key = resolveContentKey(body.type || existing?.type || 'article');
  if (!key) return { error: 'Choose a content type.' };
  const slug = String(body.slug || existing?.slug || slugify(translations.en.title || title.value)).trim();
  const clash = previewStore.content.find((item) => item.type === key && item.slug === slug && item.id !== existing?.id);
  if (clash) return { error: 'A piece with this slug already exists.' };
  const author = previewStore.authors.find((item) => item.id === (body.author || '')) || null;
  const category = previewStore.categories.find((item) => item.id === (body.category || '')) || null;
  const tagIds = Array.isArray(body.tags) ? body.tags : [];
  const next = {
    ...(existing || {}),
    id: existing?.id || `c-${Date.now()}`,
    type: key,
    slug,
    status: body.status || 'draft',
    featured: Boolean(body.featured),
    breaking: Boolean(body.breaking),
    coverImage: body.coverImage?.url ? { url: body.coverImage.url, alt: body.coverImage.alt || title.value } : null,
    author,
    category,
    tags: tagIds.map((id) => previewStore.tags.find((tag) => tag.id === id)).filter(Boolean),
    publisher: body.publisher || '',
    pages: body.pages ? Number(body.pages) : null,
    isbn: body.isbn || '',
    priceCents: body.priceCents ? Number(body.priceCents) : null,
    currency: 'PKR',
    videoUrl: body.videoUrl || '',
    duration: body.duration ? Number(body.duration) : null,
    publishedAt: body.status === 'published' ? (existing?.publishedAt || new Date().toISOString()) : null,
    readingTime: existing?.readingTime || 6,
    viewCount: existing?.viewCount || 0,
    likeCount: existing?.likeCount || 0,
  };
  applyText(next, translations, TEXT.content);
  if (!next.body) next.body = next.excerpt ? `<p>${next.excerpt}</p>` : '';
  return { item: next };
}

function parseColors(value) {
  if (Array.isArray(value)) return value.filter((item) => item?.name).map((item) => ({ name: item.name, hex: item.hex || '#171410' }));
  return [];
}

function saveProduct(body, existing) {
  const translations = readTranslations(body, TEXT.products, existing);
  const title = primaryText(translations, 'title');
  if (!title.value) return { error: 'Add a title in at least one language.' };
  const slug = String(body.slug || existing?.slug || slugify(translations.en.title || title.value)).trim();
  const clash = previewStore.products.find((item) => item.slug === slug && item.id !== existing?.id);
  if (clash) return { error: 'A product with this slug already exists.' };
  const images = Array.isArray(body.images) ? body.images.filter((item) => item?.url) : [];
  const next = {
    ...(existing || {}),
    id: existing?.id || `pr-${Date.now()}`,
    slug,
    priceCents: Math.max(0, Number(body.priceCents || 0)),
    currency: body.currency || 'PKR',
    stock: Math.max(0, Number(body.stock || 0)),
    sku: body.sku || '',
    status: body.status || 'draft',
    category: body.category || '',
    featured: Boolean(body.featured),
    colors: parseColors(body.colors),
    sizes: Array.isArray(body.sizes) ? body.sizes.map(String).filter(Boolean) : [],
    images,
  };
  applyText(next, translations, TEXT.products);
  return { item: next };
}

function saveSimple(list, body, existing, fields, extra) {
  const translations = readTranslations(body, fields, existing);
  const lead = primaryText(translations, fields[0]);
  if (!lead.value && fields[0] !== 'email') return { error: 'Add a name or title in at least one language.' };
  const next = { ...(existing || {}), id: existing?.id || `adm-${Date.now()}`, ...extra(body, existing, translations, lead) };
  applyText(next, translations, fields);
  const index = list.findIndex((item) => item.id === next.id);
  if (index === -1) list.unshift(next);
  else list[index] = next;
  return { item: next };
}

function put(list, item) {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index === -1) list.unshift(item);
  else list[index] = item;
}

async function handleAdmin(req, res) {
  if (guard(req, res)) return true;
  const path = req.path;
  const { method } = req;
  const query = req.query || {};

  if (method === 'POST' && path === '/admin/uploads') {
    const saved = saveImageUpload(req.body?.dataUrl);
    if (saved.error) return fail(res, 422, saved.error);
    previewStore.media.unshift({
      id: `m-${Date.now()}`,
      url: saved.url,
      filename: saved.filename,
      alt: '',
      mimeType: 'image',
      createdAt: new Date().toISOString(),
    });
    return ok(res, { url: saved.url }, null, 201);
  }

  if (method === 'GET' && path === '/admin/dashboard') {
    const people = previewStore.users.filter((item) => item.status !== 'deleted');
    const grouped = new Map();
    people.forEach((item) => {
      const code = item.signupCountry || '';
      grouped.set(code, (grouped.get(code) || 0) + 1);
    });
    return trafficSeries(14).then((traffic) => ok(res, {
      content: previewStore.content.length,
      products: previewStore.products.length,
      orders: previewStore.orders.size,
      donations: previewStore.donations.length,
      comments: previewStore.comments.filter((item) => item.status === 'pending').length,
      subscribers: previewStore.subscribers.length,
      campaigns: previewStore.campaigns.length,
      pages: Object.keys(previewStore.pages).length,
      signups: people.length,
      signupCountries: [...grouped.entries()]
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count),
      traffic,
    }));
  }

  if (path === '/admin/settings') {
    if (method === 'GET') return ok(res, previewStore.siteSettings);
    if (method === 'PUT') {
      const body = req.body || {};
      Object.assign(previewStore.siteSettings, {
        siteName: body.siteName ?? previewStore.siteSettings.siteName,
        tagline: body.tagline ?? previewStore.siteSettings.tagline,
        logoUrl: '',
        footerText: body.footerText ?? previewStore.siteSettings.footerText,
        defaultLanguage: body.defaultLanguage || previewStore.siteSettings.defaultLanguage,
        contact: {
          email: body.contact?.email ?? previewStore.siteSettings.contact.email,
          phone: body.contact?.phone ?? previewStore.siteSettings.contact.phone,
          address: body.contact?.address ?? previewStore.siteSettings.contact.address,
        },
        social: Array.isArray(body.social) ? body.social : previewStore.siteSettings.social,
        translations: body.translations || previewStore.siteSettings.translations,
      });
      const tagline = previewStore.siteSettings.translations?.en?.tagline;
      const footer = previewStore.siteSettings.translations?.en?.footerText;
      if (tagline) previewStore.siteSettings.tagline = tagline;
      if (footer) previewStore.siteSettings.footerText = footer;
      return ok(res, previewStore.siteSettings);
    }
  }

  if (path === '/admin/comments' && method === 'GET') {
    const status = query.status;
    const list = previewStore.comments.filter((item) => !status || item.status === status);
    const paged = pageOf(list, query);
    return ok(res, paged.data, paged.meta);
  }
  const commentPatch = path.match(/^\/admin\/comments\/([^/]+)$/);
  if (commentPatch && method === 'PATCH') {
    const found = previewStore.comments.find((item) => item.id === commentPatch[1]);
    if (!found) return fail(res, 404, 'Comment not found.');
    if (!['pending', 'approved', 'rejected'].includes(req.body?.status)) return fail(res, 422, 'Choose a valid status.');
    found.status = req.body.status;
    return ok(res, found);
  }
  if (commentPatch && method === 'DELETE') {
    const index = previewStore.comments.findIndex((item) => item.id === commentPatch[1]);
    if (index === -1) return fail(res, 404, 'Comment not found.');
    previewStore.comments.splice(index, 1);
    return ok(res, { deleted: true });
  }

  if (path === '/admin/orders' && method === 'GET') {
    const paged = pageOf([...previewStore.orders.values()].reverse(), query);
    return ok(res, paged.data, paged.meta);
  }
  const orderPatch = path.match(/^\/admin\/orders\/([^/]+)$/);
  if (orderPatch && method === 'PATCH') {
    const found = previewStore.orders.get(orderPatch[1]);
    if (!found) return fail(res, 404, 'Order not found.');
    if (!['pending_payment', 'paid', 'cancelled'].includes(req.body?.status)) return fail(res, 422, 'Choose a valid status.');
    found.status = req.body.status;
    found.payment = { provider: null, status: 'not_configured' };
    return ok(res, found);
  }

  if (path === '/admin/messages' && method === 'GET') {
    return ok(res, previewStore.messages, { page: 1, limit: 50, total: previewStore.messages.length, pages: 1 });
  }
  const messageDelete = path.match(/^\/admin\/messages\/([^/]+)$/);
  if (messageDelete && method === 'DELETE') {
    const index = previewStore.messages.findIndex((item) => item.id === messageDelete[1]);
    if (index === -1) return fail(res, 404, 'Message not found.');
    previewStore.messages.splice(index, 1);
    return ok(res, { deleted: true });
  }

  if (path === '/admin/donations' && method === 'GET') {
    const paged = pageOf(previewStore.donations, query);
    return ok(res, paged.data, paged.meta);
  }
  const donationDelete = path.match(/^\/admin\/donations\/([^/]+)$/);
  if (donationDelete && method === 'DELETE') {
    const index = previewStore.donations.findIndex((item) => item.id === donationDelete[1]);
    if (index === -1) return fail(res, 404, 'Donation not found.');
    previewStore.donations.splice(index, 1);
    return ok(res, { deleted: true });
  }

  const resourcePath = path.match(/^\/admin\/([^/]+)(?:\/([^/]+))?$/);
  if (!resourcePath) return fail(res, 404, 'Not found.');
  const name = resourcePath[1];
  const id = resourcePath[2] ? decodeURIComponent(resourcePath[2]) : '';

  if (name === 'menus') {
    const records = ['header', 'footer', 'mobile'].map((location) => ({
      id: location,
      location,
      items: previewStore.menus[location] || [],
    }));
    if (method === 'GET') return ok(res, records, { page: 1, limit: 10, total: records.length, pages: 1 });
    const location = req.body?.location;
    if (!['header', 'footer', 'mobile'].includes(location)) return fail(res, 422, 'Menu location is invalid.');
    previewStore.menus[location] = Array.isArray(req.body.items) ? req.body.items : [];
    return ok(res, { id: location, location, items: previewStore.menus[location] }, null, method === 'POST' ? 201 : 200);
  }

  if (name === 'pages') {
    const list = Object.values(previewStore.pages).map((item) => ({
      ...item,
      translations: blankTranslations(TEXT.pages, item),
    }));
    if (method === 'GET') {
      const paged = pageOf(list, query);
      return ok(res, paged.data, paged.meta);
    }
    if (method === 'DELETE') {
      const found = Object.values(previewStore.pages).find((item) => item.id === id);
      if (!found) return fail(res, 404, 'Page not found.');
      delete previewStore.pages[found.slug];
      return ok(res, { deleted: true });
    }
    const existing = Object.values(previewStore.pages).find((item) => item.id === id);
    const translations = readTranslations(req.body || {}, TEXT.pages, existing);
    cleanBodies(translations);
    const title = primaryText(translations, 'title');
    if (!title.value) return fail(res, 422, 'Add a title in at least one language.');
    const slug = String(req.body.slug || existing?.slug || slugify(translations.en.title || title.value)).trim();
    if (existing && existing.slug !== slug) delete previewStore.pages[existing.slug];
    const next = {
      ...(existing || {}),
      id: existing?.id || `pg-${Date.now()}`,
      slug,
      status: req.body.status || 'draft',
      seo: req.body.seo || existing?.seo || { title: '', description: '' },
    };
    applyText(next, translations, TEXT.pages);
    previewStore.pages[slug] = next;
    return ok(res, { ...next, translations }, null, existing ? 200 : 201);
  }

  if (name === 'content') {
    if (method === 'GET') {
      const paged = pageOf(previewStore.content.map(contentForAdmin), query);
      return ok(res, paged.data, paged.meta);
    }
    if (method === 'DELETE') {
      const index = previewStore.content.findIndex((item) => item.id === id);
      if (index === -1) return fail(res, 404, 'Content not found.');
      previewStore.content.splice(index, 1);
      return ok(res, { deleted: true });
    }
    const existing = previewStore.content.find((item) => item.id === id);
    if (id && !existing) return fail(res, 404, 'Content not found.');
    const saved = saveContent(req.body || {}, existing);
    if (saved.error) return fail(res, 422, saved.error);
    const wasPublished = existing?.status === 'published';
    put(previewStore.content, saved.item);
    if (saved.item.status === 'published' && !wasPublished) {
      try {
        await announceContent(saved.item);
      } catch (error) {
        console.error('[mail]', error.message);
      }
    }
    return ok(res, contentForAdmin(saved.item), null, existing ? 200 : 201);
  }

  if (name === 'products') {
    if (method === 'GET') {
      const rows = previewStore.products.map((item) => ({ ...item, translations: blankTranslations(TEXT.products, item) }));
      const paged = pageOf(rows, query);
      return ok(res, paged.data, paged.meta);
    }
    if (method === 'DELETE') {
      const index = previewStore.products.findIndex((item) => item.id === id);
      if (index === -1) return fail(res, 404, 'Product not found.');
      previewStore.products.splice(index, 1);
      return ok(res, { deleted: true });
    }
    const existing = previewStore.products.find((item) => item.id === id);
    if (id && !existing) return fail(res, 404, 'Product not found.');
    const saved = saveProduct(req.body || {}, existing);
    if (saved.error) return fail(res, 422, saved.error);
    const wasActive = existing?.status === 'active';
    put(previewStore.products, saved.item);
    if (saved.item.status === 'active' && !wasActive) {
      try {
        await announceProduct(saved.item);
      } catch (error) {
        console.error('[mail]', error.message);
      }
    }
    return ok(res, saved.item, null, existing ? 200 : 201);
  }

  const lists = {
    categories: previewStore.categories,
    tags: previewStore.tags,
    authors: previewStore.authors,
    campaigns: previewStore.campaigns,
    shows: previewStore.shows,
    episodes: previewStore.episodes,
    coupons: previewStore.coupons,
    media: previewStore.media,
    subscribers: previewStore.subscribers,
    users: previewStore.users,
    roles: previewStore.roles,
  };
  const list = lists[name];
  if (!list) return fail(res, 404, 'Resource not found.');

  if (method === 'GET') {
    const fields = TEXT[name];
    const rows = list.map((item) => (fields ? { ...item, translations: blankTranslations(fields, item) } : item));
    const paged = pageOf(rows, query);
    return ok(res, paged.data, paged.meta);
  }
  if (method === 'DELETE') {
    if (name === 'users' && id === 'u-admin') return fail(res, 403, 'The preview administrator cannot be deleted.');
    if (name === 'roles' && id === 'role-admin') return fail(res, 403, 'The administrator role cannot be deleted.');
    const index = list.findIndex((item) => item.id === id);
    if (index === -1) return fail(res, 404, 'Record not found.');
    list.splice(index, 1);
    return ok(res, { deleted: true });
  }

  const existing = list.find((item) => item.id === id);
  if (id && !existing) return fail(res, 404, 'Record not found.');
  const body = req.body || {};
  if (name === 'episodes' && !body.show && !existing?.show) return fail(res, 422, 'Choose a show.');

  if (TEXT[name]) {
    const saved = saveSimple(list, body, existing, TEXT[name], (input, current, translations, lead) => {
      const slug = String(input.slug || current?.slug || slugify(translations.en[TEXT[name][0]] || lead.value)).trim();
      if (name === 'authors') {
        return {
          slug,
          featured: Boolean(input.featured),
          image: input.image?.url ? input.image : { url: '', alt: lead.value },
          social: [],
        };
      }
      if (name === 'categories') {
        return {
          slug,
          contentTypes: Array.isArray(input.contentTypes) ? input.contentTypes : [],
          count: current?.count || 0,
        };
      }
      if (name === 'tags') return { slug, count: current?.count || 0 };
      if (name === 'campaigns') {
        return {
          slug,
          goalAmountCents: Number(input.goalAmountCents || 0),
          raisedAmountCents: current?.raisedAmountCents || 0,
          currency: input.currency || 'PKR',
          active: input.active !== false,
          featured: Boolean(input.featured),
          coverImage: input.coverImage?.url ? input.coverImage : current?.coverImage || null,
        };
      }
      if (name === 'shows') {
        return {
          slug,
          status: input.status || 'draft',
          coverImage: input.coverImage?.url ? input.coverImage : null,
        };
      }
      return {
        show: input.show || current?.show || '',
        slug,
        audioUrl: input.audioUrl || '',
        duration: input.duration ? Number(input.duration) : null,
        status: input.status || 'draft',
        coverImage: input.coverImage || null,
        publishedAt: input.status === 'published' ? (current?.publishedAt || new Date().toISOString()) : null,
        likeCount: current?.likeCount || 0,
      };
    });
    if (saved.error) return fail(res, 422, saved.error);
    return ok(res, saved.item, null, existing ? 200 : 201);
  }

  if (name === 'coupons') {
    if (!body.code) return fail(res, 422, 'A coupon code is required.');
    const next = {
      id: existing?.id || `cp-${Date.now()}`,
      code: String(body.code).toUpperCase(),
      type: body.type === 'fixed' ? 'fixed' : 'percent',
      amount: Number(body.amount || 0),
      minSubtotalCents: Number(body.minSubtotalCents || 0),
      active: body.active !== false,
    };
    put(list, next);
    return ok(res, next, null, existing ? 200 : 201);
  }
  if (name === 'media') {
    if (!body.url) return fail(res, 422, 'A media URL is required.');
    const next = {
      id: existing?.id || `md-${Date.now()}`,
      url: body.url,
      alt: body.alt || '',
      filename: body.filename || '',
      type: body.type || 'image',
    };
    put(list, next);
    return ok(res, next, null, existing ? 200 : 201);
  }
  if (name === 'subscribers') {
    if (!body.email) return fail(res, 422, 'An email is required.');
    const next = {
      id: existing?.id || `sub-${Date.now()}`,
      email: String(body.email).toLowerCase(),
      name: body.name || '',
      status: body.status === 'unsubscribed' ? 'unsubscribed' : 'active',
    };
    put(list, next);
    return ok(res, next, null, existing ? 200 : 201);
  }
  if (name === 'users') {
    if (!body.name || !body.email) return fail(res, 422, 'Name and email are required.');
    const role = previewStore.roles.find((item) => item.id === body.role) || existing?.role || null;
    const next = {
      id: existing?.id || `u-${Date.now()}`,
      name: body.name,
      email: String(body.email).toLowerCase(),
      status: body.status === 'disabled' ? 'disabled' : 'active',
      role: role ? { id: role.id, name: role.name, slug: role.slug } : null,
    };
    put(list, next);
    return ok(res, next, null, existing ? 200 : 201);
  }
  if (name === 'roles') {
    if (existing?.slug === 'super_admin') {
      existing.description = body.description ?? existing.description;
      return ok(res, existing);
    }
    if (!body.name) return fail(res, 422, 'A role name is required.');
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];
    const next = {
      id: existing?.id || `role-${Date.now()}`,
      name: body.name,
      slug: existing?.slug || slugify(body.slug || body.name),
      description: body.description || '',
      permissions,
    };
    put(list, next);
    return ok(res, next, null, existing ? 200 : 201);
  }
  return fail(res, 404, 'Resource not found.');
}

export function handlePreviewAdmin(req, res) {
  const result = req.path.startsWith('/auth/')
    ? handleAuth(req, res)
    : req.path.startsWith('/admin')
      ? handleAdmin(req, res)
      : false;
  Promise.resolve(result).catch((error) => {
    console.error(error);
    if (!res.headersSent) fail(res, 500, 'The desk could not finish that request.');
  });
  return true;
}
