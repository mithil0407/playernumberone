import { createClient, SupabaseClient } from '@supabase/supabase-js';

type CrmSupabaseConfig = {
    url: string;
    key: string;
    source: 'main-service-role' | 'main-anon' | 'legacy-crm';
};

function resolveCrmSupabaseConfig(): CrmSupabaseConfig | null {
    const mainUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const mainServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const mainAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const legacyCrmUrl = process.env.CRM_SUPABASE_URL;
    const legacyCrmAnonKey = process.env.CRM_SUPABASE_ANON_KEY;

    if (mainUrl && mainServiceKey) {
        return { url: mainUrl, key: mainServiceKey, source: 'main-service-role' };
    }

    if (mainUrl && mainAnonKey) {
        return { url: mainUrl, key: mainAnonKey, source: 'main-anon' };
    }

    if (legacyCrmUrl && legacyCrmAnonKey) {
        return { url: legacyCrmUrl, key: legacyCrmAnonKey, source: 'legacy-crm' };
    }

    return null;
}

// Create CRM client
const mockCrmClient = {
    storage: {
        from: () => ({
            upload: async () => ({ data: null, error: { message: 'CRM not configured' } }),
            createSignedUploadUrl: async () => ({ data: null, error: { message: 'CRM not configured' } }),
            info: async () => ({ data: null, error: { message: 'CRM not configured' } }),
        }),
    },
    from: () => ({
        select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
        upsert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    })
} as unknown as SupabaseClient;

let crmSupabase: SupabaseClient = mockCrmClient;
const crmSupabaseConfig = resolveCrmSupabaseConfig();

if (crmSupabaseConfig) {
    try {
        crmSupabase = createClient(crmSupabaseConfig.url, crmSupabaseConfig.key);
        console.log(`CRM compatibility Supabase client created using ${crmSupabaseConfig.source}`);
    } catch (error) {
        console.error('Failed to create CRM compatibility Supabase client:', error);
        crmSupabase = mockCrmClient;
    }
} else {
    console.warn('CRM compatibility Supabase client not configured, using mock client');
}

export const isCrmSupabaseConfigured = Boolean(crmSupabaseConfig);

export function assertCrmSupabaseConfigured() {
    if (!isCrmSupabaseConfigured) {
        throw new Error('Supabase is not configured for CRM compatibility writes. Set NEXT_PUBLIC_SUPABASE_URL with SUPABASE_SERVICE_ROLE_KEY, or set CRM_SUPABASE_URL with CRM_SUPABASE_ANON_KEY.');
    }
}

export { crmSupabase };

// Consultation interface matching CRM table structure
export interface Consultation {
    id?: string;
    client_name: string;
    client_phone: string;
    client_data?: {
        addons?: string[];
        order_amount?: number;
        order_date?: string;
        source?: string;
    };
    notes?: string;
    status?: 'waiting_images' | 'in_progress' | 'review' | 'delivered' | 'stalled';
    stylist_id?: string;
    created_at?: string;
}

// Sync customer to CRM
export async function syncToCrm(data: {
    customer_name: string;
    customer_phone: string;
    add_ons: string;
    order_amount?: number;
    notes?: string;
}): Promise<{ success: boolean; error?: string; consultation_id?: string }> {
    try {
        if (!isCrmSupabaseConfigured) {
            console.log('CRM compatibility Supabase client not configured, skipping sync');
            return { success: false, error: 'CRM compatibility Supabase client not configured' };
        }

        // Parse add-ons string into array
        const addonsArray = data.add_ons && data.add_ons !== 'None'
            ? data.add_ons.split(', ').map(a => a.trim())
            : [];

        // Check if consultation already exists by phone
        const { data: existingConsultation, error: fetchError } = await crmSupabase
            .from('consultations')
            .select('id, client_data, notes')
            .eq('client_phone', data.customer_phone)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            // PGRST116 = no rows found, which is expected for new customers
            console.error('Error fetching existing consultation:', fetchError);
        }

        if (existingConsultation) {
            // Update existing consultation - ONLY merge addons, preserve all other data
            const existingAddons = existingConsultation.client_data?.addons || [];
            const mergedAddons = [...new Set([...existingAddons, ...addonsArray])];

            // Preserve all existing client_data, only update the addons field
            const updatedClientData = {
                ...existingConsultation.client_data,
                addons: mergedAddons
            };

            const { error: updateError } = await crmSupabase
                .from('consultations')
                .update({
                    client_data: updatedClientData
                })
                .eq('id', existingConsultation.id);

            if (updateError) {
                console.error('Error updating CRM consultation:', updateError);
                return { success: false, error: updateError.message };
            }

            console.log('CRM consultation updated with addons:', existingConsultation.id);
            return { success: true, consultation_id: existingConsultation.id };
        } else {
            // No matching phone found - skip (don't create new records)
            console.log('No matching consultation found for phone:', data.customer_phone);
            return { success: false, error: 'No matching consultation found' };
        }
    } catch (error) {
        console.error('CRM sync error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
