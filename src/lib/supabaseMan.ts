// supabaseMan.ts — uses the same Supabase project, man_* tables

import { supabaseAU } from '@/lib/supabaseAU';

export { supabaseAU as supabaseMan };

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
    const { data, error } = await supabaseAU
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

    const { data, error } = await supabaseAU.storage
        .from('man-intake-photos')
        .upload(storagePath, file, {
            upsert: true,
            contentType: 'image/jpeg',
        });

    if (error) throw error;

    const { data: publicData } = supabaseAU.storage
        .from('man-intake-photos')
        .getPublicUrl(data.path);

    return publicData.publicUrl;
};
