export function applyCoupon(subtotalCents, coupon, now = new Date()) {
  if (!coupon) return { discountCents: 0 };
  if (!coupon.active) return { error: 'This coupon is not active.' };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return { error: 'This coupon has expired.' };
  }
  if (coupon.minSubtotalCents && subtotalCents < coupon.minSubtotalCents) {
    return { error: 'The order total does not meet this coupon minimum.' };
  }
  let discount = 0;
  if (coupon.type === 'percent') {
    const percent = Math.min(100, Math.max(0, Number(coupon.amount) || 0));
    discount = Math.round(subtotalCents * (percent / 100));
  } else if (coupon.type === 'fixed') {
    discount = Math.max(0, Number(coupon.amount) || 0);
  }
  discount = Math.min(subtotalCents, discount);
  return { discountCents: discount };
}

export function sumLines(lines) {
  return lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
}
