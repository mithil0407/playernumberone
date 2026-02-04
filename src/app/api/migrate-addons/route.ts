import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabase } from '@/lib/supabase';

// Helper function to extract add-ons from Razorpay order notes
function extractAddOns(notes: Record<string, string> | null): string {
    if (!notes) return 'None';

    const addOns: string[] = [];

    // Wardrobe Detox (replaces old Diva Diet Plan)
    if (notes.wardrobe_detox_addon === 'true' || notes.wardrobe_detox === 'true' || notes.diva_diet_plan_addon === 'true') {
        addOns.push('Wardrobe Detox');
    }

    // Smart Shopper's Guide
    if (notes.smart_shoppers_guide_addon === 'true' || notes.smart_shoppers_guide === 'true') {
        addOns.push("Smart Shopper's Guide");
    }

    // Outfit Preview
    if (notes.outfit_preview_addon === 'true' || notes.outfit_preview === 'true') {
        addOns.push('Outfit Preview on You');
    }

    return addOns.length > 0 ? addOns.join(', ') : 'None';
}

// GET - Run the migration (protected by secret key)
export async function GET(request: Request) {
    try {
        // Simple security check - require a secret key in query params
        const url = new URL(request.url);
        const secretKey = url.searchParams.get('key');

        if (secretKey !== process.env.MIGRATION_SECRET_KEY && secretKey !== 'run-migration-2026') {
            return NextResponse.json({
                error: 'Unauthorized. Add ?key=YOUR_SECRET_KEY to the URL'
            }, { status: 401 });
        }

        // Check Razorpay credentials
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json({
                error: 'Razorpay credentials not configured'
            }, { status: 500 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        // Get orders from the last 7 days (you can adjust this)
        const daysToFetch = parseInt(url.searchParams.get('days') || '7');
        const fromDate = Math.floor((Date.now() - daysToFetch * 24 * 60 * 60 * 1000) / 1000);

        console.log(`Fetching Razorpay orders from last ${daysToFetch} days...`);

        // Fetch orders from Razorpay
        const orders = await razorpay.orders.all({
            from: fromDate,
            count: 100, // Max 100 per request
        });

        console.log(`Found ${orders.items?.length || 0} orders in Razorpay`);

        const results = {
            total_razorpay_orders: orders.items?.length || 0,
            updated: 0,
            not_found_in_supabase: 0,
            already_has_addons: 0,
            errors: [] as string[],
            updated_orders: [] as { razorpay_order_id: string; add_ons: string }[],
        };

        // Process each order
        for (const order of orders.items || []) {
            try {
                // The receipt field contains our custom alpha1_ ID that's stored in Supabase
                const receiptId = order.receipt;
                const razorpayOrderId = order.id; // The actual Razorpay ID like order_xxxx
                const notes = order.notes as Record<string, string> | null;

                if (!receiptId) {
                    results.errors.push(`Order ${razorpayOrderId} has no receipt`);
                    continue;
                }

                // Check if order exists in Supabase by matching the receipt (alpha1_ ID)
                const { data: existingOrder, error: fetchError } = await supabase
                    .from('orders')
                    .select('id, add_ons, razorpay_order_id')
                    .eq('razorpay_order_id', receiptId)
                    .single();

                if (fetchError || !existingOrder) {
                    results.not_found_in_supabase++;
                    continue;
                }

                // Skip if already has add_ons data
                if (existingOrder.add_ons && existingOrder.add_ons !== '') {
                    results.already_has_addons++;
                    continue;
                }

                // Extract add-ons from notes
                const addOnsString = extractAddOns(notes);

                // Update the order in Supabase
                const { error: updateError } = await supabase
                    .from('orders')
                    .update({
                        add_ons: addOnsString,
                        product_type: 'consultation'
                    })
                    .eq('razorpay_order_id', receiptId);

                if (updateError) {
                    results.errors.push(`Failed to update order ${receiptId}: ${updateError.message}`);
                } else {
                    results.updated++;
                    results.updated_orders.push({
                        razorpay_order_id: receiptId,
                        add_ons: addOnsString
                    });
                }

            } catch (orderError) {
                results.errors.push(`Error processing order: ${orderError}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Migration complete! Updated ${results.updated} orders.`,
            results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({
            error: 'Migration failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
