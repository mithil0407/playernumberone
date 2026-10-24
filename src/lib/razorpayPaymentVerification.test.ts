import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import { capturedSubscriptionChargeMatches, paymentMatchesOrder } from './razorpayPaymentVerification.ts';

const secret = 'test-secret';
const orderId = 'order_123';
const paymentId = 'pay_123';
const signature = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
const valid = {
  secret, orderId, paymentId, signature,
  order: { razorpay_order_id: orderId, amount: 97, currency: 'USD', status: 'pending' },
  payment: { id: paymentId, order_id: orderId, amount: 9700, currency: 'USD', status: 'captured' },
};
test('accepts a signed captured payment matching the saved order', () => assert.equal(paymentMatchesOrder(valid), true));
test('rejects forged signature, wrong payment, wrong order, underpayment, currency and uncaptured status', () => {
  for (const bad of [
    { signature: '0'.repeat(64) },
    { payment: { ...valid.payment, id: 'pay_other' } },
    { payment: { ...valid.payment, order_id: 'order_other' } },
    { payment: { ...valid.payment, amount: 1 } },
    { payment: { ...valid.payment, currency: 'INR' } },
    { payment: { ...valid.payment, status: 'authorized' } },
    { order: { ...valid.order, razorpay_order_id: 'order_other' } },
    { order: { ...valid.order, razorpay_payment_id: 'pay_other' } },
  ]) assert.equal(paymentMatchesOrder({ ...valid, ...bad }), false);
});


test('club provisioning requires a captured charge linked to the saved subscription and plan', () => {
  const validCharge = { paymentStatus: 'captured', paymentSubscriptionId: 'sub_123', subscriptionId: 'sub_123', paymentAmount: 69900, savedAmount: 69900, webhookPlanId: 'plan_123', savedPlanId: 'plan_123' };
  assert.equal(capturedSubscriptionChargeMatches(validCharge), true);
  assert.equal(capturedSubscriptionChargeMatches({ ...validCharge, paymentStatus: 'authorized' }), false);
  assert.equal(capturedSubscriptionChargeMatches({ ...validCharge, paymentSubscriptionId: undefined }), false);
  assert.equal(capturedSubscriptionChargeMatches({ ...validCharge, paymentSubscriptionId: 'sub_other' }), false);
  assert.equal(capturedSubscriptionChargeMatches({ ...validCharge, paymentAmount: 500 }), false);
  assert.equal(capturedSubscriptionChargeMatches({ ...validCharge, savedPlanId: 'plan_other' }), false);
});
