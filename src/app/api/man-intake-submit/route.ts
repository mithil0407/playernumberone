// Man Intake Submit
// Saves form data server-side using supabaseAdmin to bypass RLS.

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
    persistManIntakeWithRollback,
    validateManIntakeSubmission,
} from '@/lib/manIntakeSubmission';

const PHOTO_BUCKET = 'man-intake-photos';

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
