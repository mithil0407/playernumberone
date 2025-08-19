import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  customer_id: string;
  amount: number;
  add_on: boolean;
  status: 'pending' | 'completed' | 'failed';
  payment_id?: string;
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
  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const saveOrder = async (order: Order) => {
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
