// Globe Intake Submit
// Receives intake form data from the client and inserts it into
// globe_intake_submissions using the service-role (admin) Supabase client,
// which bypasses RLS policies that block the anon-key insert.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseGlobeServer } from '@/lib/serverSupabaseGlobe';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const {
            customer_email,
            customer_phone,
            photo_fullbody_url,
            photo_headshot_url,
            frustrations,
            frustrations_custom,
            situations,
            body_insecurities,
            wardrobe_type,
            colour_preference,
            style_aesthetics,
            style_outcome,
            style_restrictions,
            hair_type,
        } = body;

        if (!customer_email) {
            return NextResponse.json({ error: 'Missing customer_email' }, { status: 400 });
        }

        // Insert into globe_intake_submissions via admin client (bypasses RLS)
        const { data, error } = await supabaseGlobeServer
            .from('globe_intake_submissions')
            .insert([{
                customer_email,
                customer_phone: customer_phone || '',
                photo_fullbody_url: photo_fullbody_url || '',
                photo_headshot_url: photo_headshot_url || '',
                frustrations: frustrations || '',
                frustrations_custom: frustrations_custom || '',
                situations: situations || '',
                body_insecurities: body_insecurities || '',
                wardrobe_type: wardrobe_type || '',
                colour_preference: colour_preference || '',
                style_aesthetics: style_aesthetics || '',
                style_outcome: style_outcome || '',
                style_restrictions: style_restrictions || '',
                hair_type: hair_type || '',
            }])
            .select()
            .single();

        if (error) {
            console.error('Globe intake submission insert error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // Mark quiz reminder as no longer needed for this customer
        if (customer_email) {
            await supabaseGlobeServer
                .from('globe_orders')
                .update({ quiz_reminder_sent: true })
                .eq('customer_email', customer_email)
                .eq('status', 'paid')
                .eq('quiz_reminder_sent', false);
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Globe intake submit API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
