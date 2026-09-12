import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase';
import { createOrderAccessToken, getStyleScanByToken, hashPrivateToken, normalizeScanPhone, safeAttribution } from '@/lib/styleScan';

const PRICE = 999;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const phone = normalizeScanPhone(body.phone);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone) {
      return NextResponse.json({ error: 'Enter a valid email and Indian mobile number.' }, { status: 400 });
    }
    const scan = await getStyleScanByToken(String(body.scanToken || ''), 'id, scan_status, phone_e164, attribution_payload, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landing_page, first_touch_at');
    if (!scan || scan.scan_status !== 'ready') {
      return NextResponse.json({ error: 'A completed Style Scan is required for this report.' }, { status: 403 });
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: 'Payment gateway is not configured.' }, { status: 500 });
    }
    const receipt = `instant_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const attribution = { ...safeAttribution(body.attribution) };
    const { data: order, error: orderError } = await supabaseAdmin.from('stylist_orders').insert({
      lead_id: scan.id,
      customer_email: email,
      customer_name: name || email.split('@')[0],
      customer_phone: phone,
      amount: PRICE,
      currency: 'INR',
      status: 'pending',
      product_type: 'instant_report_999',
      report_variant: 'instant_10',
      ...attribution,
    }).select('id').single();
    if (orderError) throw orderError;
    const accessToken = createOrderAccessToken(order.id);
    const { error: tokenError } = await supabaseAdmin.from('stylist_orders')
      .update({ access_token_hash: hashPrivateToken(accessToken) }).eq('id', order.id);
    if (tokenError) throw tokenError;

    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const razorpayOrder = await razorpay.orders.create({
      amount: PRICE * 100,
      currency: 'INR',
      receipt,
      notes: {
        db_order_id: order.id,
        scan_lead_id: scan.id,
        product_type: 'instant_report_999',
        report_variant: 'instant_10',
        customer_email: email,
        customer_phone: phone,
      },
    });
    const { error: updateError } = await supabaseAdmin.from('stylist_orders')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', order.id);
    if (updateError) throw updateError;
    await supabaseAdmin.from('style_scan_leads').update({ checkout_started: true }).eq('id', scan.id);
    return NextResponse.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: PRICE * 100,
      currency: 'INR',
      razorpayOrderId: razorpayOrder.id,
      dbOrderId: order.id,
      accessToken,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[instant-report] payment create failed:', error);
    return NextResponse.json({ error: 'Payment could not be started. Please try again.' }, { status: 500 });
  }
}
