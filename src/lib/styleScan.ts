import 'server-only';

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeIndianWhatsappNumber } from '@/lib/indiaPhone';

export const STYLE_SCAN_PHOTO_BUCKET = 'style-scan-private';
export const STYLE_SCAN_RESULT_BUCKET = 'style-scan-results';
export const STYLE_SCAN_CONSENT_VERSION = 'style-scan-v1-2026-08-19';
export const STYLE_SCAN_GENERATION_VERSION = 'style-scan-v1';
export const STYLE_SCAN_SIGNED_URL_TTL = 60 * 10;

export type StyleScanStatus =
  | 'draft'
  | 'submitted'
  | 'analyzing'
  | 'generating_visual'
  | 'ready'
  | 'retake_required'
  | 'failed'
  | 'deleted';

export type ReportVariant = 'instant_10' | 'personal_20';

export interface StyleScanAnswersV1 {
  concern: 'tummy' | 'arms' | 'hips' | 'height' | 'nothing_specific';
  dressCode: 'western_office' | 'ethnic_leaning' | 'mixed' | 'mostly_home';
  dressPreference: 'modest' | 'balanced' | 'fitted';
  upcoming: 'office_events' | 'wedding' | 'festive' | 'travel' | 'nothing';
  lastFeltGreat: 'this_week' | 'cant_remember' | 'old_weight';
  /** Optional — captured on the delivery step, stored inside scan_answers JSON. */
  firstName?: string;
}

/** Plain-language consumer copy layered over the technical analysis. All optional for backward compatibility. */
export interface StyleScanPlainCopyV1 {
  geometry: { verdict: string; body: string; action: string };
  undertone: { verdict: string; body: string };
  doWhy?: string;
  takeaways: string[];
  callback?: string;
}

export interface StyleScanDontV1 {
  title: string;
  why: string;
}

export interface StyleScanOutfitV1 {
  title: string;
  formula: string;
  why: string;
}

export interface StyleScanAnalysisV1 {
  version: 'style-scan-v1';
  geometry: { shape: string; verticalLine: string; interpretation: string };
  undertone: { direction: string; depth: string; wardrobeConflict: string };
  donts: [StyleScanDontV1, StyleScanDontV1, StyleScanDontV1];
  do: StyleScanOutfitV1;
  confidence: { body: 'low' | 'medium' | 'high'; colour: 'low' | 'medium' | 'high'; overall: number };
  generatedAt: string;
  model: string;
  /** Optional additive fields (2026-08). Older stored scans omit them; the UI must render without them. */
  firstName?: string;
  palette?: { wear: Array<{ name: string; hex: string }>; avoid: string[] };
  plain?: StyleScanPlainCopyV1;
}

export interface InstantReportRefinementV1 {
  height: string;
  sizeRange: string;
  wardrobeMix: 'western' | 'ethnic' | 'mixed';
  priorityContexts: [string, string];
  footwearPreference: string;
  hardNos?: string;
  finalNote?: string;
}

export interface InstantReportOutfitV1 {
  number: number;
  title: string;
  context: string;
  formula: string;
  silhouetteRationale: string;
  colourRationale: string;
  coverageNotes: string;
}

export interface InstantReportV1 {
  version: 'instant-report-v1';
  signature: 'ICONIK Styling Team';
  generatedAt: string;
  snapshot: string;
  geometry: StyleScanAnalysisV1['geometry'];
  proportionRules: string[];
  chromaticProfile: string;
  palette: Array<{ name: string; hex: string; use: string }>;
  avoidColours: string[];
  faceGuidance: { necklines: string[]; accessories: string[]; hair: string[] };
  outfitSystem: string;
  outfits: InstantReportOutfitV1[];
  shoppingRules: string[];
  checklist: string[];
}

const allowedValues: Record<Exclude<keyof StyleScanAnswersV1, 'firstName'>, readonly string[]> = {
  concern: ['tummy', 'arms', 'hips', 'height', 'nothing_specific'],
  dressCode: ['western_office', 'ethnic_leaning', 'mixed', 'mostly_home'],
  dressPreference: ['modest', 'balanced', 'fitted'],
  upcoming: ['office_events', 'wedding', 'festive', 'travel', 'nothing'],
  lastFeltGreat: ['this_week', 'cant_remember', 'old_weight'],
};

export function validateStyleScanAnswers(value: unknown): value is StyleScanAnswersV1 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const answers = value as Record<string, unknown>;
  return Object.entries(allowedValues).every(([key, values]) => values.includes(String(answers[key])));
}

export function sanitizeFirstName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[^\p{L}\s'-]/gu, '').trim().slice(0, 30);
  if (cleaned.length < 2) return null;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function normalizeScanPhone(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalized = normalizeIndianWhatsappNumber(value);
  return normalized ? `+${normalized}` : null;
}

export function createPrivateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function createOrderAccessToken(orderId: string) {
  const secret = process.env.ICONIK_INTERNAL_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Order access token secret is not configured');
  const signature = crypto.createHmac('sha256', secret).update(`instant-report:${orderId}`).digest('base64url');
  return `${orderId}.${signature}`;
}

export function createScanAccessToken(scanId: string) {
  const secret = process.env.ICONIK_INTERNAL_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Scan access token secret is not configured');
  const signature = crypto.createHmac('sha256', secret).update(`style-scan:${scanId}`).digest('base64url');
  return `${scanId}.${signature}`;
}

export function hashPrivateToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function clientIp(headers: Headers) {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || null;
}

// Supabase cannot infer a row type from a runtime-selected column string.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getStyleScanByToken(token: string, columns = '*'): Promise<Record<string, any> | null> {
  if (!token || token.length < 32) return null;
  const { data, error } = await supabaseAdmin
    .from('style_scan_leads')
    .select(columns)
    .eq('result_token_hash', hashPrivateToken(token))
    .maybeSingle();
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as unknown as Record<string, any>;
}

export async function signedStorageUrl(bucket: string, path: string | null | undefined, ttl = STYLE_SCAN_SIGNED_URL_TTL) {
  if (!path) return null;
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(path, ttl);
  if (error) throw error;
  return data.signedUrl;
}

export function safeAttribution(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const text = (key: string) => typeof source[key] === 'string' ? String(source[key]).slice(0, 500) : null;
  return {
    utm_source: text('utm_source'),
    utm_medium: text('utm_medium'),
    utm_campaign: text('utm_campaign'),
    utm_content: text('utm_content'),
    utm_term: text('utm_term'),
    referrer: text('referrer'),
    landing_page: text('landing_page'),
    attribution_payload: source,
  };
}
