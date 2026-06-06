import { attributionFromRow } from '@/lib/attribution';
import { supabaseGlobe } from '@/lib/supabaseGlobe';
import { saveStylistOrder, supabaseStyleScan } from '@/lib/supabaseStyleScan';

type DbRow = Record<string, unknown>;

export function cleanCustomerEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeAmount(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

async function findPaidGlobeOrder(input: {
  globeOrderId?: string | null;
  razorpayOrderId?: string | null;
  customerEmail?: string | null;
}) {
  if (input.globeOrderId && input.globeOrderId !== 'mock-order-id') {
    const { data, error } = await supabaseGlobe
      .from('globe_orders')
      .select('*')
      .eq('id', input.globeOrderId)
      .eq('status', 'paid')
      .maybeSingle();

    if (error) throw error;
    if (data) return data as DbRow;
  }

  if (input.razorpayOrderId) {
    const { data, error } = await supabaseGlobe
      .from('globe_orders')
      .select('*')
      .eq('razorpay_order_id', input.razorpayOrderId)
      .eq('status', 'paid')
      .maybeSingle();

    if (error) throw error;
    if (data) return data as DbRow;
  }

  const email = cleanCustomerEmail(input.customerEmail);
  if (!email) return null;

  const { data, error } = await supabaseGlobe
    .from('globe_orders')
    .select('*')
    .ilike('customer_email', email)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as DbRow | null;
}

export async function findPaidGlobeOrderByEmail(email: string) {
  return findPaidGlobeOrder({ customerEmail: email });
}

export async function mirrorPaidGlobeOrderToStylist(input: {
  globeOrder?: DbRow | null;
  globeOrderId?: string | null;
  stylistOrderId?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  amount?: number | string | null;
}) {
  const globeOrder = input.globeOrder ?? await findPaidGlobeOrder({
    globeOrderId: input.globeOrderId,
    razorpayOrderId: input.razorpayOrderId,
    customerEmail: input.customerEmail,
  });

  if (!globeOrder) return null;

  const customerEmail = cleanCustomerEmail(input.customerEmail) || cleanCustomerEmail(globeOrder.customer_email);
  if (!customerEmail) return null;

  const razorpayOrderId = cleanString(input.razorpayOrderId) || cleanString(globeOrder.razorpay_order_id);
  const razorpayPaymentId = cleanString(input.razorpayPaymentId) || cleanString(globeOrder.razorpay_payment_id);
  const payload = {
    customer_email: customerEmail,
    customer_name: cleanString(input.customerName) || cleanString(globeOrder.customer_name) || customerEmail.split('@')[0],
    customer_phone: cleanString(input.customerPhone) || cleanString(globeOrder.customer_phone),
    amount: input.amount != null ? normalizeAmount(input.amount) : normalizeAmount(globeOrder.amount),
    currency: cleanString(globeOrder.currency) || 'USD',
    status: 'paid' as const,
    ...(razorpayOrderId && { razorpay_order_id: razorpayOrderId }),
    ...(razorpayPaymentId && { razorpay_payment_id: razorpayPaymentId }),
    ...attributionFromRow(globeOrder),
  };

  if (input.stylistOrderId && input.stylistOrderId !== 'mock-stylist-order-id') {
    const { data, error } = await supabaseStyleScan
      .from('stylist_orders')
      .update(payload)
      .eq('id', input.stylistOrderId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (data) return data as DbRow;
  }

  if (razorpayOrderId) {
    const { data, error } = await supabaseStyleScan
      .from('stylist_orders')
      .update(payload)
      .eq('razorpay_order_id', razorpayOrderId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (data) return data as DbRow;
  }

  return saveStylistOrder(payload);
}
