import 'server-only';

// Razorpay webhook events for the Style Membership. The main webhook
// (/api/payment/webhook) hands every event here first; this only claims events
// whose notes say product = style_membership (set on the order, the checkout,
// the subscription and the payment link), so Blueprint and Edit events never
// touch these tables, and a missing migration can't break them.

import { isMembershipWebhookEvent, notesOf, type WebhookPayload as Payload } from './styleMembershipWebhookRouting';
import { activatePaidMembership, extendMembership, prepareRenewalPayLink } from './styleMembershipServer';
import { findMembership, hasPayLinkSince, updateMembership } from './styleMembershipStore';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Returns true when the event was a membership event (handled or deliberately ignored). */
export async function handleStyleMembershipWebhook(event: string, payload: Payload): Promise<boolean> {
  if (!isMembershipWebhookEvent(event, payload)) return false;
  try {
    await handle(event, payload);
  } catch (error) {
    console.error(`[style-membership] webhook ${event} failed:`, error);
  }
  return true;
}

async function handle(event: string, payload: Payload) {
  const payment = payload.payment?.entity;

  if (event === 'order.paid' || event === 'payment.captured') {
    const order = payload.order?.entity;
    const notes = notesOf(order ?? payment);
    const membershipId = String(notes.membership_id ?? '');
    const orderId = String(order?.id ?? payment?.order_id ?? '');
    if (!membershipId || !orderId || !payment?.id) return;
    await activatePaidMembership({
      membershipId,
      razorpayOrderId: orderId,
      razorpayPaymentId: String(payment.id),
      amountPaise: Number(payment.amount),
    });
    return;
  }

  if (event.startsWith('payment.')) return; // authorized / failed on the first payment: the browser shows it.

  if (event.startsWith('payment_link.')) {
    const link = payload.payment_link?.entity;
    if (event !== 'payment_link.paid') return;
    const membership = await findMembership('id', String(notesOf(link).membership_id ?? ''));
    if (membership) await extendMembership(membership, String(payment?.id ?? link?.id ?? ''));
    return;
  }

  const subscription = payload.subscription?.entity;
  const membership = await findMembership('razorpay_subscription_id', String(subscription?.id ?? ''))
    ?? await findMembership('id', String(notesOf(subscription).membership_id ?? ''));
  if (!membership) return;

  switch (event) {
    case 'subscription.authenticated':
    case 'subscription.activated':
    case 'subscription.resumed':
      await updateMembership(membership.id, { autopay_status: 'active', razorpay_subscription_id: String(subscription?.id) });
      return;
    case 'subscription.charged':
      await updateMembership(membership.id, { autopay_status: 'active' });
      await extendMembership(membership, String(payment?.id ?? ''));
      return;
    case 'subscription.pending':
    case 'subscription.halted': {
      // The autopay charge failed: keep her membership, prepare a payment link
      // for WhatsApp (queued, not sent), once a week at most.
      const updated = await updateMembership(membership.id, { autopay_status: 'failed', status: 'past_due' });
      if (!await hasPayLinkSince(membership.id, new Date(Date.now() - 7 * DAY_MS).toISOString())) {
        await prepareRenewalPayLink(updated ?? membership, `autopay ${event === 'subscription.halted' ? 'stopped after retries' : 'charge failed'}`);
      }
      return;
    }
    case 'subscription.cancelled':
    case 'subscription.completed':
    case 'subscription.paused':
      await updateMembership(membership.id, { autopay_status: 'cancelled' });
      return;
    default:
      return;
  }
}
