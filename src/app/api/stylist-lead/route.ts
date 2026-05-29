import { NextRequest, NextResponse } from 'next/server';
import { saveStyleScanLead } from '@/lib/supabaseStyleScan';
import { attributionToColumns } from '@/lib/attribution';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            email,
            struggle,
            bodyShape,
            undertone,
            aesthetic,
            dressingContext,
            photoUrl,
            styleScore,
            colourDirection,
            silhouetteDirection,
            moodKeywords,
            moodColours,
            whatsMissing,
        } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ success: false, error: 'Missing email' }, { status: 400 });
        }

        const attribution = attributionToColumns(body.attribution);
        const lead = await saveStyleScanLead({
            email,
            style_struggle: struggle,
            body_shape: bodyShape,
            undertone,
            aesthetic,
            dressing_context: dressingContext,
            photo_url: photoUrl,
            style_score: Number.isFinite(Number(styleScore)) ? Number(styleScore) : undefined,
            colour_direction: colourDirection,
            silhouette_direction: silhouetteDirection,
            mood_keywords: Array.isArray(moodKeywords) ? moodKeywords.join(',') : moodKeywords,
            mood_colours: Array.isArray(moodColours) ? moodColours.join(',') : moodColours,
            whats_missing: whatsMissing,
            source: 'style_scan',
            ...attribution,
        });

        return NextResponse.json({ success: true, lead });
    } catch (error) {
        console.error('Stylist lead API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}
