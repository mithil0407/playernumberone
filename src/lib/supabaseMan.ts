// supabaseMan.ts — uses the main Supabase project, man_* tables

import { supabase as supabaseMain } from '@/lib/supabase';
import { getManIntakePhotoValidationError } from '@/lib/manIntakePhoto';

export { getManIntakePhotoValidationError, MAN_INTAKE_MAX_PHOTO_BYTES } from '@/lib/manIntakePhoto';

export { supabaseMain as supabaseMan };

// ── Types ──────────────────────────────────────────────────────────────────

export interface ManIntakeSubmission {
    id?: string;
    customer_email?: string;
    customer_phone?: string;
    photo_fullbody_url?: string;
    photo_headshot_url?: string;
    photo_side_profile_url?: string;
    // Section 1 — Basics
    primary_goal?: string;
    style_relationship?: string;
    dressing_context?: string;
    location_tier?: string;
    // Section 2 — Body
    height_category?: string;
    body_shape?: string;
    fat_storage_zone?: string;
    highlight_zone?: string;
    minimise_zone?: string;
    fit_preference?: string;
    wardrobe_composition?: string;
    // Section 3 — Colour
    skin_tone?: string;
    vein_undertone?: string;
    white_test?: string;
    hair_colour?: string;
    eye_colour?: string;
    derived_colour_season?: string;
    // Section 4 — Face
    face_shape?: string;
    facial_feature_type?: string;
    // Section 5 — Style Identity
    primary_style_goal?: string;
    branch_answer?: string;
    style_tribes?: string;
    style_pole_structure?: string;
    style_pole_expression?: string;
    style_pole_tone?: string;
    style_pole_register?: string;
    style_blocker?: string;
    style_anti_pref?: string;
    style_anti_pref_note?: string;
    free_text_note?: string;
    created_at?: string;
}

// ── Database operations ────────────────────────────────────────────────────

export type ManIntakeApiErrorCode = 'INVALID_INTAKE' | 'INTAKE_SAVE_FAILED' | 'UNKNOWN_ERROR';

export class ManIntakeApiError extends Error {
    code: ManIntakeApiErrorCode;
    status: number;

    constructor(message: string, code: ManIntakeApiErrorCode = 'UNKNOWN_ERROR', status = 500) {
        super(message);
        this.name = 'ManIntakeApiError';
        this.code = code;
        this.status = status;
    }
}

export const saveManIntakeSubmission = async (submission: ManIntakeSubmission) => {
    const response = await fetch('/api/man-intake-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
    });

    const result = await response.json().catch(() => ({})) as {
        data?: ManIntakeSubmission;
        error?: string;
        code?: ManIntakeApiErrorCode;
    };
    if (!response.ok) {
        throw new ManIntakeApiError(
            result.error || 'Failed to save intake submission',
            result.code || 'UNKNOWN_ERROR',
            response.status,
        );
    }
    return result.data;
};

export const uploadManIntakePhoto = async (
    file: File,
    fileName: string
): Promise<string> => {
    const validationError = getManIntakePhotoValidationError(file);
    if (validationError) throw new Error(validationError);

    const storagePath = `public/${fileName}`;
    const contentType = file.type || 'application/octet-stream';

    const { data, error } = await supabaseMain.storage
        .from('man-intake-photos')
        .upload(storagePath, file, {
            upsert: true,
            contentType,
        });

    if (error) throw error;

    const { data: publicData } = supabaseMain.storage
        .from('man-intake-photos')
        .getPublicUrl(data.path);

    return publicData.publicUrl;
};
