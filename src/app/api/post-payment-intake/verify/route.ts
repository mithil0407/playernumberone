import { NextRequest, NextResponse } from 'next/server';
import { verifyPostPaymentIntakeAccess } from '@/lib/postPaymentIntake';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const row = await verifyPostPaymentIntakeAccess({
      token: body.token,
      paymentId: body.payment_id,
    });

    return NextResponse.json({
      success: true,
      intake: {
        email: row.customer_email,
        phone: row.customer_phone,
        name: row.customer_name,
        source: row.source,
        order_id: row.order_id,
        razorpay_order_id: row.razorpay_order_id,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Invalid intake link' },
      { status: 401 },
    );
  }
}
