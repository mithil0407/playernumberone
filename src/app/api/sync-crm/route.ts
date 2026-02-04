import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { syncToCrm } from '@/lib/crmSupabase';

// GET - Run the CRM sync (protected by secret key)
export async function GET(request: Request) {
    try {
        // Simple security check
        const url = new URL(request.url);
        const secretKey = url.searchParams.get('key');

        if (secretKey !== process.env.MIGRATION_SECRET_KEY && secretKey !== 'sync-crm-2026') {
            return NextResponse.json({
                error: 'Unauthorized. Add ?key=sync-crm-2026 to the URL'
            }, { status: 401 });
        }

        // Check if CRM is configured
        if (!process.env.CRM_SUPABASE_ANON_KEY) {
            return NextResponse.json({
                error: 'CRM_SUPABASE_ANON_KEY not configured'
            }, { status: 500 });
        }

        console.log('Starting CRM sync...');

        // Fetch all orders with add-ons and customer data
        const { data: orders, error: fetchError } = await supabase
            .from('orders')
            .select('*, customers(*)')
            .not('add_ons', 'is', null)
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('Error fetching orders:', fetchError);
            return NextResponse.json({
                error: 'Failed to fetch orders',
                details: fetchError.message
            }, { status: 500 });
        }

        const results = {
            total_orders: orders?.length || 0,
            synced: 0,
            failed: 0,
            skipped: 0,
            errors: [] as string[],
            synced_customers: [] as { phone: string; name: string; addons: string }[],
        };

        // Process each order
        for (const order of orders || []) {
            try {
                // Skip if no customer data
                if (!order.customers) {
                    results.skipped++;
                    continue;
                }

                const crmResult = await syncToCrm({
                    customer_name: order.customers.name,
                    customer_phone: order.customers.phone,
                    add_ons: order.add_ons || 'None',
                    order_amount: order.amount,
                });

                if (crmResult.success) {
                    results.synced++;
                    results.synced_customers.push({
                        phone: order.customers.phone,
                        name: order.customers.name,
                        addons: order.add_ons || 'None'
                    });
                } else {
                    results.failed++;
                    results.errors.push(`${order.customers.phone}: ${crmResult.error}`);
                }

            } catch (orderError) {
                results.failed++;
                results.errors.push(`Error processing order: ${orderError}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `CRM sync complete! Synced ${results.synced} customers.`,
            results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('CRM sync error:', error);
        return NextResponse.json({
            error: 'CRM sync failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
