import { ApiError } from '../utils/http.js';
import { applyCoupon, sumLines } from '../utils/pricing.js';
import { createOpaqueToken, hashToken } from '../utils/security.js';
import { Coupon, Order, Product } from '../models.js';
import { presentImage, presentOrder, presentProduct } from '../presenters.js';
import { sendOrderNote } from './mailService.js';
import { freshPayment, nextBasket, normalizeMobile, payfastReady } from './payfast.js';
import { getPaging, pageMeta } from '../utils/http.js';

async function resolveLines(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(422, 'Add at least one product.', [{ field: 'items', message: 'Cart is empty.' }]);
  }
  if (items.length > 30) throw new ApiError(422, 'Too many line items.');
  const lines = [];
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      throw new ApiError(422, 'Check item quantities.', [{ field: 'quantity', message: 'Quantity must be between 1 and 20.' }]);
    }
    const product = await Product.findById(item.productId);
    if (!product || product.status !== 'active') {
      throw new ApiError(404, 'A product in the cart is no longer available.');
    }
    if (quantity > product.stock) {
      throw new ApiError(409, `${product.title} does not have enough stock.`);
    }
    const color = String(item.color || '');
    const size = String(item.size || '');
    const colors = product.colors || [];
    const sizes = product.sizes || [];
    if (colors.length && !colors.some((entry) => entry.name === color)) {
      throw new ApiError(422, 'Choose a color.', [{ field: 'color', message: 'Choose a color.' }]);
    }
    if (sizes.length && !sizes.includes(size)) {
      throw new ApiError(422, 'Choose a size.', [{ field: 'size', message: 'Choose a size.' }]);
    }
    lines.push({
      product: product._id,
      title: product.title,
      slug: product.slug,
      unitPriceCents: product.priceCents,
      quantity,
      lineTotalCents: product.priceCents * quantity,
      currency: product.currency || 'PKR',
      stock: product.stock,
      color,
      size,
      image: presentImage(product.images?.[0]) || null,
    });
  }
  const currencies = new Set(lines.map((line) => line.currency));
  if (currencies.size > 1) throw new ApiError(422, 'Mixed currencies are not supported.');
  return lines;
}

export async function quoteCart({ items, couponCode }) {
  const lines = await resolveLines(items);
  const subtotalCents = sumLines(lines);
  let coupon = null;
  let discountCents = 0;
  if (couponCode) {
    coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase() });
    if (!coupon) throw new ApiError(422, 'Coupon not found.', [{ field: 'couponCode', message: 'Coupon not found.' }]);
    const applied = applyCoupon(subtotalCents, coupon);
    if (applied.error) throw new ApiError(422, applied.error, [{ field: 'couponCode', message: applied.error }]);
    discountCents = applied.discountCents;
  }
  return {
    lines: lines.map((line) => ({
      productId: line.product.toString(),
      title: line.title,
      slug: line.slug,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
      lineTotalCents: line.lineTotalCents,
      currency: line.currency,
      stock: line.stock,
      color: line.color || '',
      size: line.size || '',
      image: line.image || null,
    })),
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
    currency: lines[0].currency,
    couponCode: coupon ? coupon.code : '',
  };
}

async function holdStock(lines) {
  const held = [];
  try {
    for (const line of lines) {
      const updated = await Product.findOneAndUpdate(
        { _id: line.productId, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } },
      );
      if (!updated) throw new ApiError(409, `${line.title} does not have enough stock.`);
      held.push(line);
    }
  } catch (error) {
    await releaseStock(held);
    throw error;
  }
}

async function releaseStock(lines) {
  for (const line of lines) {
    await Product.updateOne({ _id: line.productId }, { $inc: { stock: line.quantity } });
  }
}

export async function createOrder({ items, couponCode, customer, notes, user, method }) {
  const quote = await quoteCart({ items, couponCode });
  const email = String(customer?.email || user?.email || '').toLowerCase();
  const mobile = normalizeMobile(customer?.phone);
  const payMethod = String(method || '').toLowerCase();
  if (payMethod !== 'cod' && payMethod !== 'payfast') {
    throw new ApiError(422, 'Choose cash on delivery or PayFast.', [
      { field: 'method', message: 'Choose cash on delivery or PayFast.' },
    ]);
  }
  if (!email || !customer?.name || !customer?.address) {
    throw new ApiError(422, 'Name, email, and address are required.', [
      { field: 'customer', message: 'Name, email, and address are required.' },
    ]);
  }
  if (!mobile) {
    throw new ApiError(422, 'Enter a Pakistani mobile number like 03XXXXXXXXX.', [
      { field: 'phone', message: 'Enter a Pakistani mobile number like 03XXXXXXXXX.' },
    ]);
  }
  if (payMethod === 'cod') await holdStock(quote.lines);
  const accessKey = createOpaqueToken();
  let order;
  try {
    order = await Order.create({
    user: user?.id || null,
    email,
    items: quote.lines.map((line) => ({
      product: line.productId,
      title: line.title,
      slug: line.slug,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
      lineTotalCents: line.lineTotalCents,
      color: line.color || '',
      size: line.size || '',
    })),
    subtotalCents: quote.subtotalCents,
    discountCents: quote.discountCents,
    totalCents: quote.totalCents,
    currency: quote.currency,
    couponCode: quote.couponCode,
    customer: {
      name: customer.name,
      email,
      phone: mobile,
      address: customer.address,
    },
    notes: notes || '',
    method: payMethod,
    status: 'pending_payment',
    payment: payMethod === 'cod'
      ? { provider: 'cod', status: 'due_on_delivery', basketId: '', transactionId: '', errCode: '', instrument: '' }
      : freshPayment(nextBasket('o')),
    accessKeyHash: hashToken(accessKey),
  });
  } catch (error) {
    if (payMethod === 'cod') await releaseStock(quote.lines);
    throw error;
  }
  try {
    await sendOrderNote({
      name: customer.name,
      email,
      orderId: order._id.toString(),
      lines: quote.lines,
      totalCents: quote.totalCents,
      currency: quote.currency,
      method: payMethod,
    });
  } catch (error) {
    console.error('[mail]', error.message);
  }
  return { order: presentOrder(order), accessKey, payfastReady: payfastReady() };
}

export async function getOrderForViewer(id, { user, accessKey }) {
  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, 'Order not found.');
  const owns = user && order.user && String(order.user) === String(user.id);
  const keyOk = accessKey && hashToken(accessKey) === order.accessKeyHash;
  if (!owns && !keyOk && !user?.permissions?.includes('orders:manage') && !user?.permissions?.includes('*')) {
    throw new ApiError(404, 'Order not found.');
  }
  return { ...presentOrder(order), payfastReady: payfastReady() };
}

export async function listMyOrders(user, query) {
  const { page, limit, skip } = getPaging(query);
  const filter = { user: user.id };
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);
  return { data: items.map(presentOrder), meta: pageMeta(page, limit, total) };
}

export async function listPublicProducts(query) {
  const { page, limit, skip } = getPaging(query);
  const filter = { status: 'active' };
  if (query.q) {
    const { escapeRegex } = await import('../utils/security.js');
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { category: rx }];
  }
  if (query.category) filter.category = String(query.category);
  const sort = query.sort === 'price' ? { priceCents: 1 } : query.sort === 'price-desc' ? { priceCents: -1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  return { data: items.map(presentProduct), meta: pageMeta(page, limit, total) };
}

export async function getPublicProduct(slug) {
  const product = await Product.findOne({ slug, status: 'active' });
  if (!product) throw new ApiError(404, 'Product not found.');
  return presentProduct(product);
}
