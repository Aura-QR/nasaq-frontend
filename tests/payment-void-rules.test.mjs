import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canVoidPaymentFor,
  dayIn,
  lastEffectivePaymentDate,
} from '../src/shared/financial/paymentVoidRules.js';

const cashier = 'cashier-id';
const now = new Date('2026-09-14T09:00:00Z'); // 12:00 in Riyadh
const payment = (extra = {}) => ({
  amount: 1000, type: 'payment', recordedBy: cashier, recordedAt: '2026-09-14T06:00:00Z', ...extra,
});

test('the owner may void any payment, however old, whoever recorded it', () => {
  assert.equal(canVoidPaymentFor(payment({ recordedBy: 'someone', recordedAt: '2026-01-01' }), { role: 'OWNER', now }), true);
  assert.equal(canVoidPaymentFor(payment({ recordedAt: undefined }), { role: 'owner', now }), true);
});

test('whoever recorded it may void it the same day, and not the next', () => {
  assert.equal(canVoidPaymentFor(payment(), { userId: cashier, role: 'MANAGER', now }), true);
  assert.equal(
    canVoidPaymentFor(payment({ recordedAt: '2026-09-13T06:00:00Z' }), { userId: cashier, role: 'MANAGER', now }),
    false,
  );
});

test('a colleague may not, even the same day', () => {
  assert.equal(canVoidPaymentFor(payment(), { userId: 'colleague', role: 'MANAGER', now }), false);
});

test('an entry with no recording time is the owner\'s alone', () => {
  assert.equal(canVoidPaymentFor(payment({ recordedAt: undefined }), { userId: cashier, role: 'MANAGER', now }), false);
});

test('refunds and voided entries are never offered', () => {
  assert.equal(canVoidPaymentFor(payment({ type: 'refund' }), { role: 'OWNER', now }), false);
  assert.equal(canVoidPaymentFor(payment({ voidedAt: '2026-09-14' }), { role: 'OWNER', now }), false);
});

test('"the same day" is the school\'s day — the same boundaries the server uses', () => {
  assert.equal(dayIn('2026-09-01T20:30:00Z', 'Asia/Riyadh'), '2026-09-01');
  assert.equal(dayIn('2026-09-01T21:30:00Z', 'Asia/Riyadh'), '2026-09-02');
  assert.equal(dayIn('2026-09-01T21:30:00Z', 'Not/AZone'), '2026-09-02');
  // Recorded 23:50 Riyadh, checked 00:10 Riyadh the next day: a different day.
  assert.equal(
    canVoidPaymentFor(payment({ recordedAt: '2026-09-13T20:50:00Z' }),
      { userId: cashier, role: 'MANAGER', now: new Date('2026-09-13T21:10:00Z') }),
    false,
  );
});

test('the last payment date skips voided entries', () => {
  assert.equal(
    lastEffectivePaymentDate([
      { paidAt: '2026-09-01' },
      { paidAt: '2026-09-05', voidedAt: '2026-09-05' },
    ]),
    '2026-09-01',
  );
  assert.equal(lastEffectivePaymentDate([{ paidAt: '2026-09-05', voidedAt: 'x' }]), null);
  assert.equal(lastEffectivePaymentDate(undefined), null);
});
