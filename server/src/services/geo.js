const PRIVATE_IP = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|0\.0\.0\.0|::1|localhost)/;

export function countryFromHeaders(req) {
  const raw = req.get('cf-ipcountry') || req.get('x-vercel-ip-country') || req.get('cloudfront-viewer-country') || '';
  return normalizeCountry(raw);
}

export function normalizeCountry(value) {
  const code = String(value || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX' || code === 'T1') return '';
  return code;
}

export async function lookupCountry(req) {
  const header = countryFromHeaders(req);
  if (header) return header;
  return lookupCountryFromIp(req.ip);
}

export async function lookupCountryFromIp(ip) {
  const host = String(ip || '').replace(/^::ffff:/, '');
  if (!host || PRIVATE_IP.test(host) || host.includes(':')) return '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(host)}`, { signal: controller.signal });
    if (!response.ok) return '';
    const body = await response.json();
    return body?.success === false ? '' : normalizeCountry(body?.country_code);
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}
