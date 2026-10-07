import test from 'node:test';
import assert from 'node:assert/strict';
import { verificationDelivery } from '../src/services/mailService.js';

const url = 'http://localhost:5173/verify-email?token=abc';

test('a sent verification does not expose the link', () => {
  const result = verificationDelivery({ status: 'sent' }, url, true);
  assert.equal(result.verificationSent, true);
  assert.equal(result.mailStatus, 'sent');
  assert.equal(result.devVerifyUrl, undefined);
});

test('a queued verification keeps the link only for local development', () => {
  const local = verificationDelivery({ status: 'queued' }, url, true);
  const live = verificationDelivery({ status: 'queued' }, url, false);
  assert.equal(local.verificationSent, false);
  assert.equal(local.devVerifyUrl, url);
  assert.equal(live.devVerifyUrl, undefined);
});

test('a failed send is reported as failed', () => {
  const result = verificationDelivery({ status: 'failed' }, url, true);
  assert.equal(result.verificationSent, false);
  assert.equal(result.mailStatus, 'failed');
  assert.equal(result.devVerifyUrl, url);
});

test('a missing mail result is treated as a failure', () => {
  const result = verificationDelivery(null, url, false);
  assert.equal(result.mailStatus, 'failed');
  assert.equal(result.verificationSent, false);
  assert.equal(result.devVerifyUrl, undefined);
});
