import { NextRequest, NextResponse } from 'next/server';
import { activatePaidMembership, MembershipError, verifyPaymentSignature } from '@/lib/styleMembershipServer';
import { errorResponse, noStore, readJson, requestMeta } from '../_shared/http';

/** Razorpay's checkout handler lands here; the order.paid webhook is the backstop. */
export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request);
    const orderId = String(body.razorpay_order_id ?? '');
    const paymentId = String(body.razorpay_payment_id ?? '');
    const signature = String(body.razorpay_signature ?? '');
    if (!orderId || !paymentId || !signature || !verifyPaymentSignature(orderId, paymentId, signature)) {
      throw new MembershipError('We couldn’t verify this payment. If money left your account, message us on WhatsApp.', 400, 'bad_signature');
    }
    const { membership } = await activatePaidMembership({
      membershipId: String(body.membershipId ?? ''),
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      ...requestMeta(request),
    });
    return NextResponse.json({ ok: true, membershipId: membership.id, plan: membership.plan, amountPaise: membership.amount_paise }, { headers: noStore });
  } catch (error) {
    return errorResponse(error, 'confirm');
  }
}
