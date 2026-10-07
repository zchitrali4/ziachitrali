import crypto from 'crypto';
import { env } from '../config/env.js';
import { Donation, Order, Product } from '../models.js';
import { ApiError } from '../utils/http.js';

const HOSTS = {
  sandbox: 'https://ipguat.apps.net.pk',
  live: 'https://ipg1.apps.net.pk',
};

export function payfastReady() {
  return Boolean(env.payfast.merchantId && env.payfast.securedKey);
}

export function freshPayment(basketId) {
  return {
    provider: 'payfast',
    status: payfastReady() ? 'pending' : 'not_configured',
    basketId,
    transactionId: '',
    errCode: '',
    instrument: '',
  };
}

export function nextBasket(prefix) {
  const rand = crypto.randomBytes(2).toString('hex');
  return `${prefix}${Date.now().toString(36)}${rand}`.slice(0, 20);
}

export function normalizeMobile(value) {
  let digits = String(value || '').replace(/[^\d]/g, '');
  if (digits.startsWith('92') && digits.length === 12) digits = `0${digits.slice(2)}`;
  if (!/^03\d{9}$/.test(digits)) return '';
  return digits;
}

export function rupeeString(cents) {
  return (Number(cents) / 100).toFixed(2);
}

function host() {
  if (env.payfast.baseUrl) return env.payfast.baseUrl.replace(/\/$/, '');
  return HOSTS[env.payfast.mode] || HOSTS.sandbox;
}

function validationHash(basketId, errCode) {
  const data = `${basketId}|${env.payfast.securedKey}|${env.payfast.merchantId}|${errCode}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

function sameHash(left, right) {
  const a = Buffer.from(String(left || '').toLowerCase());
  const b = Buffer.from(String(right || '').toLowerCase());
  if (!a.length || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function readNotice(body) {
  const source = body && typeof body === 'object' ? body : {};
  const params = {};
  Object.entries(source).forEach(([key, value]) => {
    params[String(key).toLowerCase()] = Array.isArray(value) ? value[0] : value;
  });
  return params;
}

export function verifyNotice(body) {
  const params = readNotice(body);
  const basketId = String(params.basket_id || '').trim();
  const errCode = String(params.err_code || '').trim();
  const given = String(params.validation_hash || '').trim();
  if (!basketId || !errCode || !given || !payfastReady()) return null;
  if (!sameHash(validationHash(basketId, errCode), given)) return null;
  const reported = params.transaction_amount === undefined || params.transaction_amount === ''
    ? null
    : Math.round(Number(params.transaction_amount) * 100);
  return {
    basketId,
    errCode,
    approved: errCode === '000',
    amountCents: Number.isFinite(reported) ? reported : null,
    transactionId: String(params.transaction_id || ''),
    instrument: String(params.paymentname || params.payment_name || ''),
    message: String(params.err_msg || ''),
  };
}

async function accessToken(basketId, amount) {
  const body = new URLSearchParams({
    MERCHANT_ID: env.payfast.merchantId,
    SECURED_KEY: env.payfast.securedKey,
    BASKET_ID: basketId,
    TXNAMT: amount,
    CURRENCY_CODE: 'PKR',
  });
  const response = await fetch(`${host()}/Ecommerce/api/Transaction/GetAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
    signal: AbortSignal.timeout(12000),
  });
  const text = await response.text();
  let payload = {};
  try { payload = JSON.parse(text); } catch { payload = {}; }
  const token = payload.ACCESS_TOKEN || payload.access_token || '';
  if (!response.ok || !token) {
    throw new ApiError(502, 'PayFast did not open the payment page.');
  }
  return token;
}

export async function buildCheckout({ basketId, amountCents, mobile, email, name, description }) {
  if (!payfastReady()) {
    throw new ApiError(503, 'PayFast merchant id and secured key are not set yet.');
  }
  const amount = rupeeString(amountCents);
  const token = await accessToken(basketId, amount);
  const api = env.publicApiUrl;
  const fields = {
    MERCHANT_ID: env.payfast.merchantId,
    MERCHANT_NAME: env.payfast.merchantName,
    TOKEN: token,
    PROCCODE: '00',
    TXNAMT: amount,
    CUSTOMER_MOBILE_NO: mobile,
    CUSTOMER_EMAIL_ADDRESS: email,
    SIGNATURE: crypto.randomBytes(16).toString('hex'),
    VERSION: '1.0',
    TXNDESC: description,
    SUCCESS_URL: `${api}/api/payments/payfast/return`,
    FAILURE_URL: `${api}/api/payments/payfast/return`,
    CHECKOUT_URL: `${api}/api/payments/payfast/ipn`,
    BASKET_ID: basketId,
    ORDER_DATE: new Date().toISOString().slice(0, 10),
    CURRENCY_CODE: 'PKR',
    TRAN_TYPE: 'ECOMM_PURCHASE',
    RECURRING_TXN: 'FALSE',
  };
  if (name) fields.CUSTOMER_NAME = name;
  return {
    actionUrl: `${host()}/Ecommerce/api/Transaction/PostTransaction`,
    fields,
  };
}

async function loadPreview() {
  const { previewStore } = await import('../previewCatalog.js');
  return previewStore;
}

async function findPayable(basketId) {
  if (!env.dbEnabled) {
    const store = await loadPreview();
    const gift = store.donations.find((item) => item.payment?.basketId === basketId || item.reference === basketId);
    if (gift) return { kind: 'gift', record: gift };
    for (const order of store.orders.values()) {
      if (order.payment?.basketId === basketId) return { kind: 'order', record: order };
    }
    return null;
  }
  const gift = await Donation.findOne({ $or: [{ reference: basketId }, { 'payment.basketId': basketId }] });
  if (gift) return { kind: 'gift', record: gift };
  const order = await Order.findOne({ 'payment.basketId': basketId });
  if (order) return { kind: 'order', record: order };
  return null;
}

function centsOf(found) {
  return found.kind === 'gift' ? found.record.amountCents : found.record.totalCents;
}

async function savePaid(found, notice) {
  const payment = {
    provider: 'payfast',
    status: 'paid',
    basketId: notice.basketId,
    transactionId: notice.transactionId,
    errCode: notice.errCode,
    instrument: notice.instrument,
  };
  if (!env.dbEnabled) {
    if (found.record.status !== 'paid') {
      found.record.status = 'paid';
      if (found.kind === 'order') {
        const store = await loadPreview();
        found.record.items.forEach((item) => {
          const product = store.products.find((row) => row.id === item.product);
          if (product) product.stock = Math.max(0, Number(product.stock || 0) - Number(item.quantity || 0));
        });
      }
    }
    found.record.payment = payment;
    return;
  }
  if (found.record.status !== 'paid') {
    if (found.kind === 'order') {
      for (const item of found.record.items) {
        await Product.updateOne({ _id: item.product }, { $inc: { stock: -item.quantity } });
      }
    }
    found.record.status = 'paid';
  }
  found.record.payment = payment;
  await found.record.save();
}

async function saveFailed(found, notice) {
  if (found.record.status === 'paid') return;
  const payment = found.record.payment || {};
  payment.provider = 'payfast';
  payment.status = 'failed';
  payment.basketId = notice.basketId;
  payment.errCode = notice.errCode;
  payment.instrument = notice.instrument;
  payment.transactionId = notice.transactionId;
  found.record.payment = payment;
  if (env.dbEnabled) await found.record.save();
}

export async function settleNotice(body) {
  const notice = verifyNotice(body);
  if (!notice) return { ok: false };
  const found = await findPayable(notice.basketId);
  if (!found) return { ok: false };
  if (notice.approved) {
    if (notice.amountCents === null || notice.amountCents !== centsOf(found)) return { ok: false };
    await savePaid(found, notice);
  } else {
    await saveFailed(found, notice);
  }
  return {
    ok: true,
    paid: found.record.status === 'paid',
    kind: found.kind,
    reference: found.kind === 'gift' ? found.record.reference : '',
    orderId: found.kind === 'order' ? String(found.record.id || found.record._id) : '',
  };
}

export function returnLocation(result) {
  if (!result?.ok) return `${env.publicSiteUrl}/donate?result=unverified`;
  if (result.kind === 'order') {
    return `${env.publicSiteUrl}/orders/${result.orderId}?result=${result.paid ? 'paid' : 'failed'}`;
  }
  return `${env.publicSiteUrl}/donate?ref=${encodeURIComponent(result.reference)}&result=${result.paid ? 'paid' : 'failed'}`;
}

async function loadForCheckout({ kind, reference, orderId, user }) {
  if (kind === 'gift') {
    const ref = String(reference || '').trim();
    if (!ref) throw new ApiError(422, 'Choose a gift.');
    if (!env.dbEnabled) {
      const store = await loadPreview();
      const gift = store.donations.find((item) => item.reference === ref);
      if (!gift) throw new ApiError(404, 'Gift not found.');
      return {
        basketId: gift.payment.basketId || gift.reference,
        amountCents: gift.amountCents,
        mobile: normalizeMobile(gift.phone),
        email: gift.donorEmail,
        name: gift.anonymous ? '' : gift.donorName,
        description: `Gift ${gift.reference}`,
        status: gift.status,
        markPending: () => {
          gift.payment.provider = 'payfast';
          gift.payment.status = 'pending';
          gift.payment.basketId = gift.payment.basketId || gift.reference;
        },
      };
    }
    const gift = await Donation.findOne({ reference: ref });
    if (!gift) throw new ApiError(404, 'Gift not found.');
    return {
      basketId: gift.payment?.basketId || gift.reference,
      amountCents: gift.amountCents,
      mobile: normalizeMobile(gift.phone),
      email: gift.donorEmail,
      name: gift.anonymous ? '' : gift.donorName,
      description: `Gift ${gift.reference}`,
      status: gift.status,
      markPending: async () => {
        gift.payment.provider = 'payfast';
        gift.payment.status = 'pending';
        gift.payment.basketId = gift.payment.basketId || gift.reference;
        await gift.save();
      },
    };
  }
  if (kind !== 'order') throw new ApiError(422, 'Choose a payment.');
  if (!user?.id) throw new ApiError(401, 'Sign in required.');
  if (!env.dbEnabled) {
    const store = await loadPreview();
    const order = store.orders.get(String(orderId || ''));
    if (!order || order.userId !== user.id) throw new ApiError(404, 'Order not found.');
    if (order.payment?.provider === 'cod' || order.method === 'cod') {
      throw new ApiError(409, 'This order is cash on delivery.');
    }
    return {
      basketId: order.payment.basketId,
      amountCents: order.totalCents,
      mobile: normalizeMobile(order.customer?.phone),
      email: order.customer?.email || order.email,
      name: order.customer?.name || '',
      description: `Order ${order.id}`,
      status: order.status,
      markPending: () => {
        order.payment.provider = 'payfast';
        order.payment.status = 'pending';
      },
    };
  }
  const order = await Order.findById(orderId);
  if (!order || String(order.user) !== String(user.id)) throw new ApiError(404, 'Order not found.');
  if (order.payment?.provider === 'cod' || order.method === 'cod') {
    throw new ApiError(409, 'This order is cash on delivery.');
  }
  return {
    basketId: order.payment?.basketId,
    amountCents: order.totalCents,
    mobile: normalizeMobile(order.customer?.phone),
    email: order.customer?.email || order.email,
    name: order.customer?.name || '',
    description: `Order ${order._id}`,
    status: order.status,
      markPending: async () => {
      order.payment.provider = 'payfast';
      order.payment.status = 'pending';
      await order.save();
    },
  };
}

export async function openCheckout(input) {
  const payable = await loadForCheckout(input);
  if (payable.status === 'paid') throw new ApiError(409, 'This payment is already confirmed.');
  if (payable.status === 'cancelled') throw new ApiError(409, 'This payment was cancelled.');
  if (!payable.basketId) throw new ApiError(422, 'This payment has no reference.');
  if (!payable.mobile) throw new ApiError(422, 'Enter a Pakistani mobile number like 03XXXXXXXXX.');
  const checkout = await buildCheckout(payable);
  await payable.markPending();
  return checkout;
}

export async function publicGift(reference) {
  const ref = String(reference || '').trim();
  if (!ref) return null;
  if (!env.dbEnabled) {
    const store = await loadPreview();
    const gift = store.donations.find((item) => item.reference === ref);
    if (!gift) return null;
    return {
      reference: gift.reference,
      status: gift.status,
      payment: { provider: gift.payment?.provider || null, status: gift.payment?.status || 'not_configured' },
      amountCents: gift.amountCents,
      currency: gift.currency,
      campaign: { title: gift.campaignTitle || 'Zia Chitrali' },
      payfastReady: payfastReady(),
    };
  }
  const gift = await Donation.findOne({ reference: ref }).populate('campaign', 'title');
  if (!gift) return null;
  return {
    reference: gift.reference,
    status: gift.status,
    payment: { provider: gift.payment?.provider || null, status: gift.payment?.status || 'not_configured' },
    amountCents: gift.amountCents,
    currency: gift.currency,
    campaign: { title: gift.campaign?.title || 'Zia Chitrali' },
    payfastReady: payfastReady(),
  };
}
