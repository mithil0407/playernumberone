// supabaseMan.ts — uses the main Supabase project, man_* tables

import { supabase as supabaseMain } from '@/lib/supabase';

export { supabaseMain as supabaseMan };

// ── Types ──────────────────────────────────────────────────────────────────

export interface ManIntakeSubmission {
    id?: string;
    customer_email?: string;
    customer_phone?: string;
    photo_fullbody_url?: string;
    photo_headshot_url?: string;
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
    modesty_level?: string;
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
    // Section 5 — Style
    style_goal?: string;
    visual_style_reference?: string;
    free_text_note?: string;
    created_at?: string;
}

// ── Database operations ────────────────────────────────────────────────────

export const saveManIntakeSubmission = async (submission: ManIntakeSubmission) => {
    const { data, error } = await supabaseMain
        .from('man_intake_submissions')
        .insert([submission])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const uploadManIntakePhoto = async (
    file: File,
    fileName: string
): Promise<string> => {
    const storagePath = `public/${fileName}`;

    const { data, error } = await supabaseMain.storage
        .from('man-intake-photos')
        .upload(storagePath, file, {
            upsert: true,
            contentType: 'image/jpeg',
        });

    if (error) throw error;

    const { data: publicData } = supabaseMain.storage
        .from('man-intake-photos')
        .getPublicUrl(data.path);

    return publicData.publicUrl;
};
