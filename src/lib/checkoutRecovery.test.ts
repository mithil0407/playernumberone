import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isWithinRecoverySendingHours,
  nextRecoveryStep,
  normaliseRecoveryEmail,
  normaliseRecoveryPhone,
  parseRecoveryAddons,
  priceRecoveryCart,
  recoveryCheckoutUrl,
  recoveryResumeUrl,
  shouldRestartRecovery,
  type RecoveryScheduleState,
} from './checkoutRecoveryModel.ts';
import { buildCheckoutRecoveryEmail, type CheckoutRecoveryEmailInput } from './checkoutRecoveryEmails.ts';

const HOUR = 60 * 60 * 1000;
const NOW = new Date('2026-09-29T08:30:00.000Z'); // 14:00 IST

function lead(overrides: Partial<RecoveryScheduleState> = {}): RecoveryScheduleState {
  return {
    emails_sent: 0,
    last_activity_at: new Date(NOW.getTime() - 2 * HOUR).toISOString(),
    last_email_sent_at: null,
    converted_at: null,
    unsubscribed_at: null,
    ...overrides,
  };
}

const ago = (hours: number) => new Date(NOW.getTime() - hours * HOUR).toISOString();

test('email 1 goes an hour after the last checkout activity, not before', () => {
  assert.equal(nextRecoveryStep(lead({ last_activity_at: ago(0.5) }), NOW), null);
  assert.equal(nextRecoveryStep(lead({ last_activity_at: ago(1) }), NOW), 1);
});

test('emails 2 and 3 follow at one and three days, never closer than 12 hours apart', () => {
  assert.equal(nextRecoveryStep(lead({ emails_sent: 1, last_activity_at: ago(20), last_email_sent_at: ago(19) }), NOW), null);
  assert.equal(nextRecoveryStep(lead({ emails_sent: 1, last_activity_at: ago(24), last_email_sent_at: ago(23) }), NOW), 2);
  assert.equal(nextRecoveryStep(lead({ emails_sent: 2, last_activity_at: ago(71), last_email_sent_at: ago(47) }), NOW), null);
  assert.equal(nextRecoveryStep(lead({ emails_sent: 2, last_activity_at: ago(72), last_email_sent_at: ago(48) }), NOW), 3);
  // Coming back to the checkout re-times the sequence from that visit.
  assert.equal(nextRecoveryStep(lead({ emails_sent: 1, last_activity_at: ago(30), last_email_sent_at: ago(6) }), NOW), null);
  assert.equal(nextRecoveryStep(lead({ emails_sent: 3, last_activity_at: ago(100), last_email_sent_at: ago(28) }), NOW), null);
});

test('stops for buyers, unsubscribes and cold leads', () => {
  assert.equal(nextRecoveryStep(lead({ converted_at: ago(1) }), NOW), null);
  assert.equal(nextRecoveryStep(lead({ unsubscribed_at: ago(1) }), NOW), null);
  assert.equal(nextRecoveryStep(lead({ last_activity_at: ago(49) }), NOW), null, 'too cold to start');
  assert.equal(nextRecoveryStep(lead({ emails_sent: 2, last_activity_at: ago(24 * 8), last_email_sent_at: ago(24 * 5) }), NOW), null);
});

test('sends only between 8am and 9pm India time', () => {
  assert.equal(isWithinRecoverySendingHours(new Date('2026-09-29T02:29:00Z')), false); // 07:59 IST
  assert.equal(isWithinRecoverySendingHours(new Date('2026-09-29T02:30:00Z')), true); // 08:00 IST
  assert.equal(isWithinRecoverySendingHours(new Date('2026-09-29T15:29:00Z')), true); // 20:59 IST
  assert.equal(isWithinRecoverySendingHours(new Date('2026-09-29T15:30:00Z')), false); // 21:00 IST
});

test('a finished or converted lead restarts only after 30 days', () => {
  assert.equal(shouldRestartRecovery({ emails_sent: 3, last_email_sent_at: ago(24 * 10), converted_at: null }, NOW), false);
  assert.equal(shouldRestartRecovery({ emails_sent: 3, last_email_sent_at: ago(24 * 31), converted_at: null }, NOW), true);
  assert.equal(shouldRestartRecovery({ emails_sent: 1, last_email_sent_at: ago(24 * 31), converted_at: null }, NOW), false);
  assert.equal(shouldRestartRecovery({ emails_sent: 0, last_email_sent_at: null, converted_at: ago(24 * 5) }, NOW), false);
  assert.equal(shouldRestartRecovery({ emails_sent: 0, last_email_sent_at: null, converted_at: ago(24 * 31) }, NOW), true);
});

test('validates contact details the way the checkout collects them', () => {
  assert.equal(normaliseRecoveryEmail('  Priya.S@Gmail.com '), 'priya.s@gmail.com');
  assert.equal(normaliseRecoveryEmail('not-an-email'), null);
  assert.equal(normaliseRecoveryPhone('98765 43210'), '9876543210');
  assert.equal(normaliseRecoveryPhone('+91 98765 43210'), '9876543210');
  assert.equal(normaliseRecoveryPhone('1234567890'), null);
});

test('prices the saved cart from the server price list', () => {
  const addons = parseRecoveryAddons({ outfit_preview: true, smart_shoppers_guide: true, wardrobe_detox: 'yes' });
  assert.deepEqual(addons, { outfitPreview: true, wardrobeDetox: false, smartShopper: true });
  assert.deepEqual(priceRecoveryCart('offer_2699_checkout', addons), { basePrice: 2699, amount: 2699 + 999 + 499 });
});

test('the email link hides the token behind the resume route; the checkout URL carries only UTMs', () => {
  const row = { token: 'A'.repeat(32), checkout_source: 'offer_2699_checkout', topic: 'sleeves' };
  assert.equal(recoveryResumeUrl(row, 2), `https://www.iconik.pro/api/checkout-recovery/resume?t=${'A'.repeat(32)}&step=2`);
  const checkout = new URL(recoveryCheckoutUrl(row, 2));
  assert.equal(checkout.pathname, '/offer-2699/checkout');
  assert.equal(checkout.searchParams.get('topic'), 'sleeves');
  assert.equal(checkout.searchParams.get('restore'), '1');
  assert.equal(checkout.searchParams.get('utm_content'), 'email_2');
  assert.ok(!checkout.toString().includes('A'.repeat(32)));
  assert.equal(new URL(recoveryCheckoutUrl({ checkout_source: 'root_checkout', topic: null }, 1)).pathname, '/checkout');
});

function emailInput(overrides: Partial<CheckoutRecoveryEmailInput> = {}): CheckoutRecoveryEmailInput {
  return {
    step: 1,
    stage: 'payment_opened',
    addons: { outfitPreview: true, wardrobeDetox: false, smartShopper: false },
    basePrice: 2699,
    amount: 3698,
    resumeUrl: 'https://www.iconik.pro/api/checkout-recovery/resume?t=abc&step=1',
    unsubscribeUrl: 'https://www.iconik.pro/checkout-recovery/unsubscribe?t=abc',
    ...overrides,
  };
}

test('each email has its own subject, the saved order, the resume link and an unsubscribe link', () => {
  const subjects = new Set<string>();
  for (const step of [1, 2, 3] as const) {
    const email = buildCheckoutRecoveryEmail(emailInput({ step }));
    subjects.add(email.subject);
    assert.ok(email.html.includes('resume?t=abc&amp;step=1'), `step ${step} links to resume`);
    assert.ok(email.html.includes('checkout-recovery/unsubscribe?t=abc'), `step ${step} can unsubscribe`);
    assert.ok(email.html.includes('₹3,698'), `step ${step} shows the saved total`);
    assert.ok(email.text.includes('₹3,698'), `step ${step} text shows the saved total`);
    assert.ok(email.text.includes('Stop these reminders'), `step ${step} text can unsubscribe`);
    assert.ok(!/src="\/|\.webp/.test(email.html), `step ${step} uses absolute JPEG images`);
    assert.ok(!/undefined|NaN|\$\{/.test(email.html + email.text), `step ${step} has no template leaks`);
  }
  assert.equal(subjects.size, 3);
});

test('email 1 lists chosen add-ons and speaks to a failed payment', () => {
  const opened = buildCheckoutRecoveryEmail(emailInput());
  assert.ok(opened.html.includes('AI Outfit Preview'));
  assert.ok(!opened.html.includes('Wardrobe Detox'));
  assert.ok(!opened.html.includes("didn't go through"));

  const failed = buildCheckoutRecoveryEmail(emailInput({ stage: 'payment_failed' }));
  assert.match(failed.subject, /payment didn't go through/);
  assert.ok(failed.html.includes('Try payment again'));
});
