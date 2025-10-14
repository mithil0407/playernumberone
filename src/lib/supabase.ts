import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use a valid placeholder URL to avoid build errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Create a mock client for build time that matches SupabaseClient interface
const mockSupabaseClient = {
  from: () => ({
    select: () => ({ order: () => ({ data: [], error: null }) }),
    insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
    update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
    eq: () => ({ single: () => ({ data: null, error: null }) })
  })
} as unknown as SupabaseClient;

// Only create real client if we have valid environment variables
let supabase: SupabaseClient = mockSupabaseClient;

// Check if we have valid env vars
const hasValidEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                       process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key';

if (hasValidEnvVars) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client created successfully');
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    supabase = mockSupabaseClient;
  }
} else {
  console.warn('Supabase environment variables not properly configured, using mock client');
}

export { supabase };

// Types for our database
export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  created_at?: string;
}

export interface Order {
  id?: string;
  customer_id?: string;
  customer_email?: string;
  amount?: number;
  add_on?: boolean;
  status?: 'pending' | 'completed' | 'failed' | 'paid';
  payment_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_method?: string;
  error_code?: string;
  error_description?: string;
  created_at?: string;
}

export interface Session {
  id?: string;
  customer_id: string;
  order_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
}

// Database operations
export const saveCustomer = async (customer: Customer) => {
  // OPTIMIZATION #2: Use UPSERT (single query instead of SELECT + INSERT)
  // This uses PostgreSQL's ON CONFLICT clause for atomic upsert
  const { data, error } = await supabase
    .from('customers')
    .upsert(
      [customer],
      { 
        onConflict: 'email',  // Conflict on email column (must have unique constraint)
        ignoreDuplicates: false  // Update if exists
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const saveOrder = async (order: Order) => {
  // If razorpay_order_id exists, try to update existing record first
  if (order.razorpay_order_id) {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('razorpay_order_id', order.razorpay_order_id)
      .single();

    if (existingOrder) {
      // Update existing order
      const { data, error } = await supabase
        .from('orders')
        .update(order)
        .eq('razorpay_order_id', order.razorpay_order_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  // Insert new order
  const { data, error } = await supabase
    .from('orders')
    .insert([order])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const saveSession = async (session: Session) => {
  const { data, error } = await supabase
    .from('sessions')
    .insert([session])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCustomerByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};
