import { supabase as primarySupabase, supabaseAdmin } from '@/lib/supabase';
import { readStyleScanPhotoUploadResponse } from '@/lib/styleScanPhotoUploadResponse';

export { readStyleScanPhotoUploadResponse } from '@/lib/styleScanPhotoUploadResponse';

const db = typeof window === 'undefined' ? supabaseAdmin : primarySupabase;
const STYLIST_INTAKE_PHOTOS_BUCKET = 'stylist-intake-photos';

export { db as supabaseStyleScan };

// ── Types ──────────────────────────────────────────────────────────────────

export interface StyleScanLead {
  id?: string;
  email: string;
  first_name?: string;
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
  season_name?: string;
  diagnosis_answers?: Record<string, unknown> | null;
  betrayer_colours?: string;
  power_palette?: string;
  tool_id?: string;
  tool_version?: string;
  result_key?: string;
  result_label?: string;
  result_summary?: string;
  result_payload?: Record<string, unknown> | null;
  share_payload?: Record<string, unknown> | null;
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
    return readStyleScanPhotoUploadResponse(res);
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

// ── Color Mirror Diagnosis Logic ───────────────────────────────────────────

export type TemperatureSwatch = 'warm' | 'cool';
export type MetalTest = 'gold' | 'silver' | 'both';
export type WhiteTest = 'warm_cream' | 'bright_white';
export type NaturalDepth = 'light' | 'medium' | 'deep';
export type ClaritySwatch = 'vivid' | 'muted';
export type StyleGoal = 'arms' | 'midsection' | 'polished' | 'glow';

export interface ColorMirrorAnswers {
  temperatureSwatch: TemperatureSwatch;
  metalTest: MetalTest;
  whiteTest: WhiteTest;
  naturalDepth: NaturalDepth;
  claritySwatch: ClaritySwatch;
  styleGoal: StyleGoal;
}

export interface NamedColour {
  name: string;
  hex: string;
}

export interface ColorMirrorResult {
  seasonName: string;
  undertone: 'warm' | 'cool' | 'neutral';
  subcopy: string;
  betrayerColours: NamedColour[];
  powerPalette: NamedColour[];
  betrayerExplanation: string;
  styleGoalPhrase: string;
}

const STYLE_GOAL_PHRASES: Record<StyleGoal, string> = {
  arms: 'draw the eye away from your arms',
  midsection: 'draw the eye away from your midsection',
  polished: 'make you look more polished and expensive',
  glow: 'make you glow',
};

const SEASON_DATA: Record<string, Omit<ColorMirrorResult, 'undertone' | 'styleGoalPhrase'>> = {
  'Soft Autumn': {
    seasonName: 'Soft Autumn',
    subcopy: 'Warm-toned, with a softness that means high-contrast, icy colors overwhelm your face instead of lifting it. In every round, you leaned warm — that is not coincidence. That is your Chromatic Harmony.',
    betrayerColours: [
      { name: 'Icy Fuchsia', hex: '#C02368' },
      { name: 'Blue White', hex: '#F4F7FB' },
      { name: 'Sharp Cobalt', hex: '#1F5DB8' },
    ],
    powerPalette: [
      { name: 'Soft Olive', hex: '#8B8A5A' },
      { name: 'Camel', hex: '#C8956C' },
      { name: 'Warm Taupe', hex: '#A88770' },
      { name: 'Dusty Peach', hex: '#D9A083' },
      { name: 'Moss', hex: '#6F7A52' },
    ],
    betrayerExplanation: 'These cool, high-contrast tones fight your warm undertone — pulling the color out of your face before you have said a word. You probably own at least one.',
  },
  'Deep Autumn': {
    seasonName: 'Deep Autumn',
    subcopy: 'Warm-toned and deep, with natural richness that gets flattened by pale, icy colors. Your face needs depth, warmth, and weight — not washed-out brightness.',
    betrayerColours: [
      { name: 'Powder Pink', hex: '#F0C9D8' },
      { name: 'Icy Lilac', hex: '#C9C5EF' },
      { name: 'Cool Mint', hex: '#BDE7DE' },
    ],
    powerPalette: [
      { name: 'Espresso', hex: '#3A241C' },
      { name: 'Burnt Sienna', hex: '#A85632' },
      { name: 'Antique Gold', hex: '#B58B32' },
      { name: 'Forest Olive', hex: '#4F5B32' },
      { name: 'Deep Teal', hex: '#245C5A' },
    ],
    betrayerExplanation: 'These pale, cool tones sit on top of your coloring instead of connecting to it. They make strong features look tired rather than intentional.',
  },
  'Warm Spring': {
    seasonName: 'Warm Spring',
    subcopy: 'Warm-toned and bright, with coloring that comes alive around clear, sunny colors. Muted and greyed shades can make your face look quieter than it actually is.',
    betrayerColours: [
      { name: 'Dusty Mauve', hex: '#A98F9B' },
      { name: 'Slate Grey', hex: '#65727D' },
      { name: 'Muted Sage', hex: '#9BA8A3' },
    ],
    powerPalette: [
      { name: 'Coral', hex: '#EE6F57' },
      { name: 'Golden Cream', hex: '#F5ECD7' },
      { name: 'Clear Turquoise', hex: '#28A6B6' },
      { name: 'Warm Grass', hex: '#78A848' },
      { name: 'Apricot', hex: '#F2A15F' },
    ],
    betrayerExplanation: 'These muted, greyed colors dull the warmth in your face. They are not wrong colors — they are just too quiet for your natural brightness.',
  },
  'Warm Autumn': {
    seasonName: 'Warm Autumn',
    subcopy: 'Warm-toned, vivid, and deep enough to carry saturated earthy color. Cool brightness can look loud on you, while rich warmth looks expensive.',
    betrayerColours: [
      { name: 'Electric Blue', hex: '#1267D8' },
      { name: 'Pure White', hex: '#F4F4F6' },
      { name: 'Cool Magenta', hex: '#B62076' },
    ],
    powerPalette: [
      { name: 'Rust', hex: '#B45F32' },
      { name: 'Marigold', hex: '#D89B24' },
      { name: 'Warm Navy', hex: '#28475A' },
      { name: 'Olive Brown', hex: '#6F6138' },
      { name: 'Tomato Red', hex: '#C9462E' },
    ],
    betrayerExplanation: 'These cold, high-voltage shades compete with your warmth. They grab attention before your face does, which is why they can feel harsh.',
  },
  'Soft Summer': {
    seasonName: 'Soft Summer',
    subcopy: 'Cool-toned, with a softness that looks best in refined, muted color. Warm golden shades can make your skin look uneven instead of fresh.',
    betrayerColours: [
      { name: 'Mustard', hex: '#C59A25' },
      { name: 'Orange Coral', hex: '#E26A3E' },
      { name: 'Warm Camel', hex: '#C8956C' },
    ],
    powerPalette: [
      { name: 'Dusty Blue', hex: '#7B9FC4' },
      { name: 'Rose Grey', hex: '#B89AA6' },
      { name: 'Soft Navy', hex: '#455A70' },
      { name: 'Mauve', hex: '#987D94' },
      { name: 'Sage Grey', hex: '#9BA8A3' },
    ],
    betrayerExplanation: 'These warm, yellow-based tones push against your cool softness. They can make your face look flushed, flat, or older than it is.',
  },
  'Deep Summer': {
    seasonName: 'Deep Summer',
    subcopy: 'Cool-toned and deeper than a classic summer, with coloring that needs cool weight without harsh brightness. Warm earth colors can drag your face down.',
    betrayerColours: [
      { name: 'Burnt Orange', hex: '#B75A2A' },
      { name: 'Golden Brown', hex: '#9A6A2D' },
      { name: 'Olive Mustard', hex: '#8B7C32' },
    ],
    powerPalette: [
      { name: 'Smoky Plum', hex: '#5F4B67' },
      { name: 'Cool Navy', hex: '#253F5D' },
      { name: 'Pine Blue', hex: '#2F6675' },
      { name: 'Deep Rose', hex: '#8E4D68' },
      { name: 'Charcoal Blue', hex: '#3E4C59' },
    ],
    betrayerExplanation: 'These golden, earthy tones sit too warm against your skin. They steal clarity from your face and make the outfit look heavier than it should.',
  },
  'Cool Winter': {
    seasonName: 'Cool Winter',
    subcopy: 'Cool-toned and clear, with features that sharpen around crisp contrast. Warm, muted colors soften the wrong things and make your face recede.',
    betrayerColours: [
      { name: 'Camel', hex: '#C8956C' },
      { name: 'Muted Sage', hex: '#9BA8A3' },
      { name: 'Warm Cream', hex: '#F5ECD7' },
    ],
    powerPalette: [
      { name: 'Pure White', hex: '#F4F4F6' },
      { name: 'Cobalt', hex: '#2D6FA3' },
      { name: 'Black Cherry', hex: '#4D1230' },
      { name: 'Emerald', hex: '#087A68' },
      { name: 'Icy Pink', hex: '#E8D3E3' },
    ],
    betrayerExplanation: 'These warm, softened colors blur the contrast your face naturally carries. They make you look quieter when your coloring wants precision.',
  },
  'Deep Winter': {
    seasonName: 'Deep Winter',
    subcopy: 'Cool-toned, vivid, and deep, with coloring that can carry contrast. Warm dusty shades drain your face because they are too soft and too golden.',
    betrayerColours: [
      { name: 'Dusty Peach', hex: '#D9A083' },
      { name: 'Warm Beige', hex: '#D6BF9A' },
      { name: 'Olive Khaki', hex: '#8A845C' },
    ],
    powerPalette: [
      { name: 'Ink Navy', hex: '#121F35' },
      { name: 'Ruby', hex: '#A5163A' },
      { name: 'Icy White', hex: '#F4F4F6' },
      { name: 'Sapphire', hex: '#173D8F' },
      { name: 'Pine', hex: '#074B47' },
    ],
    betrayerExplanation: 'These warm, dusty tones mute the depth that makes you striking. They pull energy out of your face and leave the clothes doing too much work.',
  },
};

function getTemperature(answers: ColorMirrorAnswers): ColorMirrorResult['undertone'] {
  let score = 0;
  score += answers.temperatureSwatch === 'warm' ? 1 : -1;
  score += answers.metalTest === 'gold' ? 1 : answers.metalTest === 'silver' ? -1 : 0;
  score += answers.whiteTest === 'warm_cream' ? 1 : -1;
  if (score >= 1) return 'warm';
  if (score <= -1) return 'cool';
  return 'neutral';
}

export function computeColorMirrorResult(answers: ColorMirrorAnswers): ColorMirrorResult {
  const undertone = getTemperature(answers);
  const clarity = answers.claritySwatch;
  const depth = answers.naturalDepth;
  const warmTieBreak = answers.temperatureSwatch === 'warm';
  const effectiveUndertone = undertone === 'neutral' ? (warmTieBreak ? 'warm' : 'cool') : undertone;

  let seasonName: string;
  if (effectiveUndertone === 'warm' && clarity === 'muted') {
    seasonName = depth === 'deep' ? 'Deep Autumn' : 'Soft Autumn';
  } else if (effectiveUndertone === 'warm' && clarity === 'vivid') {
    seasonName = depth === 'deep' ? 'Warm Autumn' : 'Warm Spring';
  } else if (effectiveUndertone === 'cool' && clarity === 'muted') {
    seasonName = depth === 'deep' ? 'Deep Summer' : 'Soft Summer';
  } else {
    seasonName = depth === 'deep' ? 'Deep Winter' : 'Cool Winter';
  }

  const season = SEASON_DATA[seasonName] ?? SEASON_DATA['Soft Autumn'];
  return {
    ...season,
    undertone,
    styleGoalPhrase: STYLE_GOAL_PHRASES[answers.styleGoal],
  };
}
