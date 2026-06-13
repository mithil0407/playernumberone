// Man Intake Submit
// Saves form data server-side using supabaseAdmin to bypass RLS.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.customer_email) {
            return NextResponse.json({ error: 'Missing customer_email' }, { status: 400 });
        }

        if (!body.photo_fullbody_url || !body.photo_headshot_url) {
            return NextResponse.json({ error: 'Both full body and headshot photos are required' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('man_intake_submissions')
            .insert([body])
            .select()
            .single();

        if (error) {
            console.error('Man intake DB error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Man intake submit API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
