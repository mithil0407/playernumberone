import { NextRequest, NextResponse } from 'next/server';
import { membershipForMember, MembershipError, verifySubscriptionSignature } from '@/lib/styleMembershipServer';
import { updateMembership } from '@/lib/styleMembershipStore';
import { errorResponse, noStore, readJson } from '../../_shared/http';

export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const membership = await membershipForMember(body.membershipId, body.code);
    const subscriptionId = String(body.razorpay_subscription_id ?? '');
    const paymentId = String(body.razorpay_payment_id ?? '');
    const signature = String(body.razorpay_signature ?? '');
    if (subscriptionId !== membership.razorpay_subscription_id || !verifySubscriptionSignature(subscriptionId, paymentId, signature)) {
      throw new MembershipError('We couldn’t confirm autopay. You can try again, or we’ll send a payment link before renewal.', 400, 'bad_signature');
    }
    await updateMembership(membership.id, { autopay_status: 'active' });
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (error) {
    return errorResponse(error, 'mandate confirm');
  }
}
