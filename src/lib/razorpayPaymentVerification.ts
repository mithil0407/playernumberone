import crypto from 'node:crypto';
import Razorpay from 'razorpay';

type Payment = { id?: string; order_id?: string; status?: string; amount?: number | string; currency?: string };
type Order = { razorpay_order_id?: unknown; amount?: unknown; currency?: unknown; razorpay_payment_id?: unknown; status?: unknown };

export function paymentMatchesOrder(input: {
  paymentId: string; orderId: string; signature: string; secret: string;
  order: Order; payment: Payment; expectedCurrency?: string;
}): boolean {
  const { paymentId, orderId, signature, secret, order, payment } = input;
  if (!secret || !paymentId || !orderId || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'))) return false;
  const amount = Number(order.amount);
  return order.razorpay_order_id === orderId
    && payment.id === paymentId
    && payment.order_id === orderId
    && payment.status === 'captured'
    && Number.isFinite(amount)
    && amount > 0
    && Number(payment.amount) === Math.round(amount * 100)
    && payment.currency === (input.expectedCurrency ?? order.currency)
    && (!order.razorpay_payment_id || order.razorpay_payment_id === paymentId);
}

export async function verifyRazorpayOrderPayment(input: {
  paymentId: string; orderId: string; signature: string; order: Order; expectedCurrency?: string;
}): Promise<boolean> {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const key = process.env.RAZORPAY_KEY_ID;
  if (!secret || !key || !input.paymentId || !input.orderId || !input.signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${input.orderId}|${input.paymentId}`).digest('hex');
  if (!/^[a-f0-9]{64}$/i.test(input.signature)
      || !crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(input.signature, 'hex'))) return false;
  const razorpay = new Razorpay({ key_id: key, key_secret: secret });
  const [payment, razorpayOrder] = await Promise.all([
    razorpay.payments.fetch(input.paymentId), razorpay.orders.fetch(input.orderId),
  ]);
  if (razorpayOrder.id !== input.orderId
      || Number(razorpayOrder.amount) !== Math.round(Number(input.order.amount) * 100)
      || razorpayOrder.currency !== (input.expectedCurrency ?? input.order.currency)) return false;
  return paymentMatchesOrder({ ...input, secret, payment });
}

export function capturedSubscriptionChargeMatches(input: {
  paymentStatus: string | undefined;
  paymentSubscriptionId: string | undefined;
  subscriptionId: string;
  paymentAmount: number | string | undefined;
  savedAmount: number | string;
  webhookPlanId: string;
  savedPlanId: string;
}): boolean {
  return input.paymentStatus === 'captured'
    && Boolean(input.paymentSubscriptionId)
    && input.paymentSubscriptionId === input.subscriptionId
    && input.webhookPlanId === input.savedPlanId
    && Number.isFinite(Number(input.paymentAmount))
    && Number(input.paymentAmount) === Number(input.savedAmount);
}
