import dotenv from 'dotenv';

dotenv.config();

const portFlag = process.argv.find((arg) => arg.startsWith('--port='));
const portIndex = process.argv.indexOf('--port');
const cliPort = portFlag ? portFlag.slice('--port='.length) : (portIndex !== -1 ? process.argv[portIndex + 1] : '');
if (/^\d+$/.test(cliPort || '')) process.env.PORT = cliPort;

const renderUrl = (process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
if (renderUrl) {
  if (!process.env.PUBLIC_SITE_URL) process.env.PUBLIC_SITE_URL = renderUrl;
  if (!process.env.PUBLIC_API_URL) process.env.PUBLIC_API_URL = renderUrl;
  if (!process.env.CORS_ORIGIN) process.env.CORS_ORIGIN = renderUrl;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me';

export const env = {
  nodeEnv,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ieds',
  jwtAccessSecret,
  accessTtl: process.env.ACCESS_TTL || '15m',
  refreshTtlDays: Number(process.env.REFRESH_TTL_DAYS || 1),
  refreshRememberDays: Number(process.env.REFRESH_REMEMBER_DAYS || 30),
  corsOrigins: [...new Set(
    `${process.env.CORS_ORIGIN || 'http://localhost:5173'},${process.env.PUBLIC_SITE_URL || ''}`
      .split(',')
      .map((item) => item.trim().replace(/\/$/, ''))
      .filter(Boolean),
  )],
  publicSiteUrl: (process.env.PUBLIC_SITE_URL || 'http://localhost:5173').replace(/\/$/, ''),
  cookieSecure: process.env.COOKIE_SECURE === 'true' || nodeEnv === 'production',
  cookieSameSite: cookieSite(),
  adminEmail: process.env.ADMIN_EMAIL || 'admin@ieds.local',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminName: process.env.ADMIN_NAME || 'Zia Chitrali',
  dbEnabled: process.env.DB_ENABLED === 'true',
  publicApiUrl: (process.env.PUBLIC_API_URL || `http://localhost:${Number(process.env.PORT || 5000)}`).replace(/\/$/, ''),
  payfast: {
    merchantId: process.env.PAYFAST_MERCHANT_ID || '',
    securedKey: process.env.PAYFAST_SECURED_KEY || '',
    merchantName: process.env.PAYFAST_MERCHANT_NAME || 'Zia Chitrali',
    mode: process.env.PAYFAST_MODE === 'live' ? 'live' : 'sandbox',
    baseUrl: (process.env.PAYFAST_BASE_URL || '').replace(/\/$/, ''),
  },
  mail: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: mailSecure(),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'Zia Chitrali <desk@ziachitrali.local>',
    get ready() {
      return Boolean(this.host && this.user && this.pass);
    },
  },
};

function mailSecure() {
  const flag = String(process.env.SMTP_SECURE || '').toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return Number(process.env.SMTP_PORT || 587) === 465;
}

function cookieSite() {
  const chosen = String(process.env.COOKIE_SAMESITE || '').toLowerCase();
  if (chosen === 'none' || chosen === 'lax' || chosen === 'strict') return chosen;
  try {
    const site = new URL(process.env.PUBLIC_SITE_URL || 'http://localhost:5173');
    const api = new URL(process.env.PUBLIC_API_URL || `http://localhost:${Number(process.env.PORT || 5000)}`);
    const splitHosts = site.host !== api.host;
    const bothHttps = site.protocol === 'https:' && api.protocol === 'https:';
    if (splitHosts && bothHttps) return 'none';
  } catch {
    return 'lax';
  }
  return 'lax';
}

if (nodeEnv === 'production') {
  const problems = [];
  if (process.env.DB_ENABLED !== 'true') problems.push('Set DB_ENABLED=true.');
  if (!process.env.MONGODB_URI || /127\.0\.0\.1|localhost/.test(process.env.MONGODB_URI)) {
    problems.push('Set MONGODB_URI to the Atlas connection string.');
  }
  if (jwtAccessSecret.length < 32 || /change-me|replace-with/i.test(jwtAccessSecret)) {
    problems.push('Set JWT_ACCESS_SECRET to a random string of at least 32 characters.');
  }
  if (problems.length) {
    throw new Error(`Production configuration is incomplete.\n${problems.join('\n')}`);
  }
}

export const isDev = env.nodeEnv !== 'production';
