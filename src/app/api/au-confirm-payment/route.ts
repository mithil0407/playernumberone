import { NextRequest, NextResponse } from 'next/server';
import { supabaseAU } from '@/lib/supabaseAU';

export async function POST(request: NextRequest) {
    try {
        const { db_order_id, razorpay_payment_id, razorpay_order_id } = await request.json();

        if (!razorpay_payment_id) {
            return NextResponse.json({ error: 'Missing payment ID' }, { status: 400 });
        }

        // Update by db_order_id if available, otherwise fall back to razorpay_order_id
        if (db_order_id && db_order_id !== 'mock-order-id') {
            const { error } = await supabaseAU
                .from('au_orders')
                .update({
                    status: 'paid',
                    razorpay_payment_id,
                })
                .eq('id', db_order_id);

            if (error) {
                console.error('AU confirm payment error (by db_order_id):', error);
                // Try fallback by razorpay_order_id
            } else {
                return NextResponse.json({ success: true });
            }
        }

        if (razorpay_order_id) {
            const { error } = await supabaseAU
                .from('au_orders')
                .update({
                    status: 'paid',
                    razorpay_payment_id,
                })
                .eq('razorpay_order_id', razorpay_order_id);

            if (error) {
                console.error('AU confirm payment error (by razorpay_order_id):', error);
                return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('AU confirm payment API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
