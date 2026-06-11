import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const leadId = typeof body.leadId === 'string' ? body.leadId : '';
        const email = typeof body.email === 'string' ? body.email.trim() : '';

        if (!UUID_RE.test(leadId) || !email) {
            return NextResponse.json({ success: false, error: 'Invalid lead update request' }, { status: 400 });
        }

        const { error } = await supabaseAdmin
            .from('style_scan_leads')
            .update({ blueprint_cta_clicked: true })
            .eq('id', leadId)
            .eq('email', email);

        if (error) {
            console.error('Style lead CTA update failed:', error);
            return NextResponse.json({ success: false, error: 'Failed to update lead' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Style lead CTA API error:', error);
        return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}
