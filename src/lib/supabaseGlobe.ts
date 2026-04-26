// supabaseGlobe.ts — uses the same Supabase project as AU but with globe_* tables

import { supabaseAU } from '@/lib/supabaseAU';

// Re-export for convenience — globe shares the same Supabase instance as AU
export { supabaseAU as supabaseGlobe };

// ── Types ──────────────────────────────────────────────────────────────────

export interface GlobeCustomer {
    id?: string;
    name: string;
    email: string;
    phone: string;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_term?: string | null;
    utm_content?: string | null;
    referrer?: string | null;
    landing_page?: string | null;
    first_touch_at?: string | null;
    attribution_payload?: Record<string, unknown> | null;
    created_at?: string;
}

export interface GlobeOrder {
    id?: string;
    customer_id?: string;
    customer_email?: string;
    customer_name?: string;
    customer_phone?: string;
    amount?: number;
    currency?: string;
    iconik_edit_addon?: boolean;
    status?: 'pending' | 'completed' | 'failed' | 'paid';
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_term?: string | null;
    utm_content?: string | null;
    referrer?: string | null;
    landing_page?: string | null;
    first_touch_at?: string | null;
    attribution_payload?: Record<string, unknown> | null;
    created_at?: string;
}

export interface GlobeSubscription {
    id?: string;
    customer_id?: string;
    customer_email: string;
    customer_phone?: string;
    customer_name?: string;
    plan_type: 'monthly' | 'annual';
    plan_id: string;
    razorpay_subscription_id?: string;
    razorpay_payment_id?: string;
    amount: number;
    currency?: string;
    status?: 'pending' | 'active' | 'cancelled' | 'completed' | 'expired';
    source?: string;
    notes?: string;
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_term?: string | null;
    utm_content?: string | null;
    referrer?: string | null;
    landing_page?: string | null;
    first_touch_at?: string | null;
    attribution_payload?: Record<string, unknown> | null;
    created_at?: string;
    updated_at?: string;
}

export interface GlobeIntakeSubmission {
    id?: string;
    customer_email?: string;
    customer_phone?: string;
    photo_fullbody_url?: string;
    photo_headshot_url?: string;
    // Legacy fields (kept for historical rows)
    frustrations?: string;
    frustrations_custom?: string;
    situations?: string;
    body_insecurities?: string;
    wardrobe_type?: string;
    colour_preference?: string;
    style_aesthetics?: string;
    style_outcome?: string;
    style_restrictions?: string;
    hair_type?: string;
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
    // Section 5 — Style (legacy, kept for historical rows)
    style_goal?: string;
    visual_style_reference?: string;
    // Section 5 — Style (current)
    primary_style_goal?: string;
    branch_sub_goal?: string;
    branch_blocker?: string;
    branch_reference?: string;
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

export const saveGlobeCustomer = async (customer: GlobeCustomer) => {
    const { data, error } = await supabaseAU
        .from('globe_customers')
        .upsert([customer], { onConflict: 'email', ignoreDuplicates: false })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const saveGlobeOrder = async (order: GlobeOrder) => {
    if (order.razorpay_order_id) {
        const { data: existing } = await supabaseAU
            .from('globe_orders')
            .select('id')
            .eq('razorpay_order_id', order.razorpay_order_id)
            .single();

        if (existing) {
            const { data, error } = await supabaseAU
                .from('globe_orders')
                .update(order)
                .eq('razorpay_order_id', order.razorpay_order_id)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    const { data, error } = await supabaseAU
        .from('globe_orders')
        .insert([order])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const saveGlobeSubscription = async (subscription: GlobeSubscription) => {
    if (subscription.razorpay_subscription_id) {
        const { data: existing } = await supabaseAU
            .from('globe_subscriptions')
            .select('id')
            .eq('razorpay_subscription_id', subscription.razorpay_subscription_id)
            .single();

        if (existing) {
            const { data, error } = await supabaseAU
                .from('globe_subscriptions')
                .update({ ...subscription, updated_at: new Date().toISOString() })
                .eq('razorpay_subscription_id', subscription.razorpay_subscription_id)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    const { data, error } = await supabaseAU
        .from('globe_subscriptions')
        .insert([subscription])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const saveGlobeIntakeSubmission = async (submission: GlobeIntakeSubmission) => {
    const { data, error } = await supabaseAU
        .from('globe_intake_submissions')
        .insert([submission])
        .select()
        .single();

    if (error) throw error;

    // Mark quiz reminder no longer needed
    if (submission.customer_email) {
        await supabaseAU
            .from('globe_orders')
            .update({ quiz_reminder_sent: true })
            .eq('customer_email', submission.customer_email)
            .eq('status', 'paid')
            .eq('quiz_reminder_sent', false);
    }

    return data;
};

export const uploadGlobeIntakePhoto = async (
    file: File,
    fileName: string
): Promise<string> => {
    const storagePath = `public/${fileName}`;

    const { data, error } = await supabaseAU.storage
        .from('globe-intake-photos')
        .upload(storagePath, file, {
            upsert: true,
            contentType: 'image/jpeg',
        });

    if (error) throw error;

    const { data: publicData } = supabaseAU.storage
        .from('globe-intake-photos')
        .getPublicUrl(data.path);

    return publicData.publicUrl;
};
