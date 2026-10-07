import { api } from './http.js';

function queryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const authApi = {
  register: (body) => api('/auth/register', { method: 'POST', body, auth: false }),
  login: (body) => api('/auth/login', { method: 'POST', body, auth: false }),
  refresh: () => api('/auth/refresh', { method: 'POST', auth: false }),
  logout: () => api('/auth/logout', { method: 'POST', auth: false }),
  logoutAll: () => api('/auth/logout-all', { method: 'POST' }),
  me: () => api('/auth/me'),
  forgot: (body) => api('/auth/forgot-password', { method: 'POST', body, auth: false }),
  reset: (body) => api('/auth/reset-password', { method: 'POST', body, auth: false }),
  verify: (body) => api('/auth/verify-email', { method: 'POST', body, auth: false }),
  resend: () => api('/auth/resend-verification', { method: 'POST' }),
};

export const accountApi = {
  updateProfile: (body) => api('/users/me', { method: 'PATCH', body }),
  uploadAvatar: (dataUrl) => api('/users/me/avatar', { method: 'POST', body: { dataUrl } }),
  removeAvatar: () => api('/users/me/avatar', { method: 'POST', body: { remove: true } }),
  updateSettings: (body) => api('/users/me/settings', { method: 'PATCH', body }),
  updatePassword: (body) => api('/users/me/password', { method: 'PATCH', body }),
  remove: (body) => api('/users/me', { method: 'DELETE', body }),
};

export const contentApi = {
  list: (typeKey, params, signal) => api(`/content${typeKey ? `/${typeKey}` : ''}${queryString(params)}`, { auth: false, signal }),
  detail: (typeKey, slug, signal) => api(`/content/${typeKey}/${slug}`, { signal }),
  related: (typeKey, slug, signal) => api(`/content/${typeKey}/${slug}/related`, { auth: false, signal }),
};

export const discoveryApi = {
  search: (params, signal) => api(`/search${queryString(params)}`, { auth: false, signal }),
  categories: (params, signal) => api(`/categories${queryString(params)}`, { auth: false, signal }),
  category: (slug, signal) => api(`/categories/${slug}`, { auth: false, signal }),
  tags: (params, signal) => api(`/tags${queryString(params)}`, { auth: false, signal }),
  tag: (slug, signal) => api(`/tags/${slug}`, { auth: false, signal }),
  authors: (params, signal) => api(`/authors${queryString(params)}`, { auth: false, signal }),
  author: (slug, signal) => api(`/authors/${slug}`, { auth: false, signal }),
};

export const metricsApi = {
  page: (path) => api('/metrics/page', { method: 'POST', body: { path }, auth: false }),
};

export const engagementApi = {
  like: (body) => api('/engagement/likes', { method: 'POST', body }),
  bookmark: (body) => api('/engagement/bookmarks', { method: 'POST', body }),
  bookmarks: (params, signal) => api(`/engagement/bookmarks${queryString(params)}`, { signal }),
  likes: (params, signal) => api(`/engagement/likes${queryString(params)}`, { signal }),
  view: (body) => api('/engagement/views', { method: 'POST', body, auth: false }),
  share: (body) => api('/engagement/shares', { method: 'POST', body }),
  history: (params, signal) => api(`/reading-history${queryString(params)}`, { signal }),
  saveHistory: (body) => api('/reading-history', { method: 'POST', body }),
  syncHistory: (entries) => api('/reading-history/sync', { method: 'POST', body: { entries } }),
};

export const commentApi = {
  list: (params, signal) => api(`/comments${queryString(params)}`, { signal }),
  create: (body) => api('/comments', { method: 'POST', body }),
};

export const cmsApi = {
  settings: (signal) => api('/settings', { auth: false, signal }),
  menu: (location, signal) => api(`/menus/${location}`, { auth: false, signal }),
  page: (slug, signal) => api(`/pages/${slug}`, { auth: false, signal }),
  contact: (body) => api('/contact', { method: 'POST', body, auth: false }),
};

export const podcastApi = {
  list: (params, signal) => api(`/podcasts${queryString(params)}`, { auth: false, signal }),
  show: (slug, signal) => api(`/podcasts/${slug}`, { auth: false, signal }),
  episode: (showSlug, episodeSlug, signal) => api(`/podcasts/${showSlug}/${episodeSlug}`, { auth: false, signal }),
};

export const shopApi = {
  products: (params, signal) => api(`/products${queryString(params)}`, { auth: false, signal }),
  product: (slug, signal) => api(`/products/${slug}`, { auth: false, signal }),
  quote: (body, signal) => api('/shop/quote', { method: 'POST', body, signal }),
  createOrder: (body) => api('/orders', { method: 'POST', body }),
  pay: (orderId) => api('/payments/payfast/checkout', { method: 'POST', body: { kind: 'order', orderId } }),
  myOrders: (params, signal) => api(`/orders/me${queryString(params)}`, { signal }),
  order: (id, accessKey, signal) => api(`/orders/${id}`, {
    signal,
    headers: accessKey ? { 'x-order-key': accessKey } : {},
  }),
};

export const donationApi = {
  campaigns: (params, signal) => api(`/donations/campaigns${queryString(params)}`, { auth: false, signal }),
  campaign: (slug, signal) => api(`/donations/campaigns/${slug}`, { auth: false, signal }),
  create: (body) => api('/donations', { method: 'POST', body }),
  gift: (reference, signal) => api(`/donations/reference/${encodeURIComponent(reference)}`, { auth: false, signal }),
  pay: (reference) => api('/payments/payfast/checkout', { method: 'POST', body: { kind: 'gift', reference }, auth: false }),
};

export const newsletterApi = {
  subscribe: (body) => api('/newsletter/subscribe', { method: 'POST', body, auth: false }),
};

export const adminApi = {
  dashboard: (signal) => api('/admin/dashboard', { signal }),
  list: (resource, params, signal) => api(`/admin/${resource}${queryString(params)}`, { signal }),
  create: (resource, body) => api(`/admin/${resource}`, { method: 'POST', body }),
  update: (resource, id, body) => api(`/admin/${resource}/${id}`, { method: 'PATCH', body }),
  remove: (resource, id) => api(`/admin/${resource}/${id}`, { method: 'DELETE' }),
  settings: (signal) => api('/admin/settings', { signal }),
  saveSettings: (body) => api('/admin/settings', { method: 'PUT', body }),
  comments: (params, signal) => api(`/admin/comments${queryString(params)}`, { signal }),
  moderate: (id, status) => api(`/admin/comments/${id}`, { method: 'PATCH', body: { status } }),
  deleteComment: (id) => api(`/admin/comments/${id}`, { method: 'DELETE' }),
  orders: (params, signal) => api(`/admin/orders${queryString(params)}`, { signal }),
  orderStatus: (id, status) => api(`/admin/orders/${id}`, { method: 'PATCH', body: { status } }),
  donations: (params, signal) => api(`/admin/donations${queryString(params)}`, { signal }),
  uploadImage: (dataUrl) => api('/admin/uploads', { method: 'POST', body: { dataUrl } }),
  messages: (signal) => api('/admin/messages', { signal }),
  deleteMessage: (id) => api(`/admin/messages/${id}`, { method: 'DELETE' }),
};
