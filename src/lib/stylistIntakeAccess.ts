import { supabaseStyleScan } from '@/lib/supabaseStyleScan';
import { mirrorPaidGlobeOrderToStylist } from '@/lib/globeStylistMirror';
import { supabaseGlobe } from '@/lib/supabaseGlobe';

export function validPaymentId(value: unknown): value is string {
  return typeof value === 'string' && /^pay_[A-Za-z0-9_-]{8,64}$/.test(value);
}

export async function findPaidStylistIntakeOrder(emailValue: unknown, paymentIdValue: unknown) {
  const email = typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : '';
  if (!email || !validPaymentId(paymentIdValue)) return null;

  const { data, error } = await supabaseStyleScan.from('stylist_orders')
    .select('id, lead_id, customer_email, customer_name, customer_phone, razorpay_payment_id, status, intake_completed')
    .eq('razorpay_payment_id', paymentIdValue).eq('status', 'paid').limit(20);
  if (error) throw error;
  const order = data?.find(row => row.customer_email?.trim().toLowerCase() === email);
  if (order) return order;

  // Older Globe purchases may not yet be mirrored into stylist_orders.
  const { data: globeOrders, error: globeError } = await supabaseGlobe.from('globe_orders')
    .select('*').eq('razorpay_payment_id', paymentIdValue).eq('status', 'paid').limit(20);
  if (globeError) throw globeError;
  const globeOrder = globeOrders?.find(row => row.customer_email?.trim().toLowerCase() === email);
  if (!globeOrder) return null;
  return mirrorPaidGlobeOrderToStylist({ globeOrder, customerEmail: email });
}
