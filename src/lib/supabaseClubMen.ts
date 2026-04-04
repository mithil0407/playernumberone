// supabaseClubMen.ts — ICONIK Club Men
// Uses the main Supabase project (NEXT_PUBLIC_SUPABASE_URL), men_* tables.

import { supabase, supabaseAdmin } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type MenItemCategory =
  | 'shirt' | 'tshirt' | 'trousers' | 'jeans' | 'suit' | 'blazer'
  | 'kurta' | 'outerwear' | 'shoes' | 'accessory' | 'other';

export type MenItemStatus = 'active' | 'archived' | 'draft';

export type MenOutfitOccasion =
  | 'office' | 'smart-casual' | 'casual'
  | 'indian-occasion' | 'weekend' | 'evening';

export type MenOutfitStatus = 'pending' | 'generating' | 'ready' | 'failed';

export type MenBodyShape = 'athletic' | 'lean' | 'stocky' | 'broad' | 'average';

export interface MenFashionItem {
  id?: string;
  raw_description?: string;
  raw_image_url?: string;
  brand?: string;
  item_name: string;
  category?: MenItemCategory;
  color?: string[];
  material?: string[];
  price?: number;
  currency?: string;
  size_availability?: string[];
  purchase_link?: string;
  image_url: string;
  ai_confidence?: number;
  ai_raw_response?: Record<string, unknown>;
  status?: MenItemStatus;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MenClientProfile {
  id?: string;
  user_id?: string;
  name: string;
  email: string;
  phone?: string;
  headshot_url?: string;
  body_photo_url?: string;
  height_cm?: number;
  weight_kg?: number;
  chest_cm?: number;
  waist_cm?: number;
  shoulder_cm?: number;
  body_shape?: MenBodyShape;
  size_estimate?: string;
  style_notes?: string;
  style_restrictions?: string[];
  subscription_id?: string;
  onboarding_complete?: boolean;
  preview_token?: string;
  token_expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MenOutfitSet {
  id?: string;
  client_id: string;
  outfit_card_url?: string;
  ai_style_note?: string;
  occasion?: MenOutfitOccasion;
  season?: string;
  status?: MenOutfitStatus;
  generation_batch?: number;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MenOutfitItem {
  id?: string;
  outfit_set_id: string;
  fashion_item_id: string;
  position?: number;
}

export interface MenOutfitSetWithItems extends MenOutfitSet {
  items: MenFashionItem[];
}

// ── Client Profile Operations ─────────────────────────────────────────────────

export const saveMenClientProfile = async (profile: MenClientProfile) => {
  const { data, error } = await supabaseAdmin
    .from('men_client_profiles')
    .upsert([profile], { onConflict: 'email', ignoreDuplicates: false })
    .select()
    .single();
  if (error) throw error;
  return data as MenClientProfile;
};

export const getMenClientByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('men_client_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as MenClientProfile | null;
};

export const getMenClientByEmail = async (email: string) => {
  const { data, error } = await supabaseAdmin
    .from('men_client_profiles')
    .select('*')
    .eq('email', email)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as MenClientProfile | null;
};

export const getMenClientById = async (id: string) => {
  const { data, error } = await supabaseAdmin
    .from('men_client_profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as MenClientProfile;
};

export const updateMenClientProfile = async (id: string, updates: Partial<MenClientProfile>) => {
  const { data, error } = await supabaseAdmin
    .from('men_client_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as MenClientProfile;
};

export const listMenClients = async (page = 0, pageSize = 20) => {
  const { data, error, count } = await supabaseAdmin
    .from('men_client_profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  if (error) throw error;
  return { clients: data as MenClientProfile[], total: count ?? 0 };
};

export const getMenClientByPreviewToken = async (token: string) => {
  const { data, error } = await supabaseAdmin
    .from('men_client_profiles')
    .select('*')
    .eq('preview_token', token)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as MenClientProfile | null;
};

// ── Fashion Item Operations ───────────────────────────────────────────────────

export const saveMenFashionItem = async (item: MenFashionItem) => {
  const { data, error } = await supabaseAdmin
    .from('men_fashion_items')
    .insert([item])
    .select()
    .single();
  if (error) throw error;
  return data as MenFashionItem;
};

export const updateMenFashionItem = async (id: string, updates: Partial<MenFashionItem>) => {
  const { data, error } = await supabaseAdmin
    .from('men_fashion_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as MenFashionItem;
};

export const getActiveMenFashionItems = async () => {
  const { data, error } = await supabaseAdmin
    .from('men_fashion_items')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as MenFashionItem[];
};

export const listMenFashionItems = async (status?: MenItemStatus, page = 0, pageSize = 20) => {
  let query = supabaseAdmin
    .from('men_fashion_items')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);
  if (status) query = query.eq('status', status);
  const { data, error, count } = await query;
  if (error) throw error;
  return { items: data as MenFashionItem[], total: count ?? 0 };
};

export const getSampleMenFashionItems = async (count = 3) => {
  const { data, error } = await supabaseAdmin
    .from('men_fashion_items')
    .select('*')
    .eq('status', 'active')
    .limit(count);
  if (error) throw error;
  return data as MenFashionItem[];
};

// ── Outfit Set Operations ─────────────────────────────────────────────────────

export const createMenOutfitSet = async (outfitSet: MenOutfitSet) => {
  const { data, error } = await supabaseAdmin
    .from('men_outfit_sets')
    .insert([outfitSet])
    .select()
    .single();
  if (error) throw error;
  return data as MenOutfitSet;
};

export const updateMenOutfitSet = async (id: string, updates: Partial<MenOutfitSet>) => {
  const { data, error } = await supabaseAdmin
    .from('men_outfit_sets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as MenOutfitSet;
};

export const getMenOutfitsByClientId = async (clientId: string) => {
  const { data, error } = await supabase
    .from('men_outfit_sets')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as MenOutfitSet[];
};

export const getMenOutfitSetById = async (id: string) => {
  const { data, error } = await supabase
    .from('men_outfit_sets')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as MenOutfitSet;
};

// ── Outfit Item (junction) Operations ────────────────────────────────────────

export const createMenOutfitItems = async (items: MenOutfitItem[]) => {
  const { data, error } = await supabaseAdmin
    .from('men_outfit_items')
    .insert(items)
    .select();
  if (error) throw error;
  return data as MenOutfitItem[];
};

export const getMenOutfitItemsWithDetail = async (outfitSetId: string) => {
  const { data, error } = await supabase
    .from('men_outfit_items')
    .select(`
      position,
      men_fashion_items (
        id, item_name, brand, category, color, price, currency,
        purchase_link, image_url
      )
    `)
    .eq('outfit_set_id', outfitSetId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data;
};

// ── Photo Storage Operations ──────────────────────────────────────────────────

export const uploadMenClientPhoto = async (
  file: File | Buffer,
  path: string,          // e.g. "{userId}/headshot.jpg"
  contentType = 'image/jpeg'
): Promise<string> => {
  const { data, error } = await supabaseAdmin.storage
    .from('men-client-photos')
    .upload(path, file, { upsert: true, contentType });
  if (error) throw error;

  const { data: signedData, error: signError } = await supabaseAdmin.storage
    .from('men-client-photos')
    .createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1-year signed URL
  if (signError) throw signError;
  return signedData.signedUrl;
};

export const uploadMenFashionItemImage = async (
  file: File | Buffer,
  fileName: string,
  contentType = 'image/jpeg'
): Promise<string> => {
  const { data, error } = await supabaseAdmin.storage
    .from('men-fashion-items')
    .upload(fileName, file, { upsert: true, contentType });
  if (error) throw error;

  const { data: publicData } = supabaseAdmin.storage
    .from('men-fashion-items')
    .getPublicUrl(data.path);
  return publicData.publicUrl;
};

export const uploadMenOutfitCard = async (
  buffer: Buffer,
  outfitSetId: string
): Promise<string> => {
  const path = `${outfitSetId}.jpg`;
  const { data, error } = await supabaseAdmin.storage
    .from('men-outfit-cards')
    .upload(path, buffer, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw error;

  const { data: signedData, error: signError } = await supabaseAdmin.storage
    .from('men-outfit-cards')
    .createSignedUrl(data.path, 60 * 60 * 24 * 365);
  if (signError) throw signError;
  return signedData.signedUrl;
};
