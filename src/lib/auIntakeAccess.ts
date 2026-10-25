import { supabaseAdmin } from '@/lib/supabase';

export async function findPaidAUOrder(emailValue: unknown, paymentIdValue: unknown) {
  const email = typeof emailValue === 'string' ? emailValue.trim().toLowerCase() : '';
  const paymentId = typeof paymentIdValue === 'string' ? paymentIdValue.trim() : '';
  if (!email || !/^pay_[A-Za-z0-9_-]{8,64}$/.test(paymentId)) return null;
  const { data, error } = await supabaseAdmin.from('au_orders')
    .select('id, customer_email, customer_phone, razorpay_payment_id, status')
    .eq('razorpay_payment_id', paymentId).eq('status', 'paid').limit(20);
  if (error) throw error;
  return data?.find(order => order.customer_email?.trim().toLowerCase() === email) ?? null;
}
