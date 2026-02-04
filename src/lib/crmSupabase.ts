import { createClient, SupabaseClient } from '@supabase/supabase-js';

// CRM Supabase configuration
const crmUrl = 'https://dedxszauqfaldmuwliqh.supabase.co';
const crmAnonKey = process.env.CRM_SUPABASE_ANON_KEY || '';

// Create CRM client
const mockCrmClient = {
    from: () => ({
        select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
        upsert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    })
} as unknown as SupabaseClient;

let crmSupabase: SupabaseClient = mockCrmClient;

if (crmAnonKey && crmAnonKey !== '') {
    try {
        crmSupabase = createClient(crmUrl, crmAnonKey);
        console.log('CRM Supabase client created successfully');
    } catch (error) {
        console.error('Failed to create CRM Supabase client:', error);
        crmSupabase = mockCrmClient;
    }
} else {
    console.warn('CRM Supabase anon key not configured, using mock client');
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
        // Check if CRM is configured
        if (!crmAnonKey || crmAnonKey === '') {
            console.log('CRM not configured, skipping sync');
            return { success: false, error: 'CRM not configured' };
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
