import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import api from './routes/api.js';
import { errorHandler, notFound } from './middleware/common.js';
import { Content, Page, PodcastEpisode, PodcastShow, Product } from './models.js';
import { resolveContentKey } from './config/catalog.js';
import { handlePreview, overlayTranslations } from './previewCatalog.js';
import { localizePreview } from './previewLocale.js';
import { handlePreviewAdmin } from './previewAdmin.js';

const app = express();
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use('/api', helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));
app.use((req, res, next) => {
  const limit = req.path === '/api/admin/uploads' || req.path === '/api/users/me/avatar' || req.path === '/api/donations' ? '8mb' : '1mb';
  return express.json({ limit })(req, res, next);
});
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

if (!env.dbEnabled) {
  app.use('/api', (req, res, next) => {
    if (req.path === '/health' || req.path === '/content-types' || req.path.startsWith('/payments/')) return next();
    const previewAuth = req.path === '/auth/login' || req.path === '/auth/register' || req.path === '/auth/refresh' || req.path === '/auth/logout' || req.path === '/auth/logout-all' || req.path === '/auth/forgot-password' || req.path === '/auth/reset-password' || req.path === '/auth/verify-email' || req.path === '/auth/resend-verification';
    if (req.path.startsWith('/admin') || previewAuth) {
      return handlePreviewAdmin(req, res);
    }
    if (req.method !== 'GET') {
      if (req.method === 'POST' && req.path === '/metrics/page') {
        return import('./services/trafficService.js')
          .then(({ recordPageView }) => recordPageView({ path: req.body?.path, ip: req.ip }))
          .then((data) => res.json({ success: true, data }))
          .catch(next);
      }
      if (req.method === 'POST' && (req.path === '/shop/quote' || req.path === '/orders' || req.path === '/contact' || req.path === '/donations')) {
        return Promise.resolve(handlePreview(req, res)).catch((error) => {
          console.error(error);
          if (!res.headersSent) res.status(500).json({ success: false, message: 'The request could not be finished.' });
        });
      }
      return res.status(503).json({
        success: false,
        message: 'Database is not connected yet. This screen is only a preview.',
      });
    }
    return handlePreview(req, res);
  });
}

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nSitemap: ${env.publicSiteUrl}/sitemap.xml\n`);
});

app.get('/sitemap.xml', async (req, res, next) => {
  if (!env.dbEnabled) {
    return res.type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
  try {
    const [content, pages, shows, episodes, products] = await Promise.all([
      Content.find({ status: 'published' }).select('type slug updatedAt'),
      Page.find({ status: 'published' }).select('slug updatedAt'),
      PodcastShow.find({ status: 'published' }).select('slug updatedAt'),
      PodcastEpisode.find({ status: 'published' }).populate('show', 'slug').select('slug updatedAt'),
      Product.find({ status: 'active' }).select('slug updatedAt'),
    ]);
    const urls = [
      '/', '/search', '/podcasts', '/shop', '/donate', '/newsletter', '/tags',
      '/articles', '/research', '/news', '/books', '/columns', '/analysis',
      '/interesting-stories', '/inspirational-stories', '/videos',
    ];
    const entries = urls.map((path) => ({ loc: `${env.publicSiteUrl}${path}` }));
    content.forEach((item) => {
      const key = resolveContentKey(item.type);
      if (!key) return;
      entries.push({ loc: `${env.publicSiteUrl}/${key}/${item.slug}`, lastmod: item.updatedAt });
    });
    pages.forEach((item) => entries.push({ loc: `${env.publicSiteUrl}/pages/${item.slug}`, lastmod: item.updatedAt }));
    shows.forEach((item) => entries.push({ loc: `${env.publicSiteUrl}/podcasts/${item.slug}`, lastmod: item.updatedAt }));
    episodes.forEach((item) => {
      if (!item.show?.slug) return;
      entries.push({ loc: `${env.publicSiteUrl}/podcasts/${item.show.slug}/${item.slug}`, lastmod: item.updatedAt });
    });
    products.forEach((item) => entries.push({ loc: `${env.publicSiteUrl}/products/${item.slug}`, lastmod: item.updatedAt }));
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((entry) => `  <url><loc>${entry.loc}</loc>${entry.lastmod ? `<lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`;
    res.type('application/xml').send(xml);
  } catch (error) {
    next(error);
  }
});

if (env.dbEnabled) {
  app.use('/api', (req, res, next) => {
    const lang = String(req.get('accept-language') || 'en').toLowerCase().slice(0, 2);
    if (lang !== 'ur' && lang !== 'ar') return next();
    const original = res.json.bind(res);
    res.json = (body) => original(overlayTranslations(localizePreview(body, lang), lang));
    next();
  });
}

app.use('/api', api);

if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist, { index: false, maxAge: env.nodeEnv === 'production' ? '1h' : 0 }));
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
