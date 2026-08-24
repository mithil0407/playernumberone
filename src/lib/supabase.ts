import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use a valid placeholder URL to avoid build errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

// Server-side admin client — bypasses RLS entirely
// ONLY use in server-side API routes, NEVER expose to the client
let supabaseAdmin: SupabaseClient = mockSupabaseClient;

const hasAdminEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL &&
  supabaseServiceKey &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';

if (hasAdminEnvVars) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey!);
    console.log('Supabase admin client created successfully');
  } catch (error) {
    console.error('Failed to create Supabase admin client:', error);
    supabaseAdmin = mockSupabaseClient;
  }
}

export { supabase, supabaseAdmin };

// Types for our database
export interface Customer {
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

export interface Order {
  id?: string;
  customer_id?: string;
  customer_email?: string;
  amount?: number;
  add_on?: boolean;
  add_ons?: string; // Comma-separated list of purchased add-ons
  product_type?: string; // Type of order: consultation, subscription, etc.
  scan_lead_id?: string | null;
  report_variant?: 'personal_20' | 'instant_10';
  status?: 'pending' | 'completed' | 'failed' | 'paid';
  payment_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  payment_method?: string;
  error_code?: string;
  error_description?: string;
  email_sent?: boolean; // Prevents duplicate confirmation emails on webhook retries
  whatsapp_opt_in?: boolean;
  whatsapp_consent_at?: string | null;
  whatsapp_confirmation_sent?: boolean;
  whatsapp_confirmation_sent_at?: string | null;
  whatsapp_message_id?: string | null;
  whatsapp_last_error?: string | null;
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

export interface Session {
  id?: string;
  customer_id: string;
  order_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
}

export interface Subscription {
  id?: string;
  customer_id?: string;
  customer_email: string;
  customer_phone?: string;
  customer_name?: string;
  plan_type: 'monthly' | 'quarterly' | 'yearly';
  plan_id: string;
  razorpay_subscription_id?: string;
  amount: number; // Amount in paise
  currency?: string;
  status?: 'active' | 'paused' | 'cancelled' | 'expired' | 'pending';
  start_date?: string;
  end_date?: string;
  next_billing_date?: string;
  cancelled_at?: string;
  notes?: string;
  original_order_id?: string;
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

// Database operations — use supabaseAdmin to bypass RLS on server-side routes
export const saveCustomer = async (customer: Customer) => {
  // OPTIMIZATION #2: Use UPSERT (single query instead of SELECT + INSERT)
  // This uses PostgreSQL's ON CONFLICT clause for atomic upsert
  // Uses admin client to bypass RLS policies on the customers table
  const { data, error } = await supabaseAdmin
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
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('razorpay_order_id', order.razorpay_order_id)
      .single();

    if (existingOrder) {
      // Update existing order
      const { data, error } = await supabaseAdmin
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
  const { data, error } = await supabaseAdmin
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

// Subscription operations
export const saveSubscription = async (subscription: Subscription) => {
  // If razorpay_subscription_id exists, try to update existing record first
  if (subscription.razorpay_subscription_id) {
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('razorpay_subscription_id', subscription.razorpay_subscription_id)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update(subscription)
        .eq('razorpay_subscription_id', subscription.razorpay_subscription_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  // Insert new subscription
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .insert([subscription])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSubscriptionByEmail = async (email: string) => {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('customer_email', email)
    .order('created_at', { ascending: false });

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const getActiveSubscriptionByEmail = async (email: string) => {
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('customer_email', email)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

// ─────────────────────────────────────────────────────────────
// Iconik Club types
// ─────────────────────────────────────────────────────────────

export type ItemCategory =
  | 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes'
  | 'bag' | 'accessory' | 'jumpsuit' | 'skirt' | 'other';

// Structured tags extracted by AI during item ingestion.
// Used for rule-based catalog matching in Phase 3 outfit generation.
// Replaces reliance on prose style_description for matching decisions.
export interface FashionItemStyleTags {
  silhouette_type: 'A-line' | 'fitted' | 'relaxed' | 'flowy' | 'structured' | 'boxy' | 'tailored' | 'oversized' | 'wrap' | 'sheath' | 'column';
  length: 'crop' | 'hip' | 'midi' | 'maxi' | 'full' | 'knee' | 'ankle' | 'mini' | null;
  neckline: 'crew' | 'v-neck' | 'scoop' | 'boat' | 'square' | 'halter' | 'cowl' | 'polo' | 'mandarin' | 'sweetheart' | 'off-shoulder' | 'none' | null;
  fit_category: 'slim' | 'regular' | 'relaxed' | 'oversized';
  visual_weight: 'light' | 'medium' | 'heavy';
  sleeve_type: 'sleeveless' | 'cap' | 'short' | '3-quarter' | 'full' | 'none' | null;
  coverage: Array<'arms_covered' | 'tummy_covered' | 'tummy_skimming' | 'tummy_exposed' | 'knee_below' | 'knee_above' | 'shoulders_covered' | 'back_covered'>;
  occasion_tags: Array<'casual' | 'work' | 'evening' | 'weekend' | 'formal' | 'party'>;
  undertone_compatibility: Array<'warm' | 'cool' | 'neutral' | 'deep-warm' | 'olive'>;
  fabric_weight: 'light' | 'medium' | 'heavy';
  pattern: 'solid' | 'stripe' | 'check' | 'floral' | 'abstract' | 'geometric' | 'animal-print' | 'embroidered' | 'textured' | 'printed';
}

export type ItemStatus = 'active' | 'archived' | 'draft';

export type OutfitOccasion = 'casual' | 'work' | 'evening' | 'weekend' | 'formal' | 'party';

export type OutfitSeason = 'summer' | 'winter' | 'monsoon' | 'all-season';

export type OutfitStatus = 'pending' | 'generating' | 'ready' | 'failed';

export type BodyShape =
  | 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'inverted-triangle';

export type BudgetLevel = 'high' | 'mid' | 'low';

export type ColourTemperature = 'warm' | 'cool' | 'neutral';
export type ColourDepth = 'light' | 'medium' | 'deep';
export type ColourSaturation = 'soft' | 'balanced' | 'rich';
export type StructurePreference =
  | 'layer-led' | 'waist-defined' | 'top-structured'
  | 'bottom-weighted' | 'elongating' | 'balanced';
export type FitPreference = 'relaxed' | 'regular' | 'fitted';
export type DisruptorStyle = 'chromatic' | 'structural' | 'accessory' | 'footwear';
export type DisruptorTolerance = 'subtle' | 'moderate';

export interface PreferenceProfile {
  profileVersion: string;
  tasteSummary: string;
  colour: {
    temperature: ColourTemperature;
    depth: ColourDepth;
    saturation: ColourSaturation;
    undertone: 'warm' | 'cool' | 'neutral' | 'deep-warm' | 'olive';
    preferredColours: string[];
    avoidedColours: string[];
    anchorNeutrals: string[];
  };
  silhouette: {
    family: 'apple' | 'pear' | 'hourglass' | 'rectangle' | 'inverted-triangle' | 'petite' | 'plus';
    structurePreference: StructurePreference;
    fitPreference: FitPreference;
    preferredCuts: string[];
    avoidCuts: string[];
  };
  styling: {
    footwearLanguage: string[];
    bagLanguage: string[];
    accessoryLanguage: string[];
    disruptorStyle: DisruptorStyle;
    disruptorTolerance: DisruptorTolerance;
    modestyRules: string[];
    signatureCodes: string[];
    antiCodes: string[];
  };
  occasionDirectives: Record<OutfitOccasion, string>;
}

export interface CatalogCandidate {
  id: string;
  name: string;
  category: ItemCategory | 'piece';
  score: number;
  reasons: string[];
  color?: string[];
  material?: string[];
}

export interface CatalogCandidatePool {
  occasion: OutfitOccasion;
  slot: 'singlePiece' | 'top' | 'layer' | 'bottom' | 'shoes' | 'bag' | 'accessory';
  candidates: CatalogCandidate[];
}

export interface MatchDiagnostics {
  selectionSource: 'model' | 'repair';
  candidatePools: CatalogCandidatePool[];
  slotSelections?: Record<string, string | null>;
  notes?: string[];
}

export interface FashionItem {
  id?: string;
  raw_description?: string;
  raw_image_url?: string;
  brand?: string;
  item_name: string;
  category?: ItemCategory;
  color?: string[];
  material?: string[];
  price?: number;
  currency?: string;
  size_availability?: string[];
  purchase_link?: string;
  style_description?: string;
  style_tags?: FashionItemStyleTags;
  image_url: string;
  ai_confidence?: number;
  ai_raw_response?: Record<string, unknown>;
  status?: ItemStatus;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClientProfile {
  id?: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  headshot_url?: string;
  body_photo_url?: string;
  height_cm?: number;
  weight_kg?: number;
  bust_cm?: number;
  waist_cm?: number;
  hips_cm?: number;
  body_shape?: BodyShape;
  budget_level?: BudgetLevel;
  size_estimate?: string;
  visual_profile?: string;
  style_notes?: string;
  style_restrictions?: string[];
  liked_outfit_examples?: string[];
  preference_profile?: PreferenceProfile;
  preference_profile_version?: string;
  preference_profile_updated_at?: string;
  subscription_id?: string;
  onboarding_complete?: boolean;
  preview_token?: string;
  token_expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OutfitSet {
  id?: string;
  client_id: string;
  outfit_card_url?: string;
  ai_style_note?: string;
  occasion?: OutfitOccasion;
  season?: OutfitSeason;
  status?: OutfitStatus;
  generation_batch?: number;
  error_message?: string;
  generation_version?: string;
  preference_profile_snapshot?: PreferenceProfile;
  match_diagnostics?: MatchDiagnostics;
  validation_errors?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface OutfitItem {
  id?: string;
  outfit_set_id: string;
  fashion_item_id: string;
  position?: number;
}

export interface OutfitFeedback {
  id?: string;
  client_id: string;
  outfit_set_id: string;
  vote: 'like' | 'dislike';
  created_at?: string;
}

// OutfitSet with its items and full item details — used for client outfit gallery
export interface OutfitSetWithItems extends OutfitSet {
  items: FashionItem[];
}
