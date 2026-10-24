import assert from 'node:assert/strict';
import test from 'node:test';
import { qualifiesForStylistEditDiscount } from './stylistEditDiscount.ts';

const valid = {
  email: 'client@example.com', subscriptionId: 'sub_123', monthlyPlanId: 'plan_monthly',
  saved: { customer_email: 'Client@Example.com', razorpay_subscription_id: 'sub_123', plan_id: 'plan_monthly', plan_type: 'monthly', amount: 3900, currency: 'USD' },
  razorpay: { id: 'sub_123', plan_id: 'plan_monthly', status: 'active' },
};

test('discount requires an active Edit subscription for the same buyer and monthly plan', () => {
  assert.equal(qualifiesForStylistEditDiscount(valid), true);
  assert.equal(qualifiesForStylistEditDiscount({ ...valid, saved: null }), false);
  assert.equal(qualifiesForStylistEditDiscount({ ...valid, email: 'other@example.com' }), false);
  assert.equal(qualifiesForStylistEditDiscount({ ...valid, saved: { ...valid.saved, plan_id: 'plan_other' } }), false);
  assert.equal(qualifiesForStylistEditDiscount({ ...valid, razorpay: { ...valid.razorpay, status: 'authenticated' } }), false);
  assert.equal(qualifiesForStylistEditDiscount({ ...valid, razorpay: { ...valid.razorpay, status: 'cancelled' } }), false);
});
