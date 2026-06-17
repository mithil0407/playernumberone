import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { attributionToColumns } from '@/lib/attribution';
import { supabaseAdmin } from '@/lib/supabase';

const MONTHLY_AMOUNT = 69900;
const TOTAL_COUNT = 120;

function isInvalidRazorpayPlanError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const razorpayError = error as {
    statusCode?: number;
    error?: { code?: string; description?: string };
  };
  return razorpayError.statusCode === 400 &&
    razorpayError.error?.code === 'BAD_REQUEST_ERROR' &&
    typeof razorpayError.error.description === 'string' &&
    razorpayError.error.description.toLowerCase().includes('id provided is invalid');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_email,
      customer_phone,
      customer_name,
      razorpay_order_id,
      db_order_id,
    } = body;
    const incomingAttribution = attributionToColumns(body.attribution);

    if (!customer_email || !customer_phone) {
      return NextResponse.json({ success: false, error: 'Missing customer email or phone' }, { status: 400 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, error: 'Payment gateway not configured.' }, { status: 500 });
    }

    const planId = process.env.MAN_EDIT_PLAN_MONTHLY || process.env.MEN_CLUB_PLAN_MONTHLY || '';
    if (!planId) {
      return NextResponse.json({
        success: false,
        error_code: 'plan_not_configured',
        error: 'Man Edit monthly plan is not configured. Add MAN_EDIT_PLAN_MONTHLY to env.',
      }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const resolvedName = customer_name || customer_email.split('@')[0];

    let subscription: { id: string; short_url?: string };
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subscription = await (razorpay.subscriptions.create as any)({
        plan_id: planId,
        total_count: TOTAL_COUNT,
        quantity: 1,
        customer_notify: 1,
        notes: {
          customer_name: resolvedName,
          customer_email,
          customer_phone,
          product: 'iconik_man_edit',
          plan_type: 'monthly',
          source: 'man_checkout',
          razorpay_order_id: razorpay_order_id || '',
          db_order_id: db_order_id || '',
          utm_source: incomingAttribution.utm_source || '',
          utm_medium: incomingAttribution.utm_medium || '',
          utm_campaign: incomingAttribution.utm_campaign || '',
          landing_page: incomingAttribution.landing_page || '',
        },
      }) as { id: string; short_url?: string };
    } catch (razorpayError) {
      if (isInvalidRazorpayPlanError(razorpayError)) {
        return NextResponse.json({
          success: false,
          error_code: 'razorpay_plan_invalid',
          error: 'The configured Man Edit monthly Razorpay plan could not be found for this account or mode.',
        }, { status: 500 });
      }
      throw razorpayError;
    }

    if (!subscription?.id) {
      throw new Error('Failed to create Man Edit subscription');
    }

    const { error: dbError } = await supabaseAdmin
      .from('man_edit_subscriptions')
      .upsert({
        customer_email,
        customer_name: resolvedName,
        customer_phone,
        order_id: db_order_id && db_order_id !== 'mock-order-id' ? db_order_id : null,
        plan_type: 'monthly',
        plan_id: planId,
        razorpay_subscription_id: subscription.id,
        amount: MONTHLY_AMOUNT,
        currency: 'INR',
        status: 'pending',
        source: 'man_checkout',
        notes: razorpay_order_id ? `Started after Man Blueprint order ${razorpay_order_id}` : 'Started from Man checkout',
        ...incomingAttribution,
      }, { onConflict: 'razorpay_subscription_id' });

    if (dbError) {
      console.error('Man Edit subscription DB save failed:', dbError);
      return NextResponse.json({ success: false, error: 'Could not save subscription. Please contact support.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      subscription_id: subscription.id,
      short_url: subscription.short_url,
      amount: MONTHLY_AMOUNT,
      currency: 'INR',
    });
  } catch (error) {
    console.error('Man Edit subscription API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}
