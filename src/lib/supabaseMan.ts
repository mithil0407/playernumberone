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
    frustrations?: string;
    frustrations_custom?: string;
    situations?: string;
    body_concerns?: string;
    wardrobe_type?: string;
    colour_preference?: string;
    style_aesthetics?: string;
    style_outcome?: string;
    hair_type?: string;
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
