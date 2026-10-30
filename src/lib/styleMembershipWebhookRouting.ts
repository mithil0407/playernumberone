// Which Razorpay webhook events belong to the Style Membership, from the payload
// alone (no database call), so Blueprint and Edit events never touch its tables.
// Pure; tested.

import { MEMBERSHIP_NOTES_PRODUCT } from './styleMembershipConfig';

export type WebhookEntity = Record<string, unknown> & { id?: string; notes?: Record<string, unknown> | unknown[] };
export type WebhookPayload = Record<string, { entity?: WebhookEntity } | undefined>;

export function notesOf(entity: WebhookEntity | undefined) {
  const notes = entity?.notes;
  return notes && !Array.isArray(notes) && typeof notes === 'object' ? notes as Record<string, unknown> : {};
}

function isMembershipEntity(entity: WebhookEntity | undefined) {
  return notesOf(entity).product === MEMBERSHIP_NOTES_PRODUCT;
}

/** Which events belong to the membership, from the payload alone (no database call). */
export function isMembershipWebhookEvent(event: string, payload: WebhookPayload) {
  if (event.startsWith('subscription.')) return isMembershipEntity(payload.subscription?.entity);
  if (event.startsWith('payment_link.')) return isMembershipEntity(payload.payment_link?.entity);
  if (event === 'order.paid') return isMembershipEntity(payload.order?.entity);
  if (event.startsWith('payment.')) return isMembershipEntity(payload.payment?.entity);
  return false;
}

