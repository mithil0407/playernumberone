import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseAUUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_AU || 'https://placeholder.supabase.co';
const supabaseAUAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_AU || 'placeholder-key';

// Create a mock client for build time
const mockSupabaseClient = {
    from: () => ({
        select: () => ({ order: () => ({ data: [], error: null }) }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
        upsert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        eq: () => ({ single: () => ({ data: null, error: null }) })
    }),
    storage: {
        from: () => ({
            upload: () => ({ data: null, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: '' } })
        })
    }
} as unknown as SupabaseClient;

const hasValidAUEnvVars =
    process.env.NEXT_PUBLIC_SUPABASE_URL_AU &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_AU &&
    process.env.NEXT_PUBLIC_SUPABASE_URL_AU !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_AU !== 'placeholder-key';

let supabaseAU: SupabaseClient = mockSupabaseClient;

if (hasValidAUEnvVars) {
    try {
        supabaseAU = createClient(supabaseAUUrl, supabaseAUAnonKey);
        console.log('AU Supabase client created successfully');
    } catch (error) {
        console.error('Failed to create AU Supabase client:', error);
        supabaseAU = mockSupabaseClient;
    }
} else {
    console.warn('AU Supabase environment variables not configured, using mock client');
}

export { supabaseAU };

// ── Types ──────────────────────────────────────────────────────────────────

export interface AUCustomer {
    id?: string;
    name: string;
    email: string;
    phone: string;
    created_at?: string;
}

export interface AUOrder {
    id?: string;
    customer_id?: string;
    customer_email?: string;
    amount?: number;
    currency?: string;
    iconik_edit_addon?: boolean;
    status?: 'pending' | 'completed' | 'failed' | 'paid';
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    created_at?: string;
}

export interface AUIntakeSubmission {
    id?: string;
    customer_email?: string;
    customer_phone?: string;
    photo_fullbody_url?: string;
    photo_headshot_url?: string;
    skin_undertone?: string;
    body_shape?: string;
    face_shape?: string;
    hair_type?: string; // comma-separated
    lifestyle?: string;
    style_restrictions?: string; // comma-separated
    outfit_mix?: string;
    extra_notes?: string;
    created_at?: string;
}

// ── Database operations ────────────────────────────────────────────────────

export const saveAUCustomer = async (customer: AUCustomer) => {
    const { data, error } = await supabaseAU
        .from('au_customers')
        .upsert([customer], { onConflict: 'email', ignoreDuplicates: false })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const saveAUOrder = async (order: AUOrder) => {
    if (order.razorpay_order_id) {
        const { data: existing } = await supabaseAU
            .from('au_orders')
            .select('id')
            .eq('razorpay_order_id', order.razorpay_order_id)
            .single();

        if (existing) {
            const { data, error } = await supabaseAU
                .from('au_orders')
                .update(order)
                .eq('razorpay_order_id', order.razorpay_order_id)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    const { data, error } = await supabaseAU
        .from('au_orders')
        .insert([order])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const saveAUIntakeSubmission = async (submission: AUIntakeSubmission) => {
    const { data, error } = await supabaseAU
        .from('au_intake_submissions')
        .insert([submission])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const uploadAUIntakePhoto = async (
    file: File,
    fileName: string
): Promise<string> => {
    // Bucket policy requires files to be under public/ folder with .jpg extension
    const storagePath = `public/${fileName}`;

    const { data, error } = await supabaseAU.storage
        .from('au-intake-photos')
        .upload(storagePath, file, {
            upsert: true,
            contentType: 'image/jpeg', // required: bucket policy checks extension = 'jpg'
        });

    if (error) throw error;

    const { data: publicData } = supabaseAU.storage
        .from('au-intake-photos')
        .getPublicUrl(data.path);

    return publicData.publicUrl;
};
