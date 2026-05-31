import { supabase as primarySupabase, supabaseAdmin } from '@/lib/supabase';

const db = typeof window === 'undefined' ? supabaseAdmin : primarySupabase;
const STYLIST_INTAKE_PHOTOS_BUCKET = 'stylist-intake-photos';

export { db as supabaseStyleScan };

// ── Types ──────────────────────────────────────────────────────────────────

export interface StyleScanLead {
  id?: string;
  email: string;
  style_struggle?: string;
  body_shape?: string;
  undertone?: string;
  aesthetic?: string;
  dressing_context?: string;
  photo_url?: string;
  style_score?: number;
  colour_direction?: string;
  silhouette_direction?: string;
  mood_keywords?: string;
  mood_colours?: string;
  whats_missing?: string;
  blueprint_cta_clicked?: boolean;
  checkout_started?: boolean;
  purchased?: boolean;
  source?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  first_touch_at?: string | null;
  attribution_payload?: Record<string, unknown> | null;
  created_at?: string;
}

export interface StylistOrder {
  id?: string;
  lead_id?: string | null;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'paid' | 'failed';
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  first_touch_at?: string | null;
  attribution_payload?: Record<string, unknown> | null;
  created_at?: string;
}

// ── Operations ─────────────────────────────────────────────────────────────

function isMissingFirstTouchAtError(error: unknown) {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: string }).code === 'PGRST204' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string' &&
    (error as { message: string }).message.includes("'first_touch_at'")
  );
}

function withoutFirstTouchAt<T extends { first_touch_at?: string | null }>(payload: T) {
  const rest = { ...payload };
  delete rest.first_touch_at;
  return rest;
}

export const saveStyleScanLead = async (lead: StyleScanLead) => {
  let { data, error } = await db
    .from('style_scan_leads')
    .insert([lead])
    .select()
    .single();

  if (isMissingFirstTouchAtError(error)) {
    const retry = await db
      .from('style_scan_leads')
      .insert([withoutFirstTouchAt(lead)])
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return data;
};

export const markStyleScanCtaClicked = async (leadId: string) => {
  await db
    .from('style_scan_leads')
    .update({ blueprint_cta_clicked: true })
    .eq('id', leadId);
};

export const saveStylistOrder = async (order: StylistOrder) => {
  if (order.razorpay_order_id) {
    const { data: existing } = await db
      .from('stylist_orders')
      .select('id')
      .eq('razorpay_order_id', order.razorpay_order_id)
      .single();

    if (existing) {
      let { data, error } = await db
        .from('stylist_orders')
        .update(order)
        .eq('razorpay_order_id', order.razorpay_order_id)
        .select()
        .single();

      if (isMissingFirstTouchAtError(error)) {
        const retry = await db
          .from('stylist_orders')
          .update(withoutFirstTouchAt(order))
          .eq('razorpay_order_id', order.razorpay_order_id)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      return data;
    }
  }

  let { data, error } = await db
    .from('stylist_orders')
    .insert([order])
    .select()
    .single();

  if (isMissingFirstTouchAtError(error)) {
    const retry = await db
      .from('stylist_orders')
      .insert([withoutFirstTouchAt(order)])
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) throw error;
  return data;
};

export const uploadStyleScanPhoto = async (file: File, fileName: string): Promise<string> => {
  if (typeof window !== 'undefined') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', fileName);

    const res = await fetch('/api/stylist-intake-photo', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Photo upload failed');
    }
    return data.url;
  }

  const storagePath = `public/${fileName}`;

  const { data, error } = await db.storage
    .from(STYLIST_INTAKE_PHOTOS_BUCKET)
    .upload(storagePath, file, { upsert: true, contentType: 'image/jpeg' });

  if (error) throw error;

  const { data: publicData } = db.storage
    .from(STYLIST_INTAKE_PHOTOS_BUCKET)
    .getPublicUrl(data.path);

  return publicData.publicUrl;
};

export interface StyleEditSubscription {
  id?: string;
  lead_id?: string | null;
  order_id?: string | null;
  customer_email: string;
  customer_name?: string;
  customer_phone?: string;
  plan_type?: 'monthly' | 'annual';
  plan_id?: string;
  razorpay_subscription_id?: string;
  razorpay_payment_id?: string;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'active' | 'cancelled' | 'halted' | 'completed' | 'expired';
  source?: 'checkout' | 'success_page' | 'chat';
  notes?: string;
  start_at?: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  attribution_payload?: Record<string, unknown> | null;
  created_at?: string;
}

export const saveStyleEditSubscription = async (sub: StyleEditSubscription) => {
  const { data, error } = await db
    .from('style_edit_subscriptions')
    .insert([sub])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ── Score & Derivation Logic ────────────────────────────────────────────────

export interface ScanAnswers {
  struggle: string;
  bodyShape: string;
  undertone: string;
  aesthetic: string;
  dressingContext: string;
  hasPhoto: boolean;
}

export interface ScanResult {
  styleScore: number;
  colourDirection: string;
  silhouetteDirection: string;
  moodKeywords: string[];
  moodColours: string[];
  whatsMissing: string;
  scoreLabel: string;
}

const STRUGGLE_PENALTY: Record<string, number> = {
  fit_body: -18,
  wardrobe_disconnect: -20,
  dont_know_colours: -14,
  look_fine: -10,
  body_change: -16,
};

const UNDERTONE_BONUS: Record<string, number> = {
  warm: 10,
  cool: 10,
  neutral: 5,
  dont_know: 0,
};

const MOOD_BOARDS: Record<string, Record<string, { keywords: string[]; colours: string[] }>> = {
  minimal: {
    warm: { keywords: ['Clean Structure', 'Golden Restraint', 'Minimal Layering', 'Warm Precision'], colours: ['#C4956A', '#8B6914', '#E8C99A', '#D4A853'] },
    cool: { keywords: ['Sharp Minimalism', 'Cool White', 'Structural Basics', 'Precise Line'], colours: ['#B8C5D0', '#7A8FA3', '#E8EDF2', '#5C7A8F'] },
    neutral: { keywords: ['Balanced Simplicity', 'Tonal Neutrals', 'Clean Proportion', 'Quiet Confidence'], colours: ['#C0B0A0', '#A09080', '#E8E0D8', '#705848'] },
    dont_know: { keywords: ['Clean Lines', 'Tonal Dressing', 'Structural Basics', 'Quiet Precision'], colours: ['#B8B0A8', '#808070', '#E0D8D0', '#605850'] },
  },
  soft: {
    warm: { keywords: ['Earthy Draping', 'Soft Warmth', 'Fluid Silhouettes', 'Feminine Ease'], colours: ['#C9845A', '#A0693C', '#E8B89A', '#8B5230'] },
    cool: { keywords: ['Muted Softness', 'Cool Drape', 'Quiet Femininity', 'Dusty Tones'], colours: ['#C0B8D4', '#9488B8', '#E0DBF0', '#7068A0'] },
    neutral: { keywords: ['Soft Balance', 'Gentle Draping', 'Neutral Warmth', 'Feminine Structure'], colours: ['#C8AE9A', '#A89080', '#E8D8C8', '#887060'] },
    dont_know: { keywords: ['Gentle Layering', 'Soft Proportion', 'Draped Ease', 'Muted Warmth'], colours: ['#C0A898', '#A08878', '#E8D8C8', '#807060'] },
  },
  sharp: {
    warm: { keywords: ['Bold Architecture', 'Rich Contrast', 'Structural Edge', 'Warm Power'], colours: ['#8B4514', '#C4640A', '#5C2A00', '#E8924A'] },
    cool: { keywords: ['Crisp Contrast', 'Architectural Cut', 'Sharp Modern', 'Cool Precision'], colours: ['#2C3E50', '#4A6B8A', '#8CA0B8', '#1A252F'] },
    neutral: { keywords: ['Strong Silhouette', 'Bold Neutral', 'Modern Edge', 'Graphic Power'], colours: ['#3C3028', '#6C6058', '#A89890', '#1C1810'] },
    dont_know: { keywords: ['Strong Line', 'Bold Cut', 'Structural Statement', 'Modern Architecture'], colours: ['#383028', '#686050', '#A09880', '#181410'] },
  },
  relaxed: {
    warm: { keywords: ['Elevated Ease', 'Warm Casual', 'Considered Comfort', 'Relaxed Luxury'], colours: ['#C4956A', '#A07840', '#E8C99A', '#7C5C2E'] },
    cool: { keywords: ['Cool Casual', 'Quiet Luxury', 'Relaxed Precision', 'Understated Impact'], colours: ['#8FA8C0', '#5C7A90', '#B8D0E8', '#3A5C72'] },
    neutral: { keywords: ['Effortless Balance', 'Comfortable Intent', 'Casual Refinement', 'Relaxed Structure'], colours: ['#A8A098', '#808878', '#D0C8C0', '#505850'] },
    dont_know: { keywords: ['Easy Elegance', 'Considered Casual', 'Relaxed Intention', 'Comfortable Style'], colours: ['#A89880', '#887860', '#D0C0A8', '#484030'] },
  },
  classic: {
    warm: { keywords: ['Timeless Structure', 'Investment Warmth', 'Polished Classic', 'Refined Ease'], colours: ['#8B6914', '#C4956A', '#5C3D0A', '#E8C490'] },
    cool: { keywords: ['Timeless Edge', 'Classic Precision', 'Cool Investment', 'Polished Structure'], colours: ['#2C4A6A', '#5C7A9A', '#9AB0C8', '#1A3050'] },
    neutral: { keywords: ['Timeless Balance', 'Classic Refinement', 'Investment Neutral', 'Polished Ease'], colours: ['#605848', '#908070', '#C0B0A0', '#302820'] },
    dont_know: { keywords: ['Timeless Elegance', 'Classic Foundation', 'Polished Restraint', 'Investment Dressing'], colours: ['#685848', '#988068', '#C8B0A0', '#382820'] },
  },
};

const COLOUR_DIRECTIONS: Record<string, Record<string, string>> = {
  warm: { minimal: 'Golden Neutrals', soft: 'Warm Earth Tones', sharp: 'Rich Warm Contrast', relaxed: 'Sun-Warmed Ease', classic: 'Timeless Golds' },
  cool: { minimal: 'Cool Crisp Whites', soft: 'Soft Muted Pastels', sharp: 'Bold Cool Contrast', relaxed: 'Quiet Cool Tones', classic: 'Refined Cool Classics' },
  neutral: { minimal: 'Balanced Neutrals', soft: 'Adaptable Soft Tones', sharp: 'Neutral Power Palette', relaxed: 'Versatile Warmth', classic: 'Timeless Adaptable Tones' },
  dont_know: { minimal: 'Clean Neutral Mix', soft: 'Soft Balanced Tones', sharp: 'Contrast-Ready Palette', relaxed: 'Adaptable Ease', classic: 'Classic Neutral Range' },
};

const SILHOUETTE_DIRECTIONS: Record<string, string> = {
  hourglass: 'Define & Balance',
  pear: 'Balance & Lengthen',
  apple: 'Structure & Elongate',
  rectangle: 'Create Shape & Dimension',
  oval: 'Elongate & Streamline',
};

const WHATS_MISSING: Record<string, string> = {
  fit_body: 'Geometry-first dressing — knowing precisely which silhouettes and cuts work for your specific proportions',
  wardrobe_disconnect: 'Colour frameworks and outfit formulas that connect your individual pieces into a working, cohesive system',
  dont_know_colours: 'Your undertone map — the single filter that makes every colour decision easy and intentional',
  look_fine: 'Elevation science — the specific techniques that bridge "fine" and "polished" for your body and context',
  body_change: 'A complete style reset built around who you are now — your current body, your current life',
};

const SCORE_LABELS: Record<string, string> = {
  low: 'Significant alignment gaps — your style and your features are working against each other',
  mid: 'Partial alignment — you have instincts, but the science behind them is missing',
  high: 'Good instincts — the full Blueprint would sharpen what you already sense',
};

export function computeScanResult(answers: ScanAnswers): ScanResult {
  let score = 68;
  score += STRUGGLE_PENALTY[answers.struggle] ?? -12;
  score += UNDERTONE_BONUS[answers.undertone] ?? 0;
  if (answers.aesthetic) score += 8;
  score += 6;
  if (answers.hasPhoto) score += 3;
  const styleScore = Math.max(48, Math.min(78, score));

  const scoreLabel =
    styleScore < 58 ? SCORE_LABELS.low :
    styleScore < 68 ? SCORE_LABELS.mid :
    SCORE_LABELS.high;

  const undertoneKey = answers.undertone || 'dont_know';
  const aestheticKey = answers.aesthetic || 'classic';

  const colourDirection = COLOUR_DIRECTIONS[undertoneKey]?.[aestheticKey] ?? 'Your Personal Colour Direction';
  const silhouetteDirection = SILHOUETTE_DIRECTIONS[answers.bodyShape] ?? 'Balanced & Proportioned';
  const moodBoard = MOOD_BOARDS[aestheticKey]?.[undertoneKey] ?? MOOD_BOARDS.classic.neutral;
  const whatsMissing = WHATS_MISSING[answers.struggle] ?? 'Your personal style framework — the rules that work specifically for you';

  return {
    styleScore,
    scoreLabel,
    colourDirection,
    silhouetteDirection,
    moodKeywords: moodBoard.keywords,
    moodColours: moodBoard.colours,
    whatsMissing,
  };
}
