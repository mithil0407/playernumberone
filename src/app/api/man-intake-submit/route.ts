// Man Intake Submit
// Saves form data server-side using supabaseAdmin to bypass RLS.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
    persistManIntakeWithRollback,
    validateManIntakeSubmission,
} from '@/lib/manIntakeSubmission';
import {
    getManIntakeUploadStatuses,
    loadManIntakeUploadSession,
    MAN_INTAKE_PHOTO_BUCKET,
    readBearerToken,
    recordManIntakeUploadEvent,
    type ManIntakePhotoKind,
} from '@/lib/manIntakeUploadSession';

const PHOTO_BUCKET = 'man-intake-photos';

async function submitUploadSession(request: NextRequest, body: Record<string, unknown>) {
    const sessionId = typeof body.upload_session_id === 'string' ? body.upload_session_id : '';
    const token = readBearerToken(request);
    const session = await loadManIntakeUploadSession(sessionId, token, { allowSubmitted: true });

    const existing = await supabaseAdmin
        .from('man_intake_submissions')
        .select('*')
        .eq('upload_session_id', session.id)
        .limit(1)
        .maybeSingle();
    if (existing.data) {
        return NextResponse.json({ success: true, data: existing.data, idempotent: true });
    }
    if (session.status === 'submitted') {
        return NextResponse.json({
            success: false,
            code: 'INTAKE_SAVE_FAILED',
            error: 'This intake upload session was already submitted.',
        }, { status: 409 });
    }

    const statuses = await getManIntakeUploadStatuses(session);
    const byKind = new Map(statuses.map((photo) => [photo.kind, photo]));
    for (const required of ['fullbody', 'headshot'] as ManIntakePhotoKind[]) {
        const photo = byKind.get(required);
        if (!photo?.completed) {
            return invalidIntake(`${required === 'fullbody' ? 'Full body photo' : 'Headshot'} has not finished uploading.`);
        }
    }

    const answers = body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers)
        ? body.answers as Record<string, unknown>
        : {};
    const publicUrl = (kind: ManIntakePhotoKind) => {
        const photo = byKind.get(kind);
        if (!photo?.completed) return null;
        return supabaseAdmin.storage.from(MAN_INTAKE_PHOTO_BUCKET).getPublicUrl(photo.path).data.publicUrl;
    };
    const payload = {
        ...answers,
        photo_fullbody_url: publicUrl('fullbody'),
        photo_headshot_url: publicUrl('headshot'),
        ...(publicUrl('side_profile') ? { photo_side_profile_url: publicUrl('side_profile') } : {}),
    };
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const validation = validateManIntakeSubmission(payload, supabaseUrl);
    if (!validation.ok) return invalidIntake(validation.error);

    const inserted = await supabaseAdmin
        .from('man_intake_submissions')
        .insert([{ ...validation.data, upload_session_id: session.id }])
        .select()
        .single();

    if (inserted.error) {
        if (inserted.error.code === '23505') {
            const duplicate = await supabaseAdmin
                .from('man_intake_submissions')
                .select('*')
                .eq('upload_session_id', session.id)
                .single();
            if (duplicate.data) return NextResponse.json({ success: true, data: duplicate.data, idempotent: true });
        }
        console.error('Man intake session persistence failed', {
            sessionId: session.id,
            code: inserted.error.code,
            message: inserted.error.message,
        });
        return NextResponse.json({
            success: false,
            code: 'INTAKE_SAVE_FAILED',
            error: 'We could not save your intake. Your uploaded photos and answers are preserved; please retry.',
        }, { status: 500 });
    }

    const submittedAt = new Date().toISOString();
    const sessionUpdate = await supabaseAdmin.from('man_intake_upload_sessions').update({
        status: 'submitted',
        submitted_at: submittedAt,
        updated_at: submittedAt,
    }).eq('id', session.id);
    if (sessionUpdate.error) {
        console.error('Man intake upload session finalization failed', { sessionId: session.id, message: sessionUpdate.error.message });
    }
    void recordManIntakeUploadEvent({ session, event: 'submitted' }).catch((eventError) => {
        console.warn('Man intake submitted event failed', { sessionId: session.id, message: eventError instanceof Error ? eventError.message : String(eventError) });
    });
    return NextResponse.json({ success: true, data: inserted.data });
}

function invalidIntake(error: string) {
    return NextResponse.json({
        success: false,
        code: 'INVALID_INTAKE',
        error,
    }, { status: 400 });
}

export async function POST(request: NextRequest) {
    try {
        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return invalidIntake('The request body must be valid JSON.');
        }

        if (body && typeof body === 'object' && !Array.isArray(body) && 'upload_session_id' in body) {
            return submitUploadSession(request, body as Record<string, unknown>);
        }

        console.info('man_intake_legacy_submit', { userAgent: request.headers.get('user-agent')?.slice(0, 120) || null });
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const validation = validateManIntakeSubmission(body, supabaseUrl);
        if (!validation.ok) {
            return invalidIntake(validation.error);
        }

        const result = await persistManIntakeWithRollback({
            submission: validation.data,
            supabaseUrl,
            insert: async (payload) => {
                const { data, error } = await supabaseAdmin
                    .from('man_intake_submissions')
                    .insert([payload])
                    .select()
                    .single();
                return { data, error };
            },
            remove: async (paths) => {
                const { error } = await supabaseAdmin.storage.from(PHOTO_BUCKET).remove(paths);
                return { error };
            },
        });

        if (result.error) {
            console.error('Man intake persistence failed', {
                stage: 'database_insert',
                code: result.error.code,
                message: result.error.message,
                details: result.error.details,
                hint: result.error.hint,
                uploadedPhotosRolledBack: result.removedPaths.length,
            });
            if (result.cleanupError) {
                console.error('Man intake photo rollback failed', {
                    stage: 'storage_cleanup',
                    code: result.cleanupError.code,
                    message: result.cleanupError.message,
                    details: result.cleanupError.details,
                    hint: result.cleanupError.hint,
                });
            }
            return NextResponse.json({
                success: false,
                code: 'INTAKE_SAVE_FAILED',
                error: 'We could not save your intake. Your answers are still on this page; please retry.',
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: result.data });
    } catch (error) {
        console.error('Man intake submit API error:', error);
        return NextResponse.json({
            success: false,
            code: 'INTAKE_SAVE_FAILED',
            error: 'We could not save your intake. Your answers are still on this page; please retry.',
        }, { status: 500 });
    }
}
