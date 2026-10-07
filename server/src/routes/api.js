import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, query } from 'express-validator';
import { CONTENT_TYPES } from '../config/catalog.js';
import { ApiError, asyncHandler, send } from '../utils/http.js';
import { saveImageUpload } from '../uploads.js';
import { hasPermission, optionalAuth, requireAuth, requirePermission } from '../middleware/common.js';
import { validate } from '../middleware/validate.js';
import {
  clearRefreshCookie, loginUser, logoutAll, logoutSession, publicUser, REFRESH_COOKIE,
  refreshSession, registerUser, requestPasswordReset, resendVerification, resetPassword,
  setRefreshCookie, verifyEmail,
} from '../services/authService.js';
import { getAuthor, getCategory, getContent, getTag, listAuthors, listCategories, listContent, listTags, searchContent } from '../services/contentService.js';
import { getEpisode, getShow, listShows } from '../services/discoveryService.js';
import { createComment, listBookmarks, listComments, listLikes, listReading, recordShare, recordView, syncReading, toggleBookmark, toggleLike, upsertReading } from '../services/engagementService.js';
import { createDonation, getCampaign, getMenu, getPublishedPage, listCampaigns, publicSettings, subscribeNewsletter } from '../services/cmsService.js';
import { createContactMessage, deleteContactMessage, listContactMessages } from '../services/contactService.js';
import { createOrder, getOrderForViewer, getPublicProduct, listMyOrders, listPublicProducts, quoteCart } from '../services/shopService.js';
import { openCheckout, publicGift, returnLocation, settleNotice } from '../services/payfast.js';
import {
  createResource, dashboardCounts, deleteDonation, deleteResource, getResource, listCommentsAdmin, listDonationsAdmin,
  listOrdersAdmin, listResource, moderateComment, permissionFor, updateOrderStatus, updateResource, updateSettings,
} from '../services/adminService.js';
import { User } from '../models.js';
import { countryFromHeaders, lookupCountry } from '../services/geo.js';
import { recordPageView } from '../services/trafficService.js';

const router = Router();
const limitBody = { success: false, message: 'Too many attempts. Please wait and try again.' };
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false, message: limitBody });
const writeLimit = rateLimit({ windowMs: 10 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false, message: limitBody });

const passwordRule = body('password')
  .isLength({ min: 8 }).withMessage('Use at least 8 characters.')
  .matches(/[A-Za-z]/).withMessage('Include a letter.')
  .matches(/[0-9]/).withMessage('Include a number.');

router.get('/health', (req, res) => {
  res.json({ success: true, data: { ok: true, service: 'ieds-api' } });
});

router.get('/content-types', (req, res) => {
  send(res, Object.entries(CONTENT_TYPES).map(([key, value]) => ({
    key,
    label: value.label,
    singular: value.singular,
    route: value.route,
  })));
});

router.post('/auth/register', authLimit, [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Enter your name.'),
  body('email').trim().isEmail().withMessage('Enter a valid email.').customSanitizer((value) => String(value).toLowerCase()),
  passwordRule,
], validate, asyncHandler(async (req, res) => {
  const result = await registerUser({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    country: await lookupCountry(req),
  });
  setRefreshCookie(res, result.refresh.raw, result.refresh.maxAgeMs);
  send(res, {
    accessToken: result.accessToken,
    user: result.user,
    verificationSent: result.verificationSent,
    ...(result.devVerifyUrl ? { devVerifyUrl: result.devVerifyUrl } : {}),
  }, null, 201);
}));

router.post('/auth/login', authLimit, [
  body('email').isEmail().withMessage('Enter a valid email.'),
  body('password').notEmpty().withMessage('Enter your password.'),
], validate, asyncHandler(async (req, res) => {
  const result = await loginUser({
    email: req.body.email,
    password: req.body.password,
    rememberMe: Boolean(req.body.rememberMe),
    userAgent: req.get('user-agent'),
    ip: req.ip,
    country: countryFromHeaders(req),
  });
  setRefreshCookie(res, result.refresh.raw, result.refresh.maxAgeMs);
  send(res, { accessToken: result.accessToken, user: result.user });
}));

router.post('/auth/refresh', asyncHandler(async (req, res) => {
  const result = await refreshSession({
    token: req.cookies[REFRESH_COOKIE],
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });
  setRefreshCookie(res, result.refresh.raw, result.refresh.maxAgeMs);
  send(res, { accessToken: result.accessToken, user: result.user });
}));

router.post('/auth/logout', asyncHandler(async (req, res) => {
  await logoutSession(req.cookies[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  send(res, { loggedOut: true });
}));

router.post('/auth/logout-all', requireAuth, asyncHandler(async (req, res) => {
  await logoutAll(req.user.id);
  clearRefreshCookie(res);
  send(res, { loggedOut: true });
}));

router.get('/auth/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('role');
  send(res, publicUser(user));
}));

router.post('/auth/forgot-password', authLimit, [
  body('email').isEmail().withMessage('Enter a valid email.'),
], validate, asyncHandler(async (req, res) => {
  const extra = await requestPasswordReset(req.body.email);
  send(res, { message: 'If an account exists for that email, a reset request has been created.', ...extra });
}));

router.post('/auth/reset-password', authLimit, [
  body('token').notEmpty().withMessage('Reset token is required.'),
  passwordRule,
], validate, asyncHandler(async (req, res) => {
  await resetPassword(req.body);
  send(res, { reset: true });
}));

router.post('/auth/verify-email', asyncHandler(async (req, res) => {
  await verifyEmail(req.body.token);
  send(res, { verified: true });
}));

router.post('/auth/resend-verification', requireAuth, asyncHandler(async (req, res) => {
  send(res, await resendVerification(req.user.id));
}));

async function saveAccount(userId, mutate) {
  const user = await User.findById(userId).populate('role');
  if (!user) throw new ApiError(404, 'Account not found.');
  await mutate(user);
  await user.save();
  await user.populate('role');
  return publicUser(user);
}

router.patch('/users/me', requireAuth, asyncHandler(async (req, res) => {
  const data = await saveAccount(req.user.id, (user) => {
    if (req.body.name) user.name = String(req.body.name).trim();
    user.profile = {
      ...user.profile?.toObject?.() || user.profile || {},
      bio: req.body.bio ?? user.profile?.bio ?? '',
      avatarUrl: user.profile?.avatarUrl ?? '',
      phone: req.body.phone ?? user.profile?.phone ?? '',
      location: req.body.location ?? user.profile?.location ?? '',
    };
  });
  send(res, data);
}));

router.post('/users/me/avatar', requireAuth, asyncHandler(async (req, res) => {
  let avatarUrl = '';
  if (!req.body?.remove) {
    const saved = saveImageUpload(req.body?.dataUrl);
    if (saved.error) throw new ApiError(422, saved.error);
    avatarUrl = saved.url;
  }
  const data = await saveAccount(req.user.id, (user) => {
    const current = user.profile?.toObject?.() || user.profile || {};
    user.profile = { ...current, avatarUrl };
  });
  send(res, data, null, req.body?.remove ? 200 : 201);
}));

router.patch('/users/me/settings', requireAuth, asyncHandler(async (req, res) => {
  const data = await saveAccount(req.user.id, (user) => {
    const current = user.settings?.toObject?.() || user.settings || {};
    user.settings = {
      ...current,
      theme: req.body.theme || current.theme || 'system',
      language: req.body.language || current.language || 'en',
      publicProfile: req.body.publicProfile ?? current.publicProfile ?? false,
      notifications: {
        ...(current.notifications || {}),
        ...(req.body.notifications || {}),
      },
    };
  });
  send(res, data);
}));

router.patch('/users/me/password', requireAuth, [
  body('currentPassword').notEmpty().withMessage('Enter your current password.'),
  passwordRule.custom((value, { req }) => {
    if (value === req.body.currentPassword) throw new Error('Choose a different password.');
    return true;
  }),
], validate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');
  const match = await user.comparePassword(req.body.currentPassword);
  if (!match) throw new ApiError(422, 'Current password is incorrect.', [{ field: 'currentPassword', message: 'Current password is incorrect.' }]);
  const bcrypt = (await import('bcryptjs')).default;
  user.password = await bcrypt.hash(req.body.password, 12);
  await user.save();
  await logoutAll(user._id);
  clearRefreshCookie(res);
  send(res, { updated: true });
}));

router.delete('/users/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');
  const match = await user.comparePassword(req.body.password || '');
  if (!match) throw new ApiError(422, 'Password confirmation failed.', [{ field: 'password', message: 'Password is incorrect.' }]);
  user.status = 'deleted';
  user.email = `deleted-${user._id}@invalid.local`;
  user.name = 'Deleted member';
  await user.save();
  await logoutAll(user._id);
  clearRefreshCookie(res);
  send(res, { deleted: true });
}));

router.get('/content', optionalAuth, asyncHandler(async (req, res) => {
  const result = await listContent(req.query);
  send(res, result.data, result.meta);
}));

router.get('/content/:type', asyncHandler(async (req, res) => {
  const result = await listContent(req.query, { typeKey: req.params.type });
  send(res, result.data, result.meta);
}));

router.get('/content/:type/:slug/related', asyncHandler(async (req, res) => {
  const result = await getContent(req.params.type, req.params.slug, null);
  send(res, result.related);
}));

router.get('/content/:type/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const result = await getContent(req.params.type, req.params.slug, req.user);
  send(res, result.content);
}));

router.get('/search', [
  query('q').trim().isLength({ min: 1, max: 120 }).withMessage('Enter a search term.'),
], validate, asyncHandler(async (req, res) => {
  const result = await searchContent(req.query);
  send(res, result.data, result.meta);
}));

router.get('/categories', asyncHandler(async (req, res) => {
  const result = await listCategories(req.query);
  send(res, result.data, result.meta);
}));

router.get('/categories/:slug', asyncHandler(async (req, res) => {
  send(res, await getCategory(req.params.slug));
}));

router.get('/tags', asyncHandler(async (req, res) => {
  const result = await listTags(req.query);
  send(res, result.data, result.meta);
}));

router.get('/tags/:slug', asyncHandler(async (req, res) => {
  send(res, await getTag(req.params.slug));
}));

router.get('/authors', asyncHandler(async (req, res) => {
  const result = await listAuthors(req.query);
  send(res, result.data, result.meta);
}));

router.get('/authors/:slug', asyncHandler(async (req, res) => {
  send(res, await getAuthor(req.params.slug));
}));

router.get('/comments', optionalAuth, asyncHandler(async (req, res) => {
  const result = await listComments(req.query, req.user);
  send(res, result.data, result.meta);
}));

router.post('/comments', requireAuth, writeLimit, [
  body('targetType').notEmpty(),
  body('targetId').notEmpty(),
  body('body').trim().isLength({ min: 2, max: 4000 }).withMessage('Write a comment of at least 2 characters.'),
], validate, asyncHandler(async (req, res) => {
  send(res, await createComment(req.user, req.body), null, 201);
}));

router.post('/engagement/likes', requireAuth, asyncHandler(async (req, res) => {
  send(res, await toggleLike(req.user.id, req.body));
}));

router.post('/engagement/bookmarks', requireAuth, asyncHandler(async (req, res) => {
  send(res, await toggleBookmark(req.user.id, req.body));
}));

router.get('/engagement/bookmarks', requireAuth, asyncHandler(async (req, res) => {
  const result = await listBookmarks(req.user.id, req.query);
  send(res, result.data, result.meta);
}));

router.get('/engagement/likes', requireAuth, asyncHandler(async (req, res) => {
  const result = await listLikes(req.user.id, req.query);
  send(res, result.data, result.meta);
}));

router.post('/metrics/page', asyncHandler(async (req, res) => {
  send(res, await recordPageView({ path: req.body?.path, ip: req.ip }));
}));

router.post('/engagement/views', asyncHandler(async (req, res) => {
  send(res, await recordView({ ...req.body, ip: req.ip }));
}));

router.post('/engagement/shares', optionalAuth, asyncHandler(async (req, res) => {
  send(res, await recordShare({ ...req.body, userId: req.user?.id }));
}));

router.get('/reading-history', requireAuth, asyncHandler(async (req, res) => {
  const result = await listReading(req.user.id, req.query);
  send(res, result.data, result.meta);
}));

router.post('/reading-history', requireAuth, asyncHandler(async (req, res) => {
  send(res, await upsertReading(req.user.id, req.body), null, 201);
}));

router.post('/reading-history/sync', requireAuth, asyncHandler(async (req, res) => {
  send(res, await syncReading(req.user.id, req.body.entries || []));
}));

router.get('/settings', asyncHandler(async (req, res) => {
  send(res, await publicSettings());
}));

router.get('/menus/:location', asyncHandler(async (req, res) => {
  send(res, await getMenu(req.params.location));
}));

router.get('/pages/:slug', asyncHandler(async (req, res) => {
  send(res, await getPublishedPage(req.params.slug));
}));

router.get('/podcasts', asyncHandler(async (req, res) => {
  const result = await listShows(req.query);
  send(res, result.data, result.meta);
}));

router.get('/podcasts/:showSlug/:episodeSlug', asyncHandler(async (req, res) => {
  send(res, await getEpisode(req.params.showSlug, req.params.episodeSlug));
}));

router.get('/podcasts/:showSlug', asyncHandler(async (req, res) => {
  send(res, await getShow(req.params.showSlug));
}));

router.get('/products', asyncHandler(async (req, res) => {
  const result = await listPublicProducts(req.query);
  send(res, result.data, result.meta);
}));

router.get('/products/:slug', asyncHandler(async (req, res) => {
  send(res, await getPublicProduct(req.params.slug));
}));

router.post('/shop/quote', optionalAuth, asyncHandler(async (req, res) => {
  send(res, await quoteCart(req.body));
}));

router.post('/orders', requireAuth, asyncHandler(async (req, res) => {
  const result = await createOrder({ ...req.body, user: req.user });
  send(res, result, null, 201);
}));

router.get('/orders/me', requireAuth, asyncHandler(async (req, res) => {
  const result = await listMyOrders(req.user, req.query);
  send(res, result.data, result.meta);
}));

router.get('/orders/:id', optionalAuth, asyncHandler(async (req, res) => {
  send(res, await getOrderForViewer(req.params.id, { user: req.user, accessKey: req.get('x-order-key') || '' }));
}));

router.get('/donations/campaigns', asyncHandler(async (req, res) => {
  const result = await listCampaigns(req.query);
  send(res, result.data, result.meta);
}));

router.get('/donations/campaigns/:slug', asyncHandler(async (req, res) => {
  send(res, await getCampaign(req.params.slug));
}));

router.get('/donations/reference/:reference', asyncHandler(async (req, res) => {
  const gift = await publicGift(req.params.reference);
  if (!gift) throw new ApiError(404, 'Gift not found.');
  send(res, gift);
}));

router.post('/payments/payfast/checkout', optionalAuth, asyncHandler(async (req, res) => {
  send(res, await openCheckout({
    kind: req.body?.kind,
    reference: req.body?.reference,
    orderId: req.body?.orderId,
    user: req.user,
  }));
}));

router.all('/payments/payfast/return', asyncHandler(async (req, res) => {
  const result = await settleNotice(req.method === 'GET' ? req.query : req.body);
  res.redirect(303, returnLocation(result));
}));

router.post('/payments/payfast/ipn', asyncHandler(async (req, res) => {
  const result = await settleNotice(req.body);
  res.status(result.ok ? 200 : 400).type('text/plain').send(result.ok ? 'OK' : 'INVALID');
}));

router.post('/donations', optionalAuth, [
  body('campaignId').notEmpty().withMessage('Choose a campaign.'),
  body('donorEmail').isEmail().withMessage('Enter a valid email.'),
  body('amountCents').isInt({ min: 100 }).withMessage('Enter an amount of at least 1.'),
], validate, asyncHandler(async (req, res) => {
  send(res, await createDonation({ ...req.body, user: req.user }), null, 201);
}));

router.post('/contact', writeLimit, [
  body('name').trim().notEmpty().withMessage('Enter your name.'),
  body('email').isEmail().withMessage('Enter a valid email.'),
  body('subject').optional({ checkFalsy: true }).isString().isLength({ max: 160 }),
  body('message').trim().isLength({ min: 1, max: 4000 }).withMessage('Write a message.'),
], validate, asyncHandler(async (req, res) => {
  send(res, await createContactMessage(req.body), null, 201);
}));

router.post('/newsletter/subscribe', writeLimit, [
  body('email').isEmail().withMessage('Enter a valid email.'),
], validate, asyncHandler(async (req, res) => {
  send(res, await subscribeNewsletter(req.body), null, 201);
}));

const admin = Router();
admin.use(requireAuth);

admin.get('/dashboard', requirePermission('dashboard:view'), asyncHandler(async (req, res) => {
  send(res, await dashboardCounts());
}));

admin.get('/settings', requirePermission('settings:manage'), asyncHandler(async (req, res) => {
  send(res, await publicSettings());
}));

admin.put('/settings', requirePermission('settings:manage'), asyncHandler(async (req, res) => {
  send(res, await updateSettings(req.body));
}));

admin.get('/comments', requirePermission('comments:moderate'), asyncHandler(async (req, res) => {
  const result = await listCommentsAdmin(req.query);
  send(res, result.data, result.meta);
}));

admin.patch('/comments/:id', requirePermission('comments:moderate'), asyncHandler(async (req, res) => {
  send(res, await moderateComment(req.params.id, req.body.status));
}));

admin.delete('/comments/:id', requirePermission('comments:moderate'), asyncHandler(async (req, res) => {
  const { Comment } = await import('../models.js');
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, 'Comment not found.');
  await comment.deleteOne();
  send(res, { deleted: true });
}));

admin.get('/orders', requirePermission('orders:manage'), asyncHandler(async (req, res) => {
  const result = await listOrdersAdmin(req.query);
  send(res, result.data, result.meta);
}));

admin.patch('/orders/:id', requirePermission('orders:manage'), asyncHandler(async (req, res) => {
  send(res, await updateOrderStatus(req.params.id, req.body.status));
}));

admin.get('/donations', requirePermission('donations:manage'), asyncHandler(async (req, res) => {
  const result = await listDonationsAdmin(req.query);
  send(res, result.data, result.meta);
}));

admin.delete('/donations/:id', requirePermission('donations:manage'), asyncHandler(async (req, res) => {
  send(res, await deleteDonation(req.params.id));
}));

admin.get('/messages', requirePermission('pages:manage'), asyncHandler(async (req, res) => {
  send(res, await listContactMessages());
}));

admin.delete('/messages/:id', requirePermission('pages:manage'), asyncHandler(async (req, res) => {
  send(res, await deleteContactMessage(req.params.id));
}));

admin.post('/uploads', asyncHandler(async (req, res) => {
  const allowed = hasPermission(req.user, '*')
    || hasPermission(req.user, 'content:write')
    || hasPermission(req.user, 'pages:manage')
    || hasPermission(req.user, 'media:manage');
  if (!allowed) throw new ApiError(403, 'You do not have permission to perform this action.');
  const saved = saveImageUpload(req.body?.dataUrl);
  if (saved.error) throw new ApiError(422, saved.error);
  send(res, { url: saved.url }, null, 201);
}));

admin.use('/:resource', asyncHandler(async (req, res, next) => {
  const resource = getResource(req.params.resource);
  const action = req.method === 'GET' ? 'read' : req.method === 'DELETE' ? 'delete' : 'write';
  const needed = permissionFor(resource, action);
  const allowed = hasPermission(req.user, needed)
    || (action === 'delete' && resource.ownUnless && hasPermission(req.user, resource.write || resource.permission));
  if (!allowed) throw new ApiError(403, 'You do not have permission to perform this action.');
  next();
}));

admin.get('/:resource', asyncHandler(async (req, res) => {
  const result = await listResource(req.params.resource, req.query);
  send(res, result.data, result.meta);
}));

admin.post('/:resource', asyncHandler(async (req, res) => {
  send(res, await createResource(req.params.resource, req.body, req.user), null, 201);
}));

admin.patch('/:resource/:id', asyncHandler(async (req, res) => {
  send(res, await updateResource(req.params.resource, req.params.id, req.body, req.user));
}));

admin.delete('/:resource/:id', asyncHandler(async (req, res) => {
  send(res, await deleteResource(req.params.resource, req.params.id, req.user));
}));

router.use('/admin', admin);

export default router;
