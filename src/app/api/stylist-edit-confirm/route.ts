import { NextRequest, NextResponse } from 'next/server';
import { supabaseStyleScan } from '@/lib/supabaseStyleScan';

export async function POST(request: NextRequest) {
    try {
        const {
            razorpay_subscription_id,
            razorpay_payment_id,
            customer_name,
            customer_phone,
        } = await request.json();

        if (!razorpay_subscription_id) {
            return NextResponse.json({ success: false, error: 'Missing subscription ID' }, { status: 400 });
        }

        const { data, error } = await supabaseStyleScan
            .from('style_edit_subscriptions')
            .update({
                ...(razorpay_payment_id && { razorpay_payment_id }),
                ...(customer_name && { customer_name }),
                ...(customer_phone && { customer_phone }),
                notes: 'Client completed Razorpay subscription modal; webhook remains source of truth for activation.',
                updated_at: new Date().toISOString(),
            })
            .eq('razorpay_subscription_id', razorpay_subscription_id)
            .select()
            .single();

        if (error) {
            console.error('Stylist Edit confirm error:', error);
            return NextResponse.json({ success: false, error: 'Failed to update subscription' }, { status: 500 });
        }

        void data;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Stylist Edit confirm API error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
