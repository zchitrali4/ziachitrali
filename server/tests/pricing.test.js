import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCoupon, sumLines } from '../src/utils/pricing.js';
import { slugify } from '../src/utils/security.js';

test('slugify keeps readable latin slugs', () => {
  assert.equal(slugify('Hello, World!'), 'hello-world');
});

test('percent coupon discounts the server subtotal', () => {
  const subtotal = sumLines([{ unitPriceCents: 2500, quantity: 2 }]);
  const result = applyCoupon(subtotal, { active: true, type: 'percent', amount: 10, minSubtotalCents: 0 });
  assert.equal(subtotal, 5000);
  assert.equal(result.discountCents, 500);
});

test('fixed coupon cannot exceed the subtotal', () => {
  const result = applyCoupon(800, { active: true, type: 'fixed', amount: 2000 });
  assert.equal(result.discountCents, 800);
});

test('inactive coupon is rejected', () => {
  const result = applyCoupon(1000, { active: false, type: 'percent', amount: 10 });
  assert.equal(result.error, 'This coupon is not active.');
});
