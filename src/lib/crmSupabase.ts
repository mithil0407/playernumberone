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
        scan_lead_id?: string;
        style_scan?: Record<string, unknown>;
    };
    notes?: string;
    status?: 'waiting_images' | 'in_progress' | 'review' | 'delivered' | 'stalled';
    stylist_id?: string;
    created_at?: string;
}

function normalizedCrmPhone(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    return digits || value.trim();
}

function crmPhoneVariants(value: string) {
    const normalized = normalizedCrmPhone(value);
    return [...new Set([value.trim(), normalized, normalized.length === 10 ? `91${normalized}` : '', normalized.length === 10 ? `+91${normalized}` : ''].filter(Boolean))];
}

// Sync customer to CRM
export async function syncToCrm(data: {
    customer_name: string;
    customer_phone: string;
    add_ons: string;
    order_amount?: number;
    notes?: string;
    scan_lead_id?: string | null;
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

        const normalizedPhone = normalizedCrmPhone(data.customer_phone);
        const phoneVariants = crmPhoneVariants(data.customer_phone);

        // A limited maybeSingle query remains valid even if historical webhook
        // retries already created duplicate rows. `.single()` returned the same
        // error for zero and multiple rows, causing every retry to insert again.
        const { data: existingConsultation, error: fetchError } = await crmSupabase
            .from('consultations')
            .select('id, client_data, notes')
            .in('client_phone', phoneVariants)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching existing consultation:', fetchError);
            return { success: false, error: fetchError.message };
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
            let styleScan: Record<string, unknown> | null = null;
            if (data.scan_lead_id) {
                const { data: scan } = await crmSupabase
                    .from('style_scan_leads')
                    .select('id, scan_answers, photo_paths, scan_analysis, phone_e164')
                    .eq('id', data.scan_lead_id)
                    .maybeSingle();
                styleScan = scan as Record<string, unknown> | null;
            }
            const { data: created, error: createError } = await crmSupabase
                .from('consultations')
                .insert({
                    client_name: data.customer_name,
                    client_phone: normalizedPhone,
                    client_data: {
                        addons: addonsArray,
                        order_amount: data.order_amount,
                        order_date: new Date().toISOString(),
                        source: 'iconik_checkout',
                        scan_lead_id: data.scan_lead_id || undefined,
                        style_scan: styleScan || undefined,
                    },
                    notes: data.notes || (data.scan_lead_id ? 'Created from ₹2,699 checkout with linked ICONIK Style Scan.' : 'Created from ICONIK checkout.'),
                    status: 'waiting_images',
                })
                .select('id')
                .single();
            if (createError || !created?.id) {
                console.error('Error creating CRM consultation:', createError);
                return { success: false, error: createError?.message || 'Consultation creation failed' };
            }
            // Close the remaining cross-instance race: after inserting, retain
            // the earliest matching row and remove only this newly-created empty
            // shell if another request won the race.
            const { data: matchingRows } = await crmSupabase
                .from('consultations')
                .select('id, created_at')
                .in('client_phone', crmPhoneVariants(normalizedPhone))
                .order('created_at', { ascending: true })
                .order('id', { ascending: true })
                .limit(10);
            const canonicalId = matchingRows?.[0]?.id;
            if (canonicalId && canonicalId !== created.id) {
                await crmSupabase.from('consultations').delete().eq('id', created.id);
                console.log('Duplicate CRM consultation shell removed:', created.id);
                return { success: true, consultation_id: canonicalId };
            }
            console.log('CRM consultation created:', created.id);
            return { success: true, consultation_id: created.id };
        }
    } catch (error) {
        console.error('CRM sync error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
