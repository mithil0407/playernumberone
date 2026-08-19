import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPrivateToken } from '@/lib/styleScan';
import { sendInstantReportPaymentEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_payment_id: paymentId, razorpay_order_id: razorpayOrderId, razorpay_signature: signature } = body;
    if (!paymentId || !razorpayOrderId || !signature || !body.accessToken) {
      return NextResponse.json({ error: 'Incomplete payment confirmation.' }, { status: 400 });
    }
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpayOrderId}|${paymentId}`).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(String(signature));
    if (!process.env.RAZORPAY_KEY_SECRET || expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return NextResponse.json({ error: 'Payment signature could not be verified.' }, { status: 400 });
    }
    const { data: order, error } = await supabaseAdmin.from('stylist_orders').update({
      status: 'paid', razorpay_payment_id: paymentId,
    }).eq('razorpay_order_id', razorpayOrderId)
      .eq('access_token_hash', hashPrivateToken(String(body.accessToken)))
      .eq('product_type', 'instant_report_999')
      .select('id, lead_id, customer_name, customer_email, payment_email_sent').single();
    if (error || !order) return NextResponse.json({ error: 'Paid order was not found.' }, { status: 404 });
    if (order.lead_id) await supabaseAdmin.from('style_scan_leads').update({ purchased: true }).eq('id', order.lead_id);
    if (!order.payment_email_sent) {
      const refinementUrl = new URL(`/instant-report/refine/${encodeURIComponent(body.accessToken)}`, request.nextUrl.origin).toString();
      const sent = await sendInstantReportPaymentEmail({ customer_name: order.customer_name || order.customer_email, customer_email: order.customer_email, refinement_url: refinementUrl, payment_id: paymentId });
      if (sent.success) await supabaseAdmin.from('stylist_orders').update({ payment_email_sent: true }).eq('id', order.id);
    }
    return NextResponse.json({ success: true, refinementUrl: `/instant-report/refine/${encodeURIComponent(body.accessToken)}` });
  } catch (error) {
    console.error('[instant-report] confirmation failed:', error);
    return NextResponse.json({ error: 'We could not confirm the payment.' }, { status: 500 });
  }
}
