import 'server-only';

import { supabaseAdmin } from './supabase';
import type { StylistIntakeSubmission } from './stylistBlueprintGenerator';
import { consultationReadiness } from './stylistConsultationReadiness';
import type { ConsultationReadiness } from './stylistConsultationReadiness';
export { consultationReadiness } from './stylistConsultationReadiness';
export type { ConsultationReadiness } from './stylistConsultationReadiness';

export const CONSULTATION_UPLOAD_BUCKET = 'consultation-client-uploads';

type JsonRecord = Record<string, unknown>;

export type ConsultationIntakeRecord = StylistIntakeSubmission & {
  consultation_id?: string | null;
  assigned_stylist_id?: string | null;
  source_snapshot?: JsonRecord | null;
  source_photo_paths?: Record<string, string> | null;
  workspace_overrides?: JsonRecord | null;
};

export interface ConsultationSourceBundle {
  consultation: {
    id: string;
    stylist_id: string;
    client_name: string;
    client_phone: string;
    consultation_date: string | null;
    images_received_at: string | null;
    report_due_at: string | null;
    delivered_at: string | null;
    status: string;
    client_data: JsonRecord;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
  upload: {
    consultation_id: string;
    submitted_at: string | null;
    photo_paths: Record<string, string>;
    measurements: JsonRecord;
  } | null;
}

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function text(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function list(value: unknown) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  const one = text(value);
  return one ? one.split(/,|;|\n/).map(item => item.trim()).filter(Boolean) : [];
}

function compact<T extends JsonRecord>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => {
      if (item === null || item === undefined || item === '') return false;
      if (Array.isArray(item)) return item.length > 0;
      if (typeof item === 'object') return Object.keys(item as JsonRecord).length > 0;
      return true;
    }),
  ) as T;
}

function numeric(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(text(value).replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function measurementCentimetres(value: unknown, unit: unknown) {
  const parsed = numeric(value);
  if (parsed === undefined) return undefined;
  const normalizedUnit = String(unit ?? '').toLowerCase();
  return Math.round((['in', 'inch', 'inches'].includes(normalizedUnit) ? parsed * 2.54 : parsed) * 10) / 10;
}

export async function loadConsultationSource(consultationId: string): Promise<ConsultationSourceBundle | null> {
  const [consultationResult, uploadResult] = await Promise.all([
    supabaseAdmin
      .from('consultations')
      .select('id, stylist_id, client_name, client_phone, consultation_date, images_received_at, report_due_at, delivered_at, status, client_data, notes, created_at, updated_at')
      .eq('id', consultationId)
      .maybeSingle(),
    supabaseAdmin
      .from('consultation_upload_links')
      .select('consultation_id, submitted_at, photo_paths, measurements')
      .eq('consultation_id', consultationId)
      .maybeSingle(),
  ]);

  if (consultationResult.error || !consultationResult.data) return null;
  const row = consultationResult.data;
  const upload = uploadResult.data;
  return {
    consultation: {
      ...row,
      client_data: record(row.client_data),
      notes: row.notes || null,
    } as ConsultationSourceBundle['consultation'],
    upload: upload ? {
      consultation_id: upload.consultation_id,
      submitted_at: upload.submitted_at,
      photo_paths: Object.fromEntries(
        Object.entries(record(upload.photo_paths)).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && Boolean(entry[1])),
      ),
      measurements: record(upload.measurements),
    } : null,
  };
}

export function consultationSourceToIntake(source: ConsultationSourceBundle) {
  const consultation = source.consultation;
  const data = consultation.client_data;
  const uploadMeasurements = source.upload?.measurements ?? {};
  const aesthetics = list(data.aesthetics);
  const goals = [
    ...list(data.styleGoal1),
    ...list(data.styleGoal2),
    ...list(data.styleGoal3),
    ...list(data.specialGoals),
  ];
  const concerns = [
    ...list(data.bodyConcerns),
    ...list(data.bodyConcernsOther),
  ];

  const bodyMeasurements = compact({
    shoulders_cm: measurementCentimetres(uploadMeasurements.shoulders, uploadMeasurements.unit),
    bust_cm: measurementCentimetres(uploadMeasurements.bust, uploadMeasurements.unit),
    chest_cm: measurementCentimetres(uploadMeasurements.chest, uploadMeasurements.unit),
    waist_cm: measurementCentimetres(uploadMeasurements.waist, uploadMeasurements.unit),
    hips_cm: measurementCentimetres(uploadMeasurements.hips, uploadMeasurements.unit),
    height_cm: numeric(data.height),
    weight_kg: numeric(data.weight),
    body_shape: text(data.bodyShape),
  });

  return {
    customer_email: null,
    customer_phone: consultation.client_phone,
    full_name: consultation.client_name,
    age_range: text(data.age) || null,
    country: 'India',
    primary_language: 'English',
    body_measurements: bodyMeasurements,
    photo_urls: {},
    focus_areas: Array.from(new Set([...concerns, ...goals])).filter(Boolean),
    coverage_requirements: compact({
      boundaries: list(data.boundaries),
      fit_restrictions: list(data.fitRestrictions),
      fabric_restrictions: list(data.fabricRestrictions),
      cultural_restrictions: list(data.culturalRestrictions),
      modesty_preference: text(data.modestyPreference),
      modesty_reason: text(data.modestyReason),
    }),
    lifestyle_context: compact({
      occupation: text(data.occupation),
      occasions: list(data.occasions),
      upcoming_events: list(data.upcomingEvents),
      consultation_reason: text(data.consultationReason),
      desired_feelings: list(data.desiredFeelings),
      life_changes: list(data.lifeChanges),
      goals,
      market: 'India',
    }),
    piece_preferences: compact({
      loved: list(data.itemsLoved),
      avoided: list(data.itemsHated),
      least_favourites: list(data.wardrobeLeastFavorites),
      footwear: list(data.footwear),
      experimentation: text(data.styleExperimentation),
      outfit_ratio: text(data.outfitRatioPreference || data.outfitRatio),
      colour_family: list(data.colorFamilyPreference),
      metal_preference: text(data.metalPreference),
    }),
    selected_moodboard_id: null,
    selected_moodboard_label: aesthetics.join(' / ') || null,
    secondary_moodboard_elements: aesthetics,
    hair_context: compact({
      hair_type: text(data.hairType),
      change_openness: text(data.hairChangeOpenness),
    }),
    skin_tone_self_description: [
      text(data.skinTone) ? `Skin tone: ${text(data.skinTone)}` : '',
      text(data.skinType) ? `Skin type: ${text(data.skinType)}` : '',
      text(data.skinTint) ? `Natural tint: ${text(data.skinTint)}` : '',
      text(data.sunReaction) ? `Sun reaction: ${text(data.sunReaction)}` : '',
      text(data.veinColor) ? `Vein colour: ${text(data.veinColor)}` : '',
      text(data.whiteClothingEffect) ? `White clothing effect: ${text(data.whiteClothingEffect)}` : '',
    ].filter(Boolean).join('\n') || null,
    shopping_relationship: text(data.wardrobeChallenge) || null,
    prior_styling_experience: compact({
      consultation_date: consultation.consultation_date,
      source: 'india_consultation',
    }),
    one_outfit_description: null,
    one_outfit_image_url: null,
    completion_percentage: 100,
    completed_at: consultation.images_received_at || consultation.updated_at,
    updated_at: new Date().toISOString(),
    intake_source: 'india_consultation',
    raw_consultation_notes: consultation.notes,
    consultation_id: consultation.id,
    assigned_stylist_id: consultation.stylist_id,
    source_snapshot: {
      consultation: {
        ...consultation,
        client_phone: consultation.client_phone,
      },
      upload: source.upload,
      captured_at: new Date().toISOString(),
    },
    source_photo_paths: source.upload?.photo_paths ?? {},
  };
}

const REFRESH_DIFF_FIELDS = [
  'body_measurements',
  'focus_areas',
  'coverage_requirements',
  'lifestyle_context',
  'piece_preferences',
  'selected_moodboard_label',
  'secondary_moodboard_elements',
  'hair_context',
  'skin_tone_self_description',
  'raw_consultation_notes',
  'source_photo_paths',
] as const;

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as JsonRecord)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export function consultationIntakeDiff(current: ConsultationIntakeRecord, next: ReturnType<typeof consultationSourceToIntake>) {
  return REFRESH_DIFF_FIELDS.flatMap(field => {
    const before = current[field as keyof ConsultationIntakeRecord] ?? null;
    const after = next[field] ?? null;
    return stableJson(before) === stableJson(after) ? [] : [{ field, before, after }];
  });
}

export async function ensureConsultationIntake(input: {
  consultationId: string;
  stylistId: string;
  refresh?: boolean;
  allowIncomplete?: boolean;
}): Promise<ConsultationIntakeRecord> {
  const { data: existing } = await supabaseAdmin
    .from('stylist_intake_responses')
    .select('*')
    .eq('consultation_id', input.consultationId)
    .maybeSingle();

  if (existing && !input.refresh) return existing as ConsultationIntakeRecord;

  const source = await loadConsultationSource(input.consultationId);
  if (!source || source.consultation.stylist_id !== input.stylistId) {
    throw new Error('Consultation not found');
  }
  const readiness = consultationReadiness(source);
  if (!readiness.ready && !input.allowIncomplete) throw new Error(`Missing required inputs: ${readiness.missing.join(', ')}`);
  const mapped = consultationSourceToIntake(source);
  const overrides = record(existing?.workspace_overrides);
  const payload = {
    ...mapped,
    ...overrides,
    workspace_overrides: overrides,
  };

  const query = existing
    ? supabaseAdmin.from('stylist_intake_responses').update(payload).eq('id', existing.id)
    : supabaseAdmin.from('stylist_intake_responses').insert(payload);
  const { data, error } = await query.select('*').single();
  if (error || !data) throw new Error(error?.message || 'Could not create consultation intake');
  return data as ConsultationIntakeRecord;
}

function cleanStoragePath(path: string) {
  return path
    .replace(/^\/+/, '')
    .replace(new RegExp(`^${CONSULTATION_UPLOAD_BUCKET}/`), '');
}

export async function signedConsultationPhotoUrls(paths: Record<string, string>, expiresIn = 60 * 60) {
  const entries = await Promise.all(Object.entries(paths).map(async ([key, rawPath]) => {
    const { data, error } = await supabaseAdmin.storage
      .from(CONSULTATION_UPLOAD_BUCKET)
      .createSignedUrl(cleanStoragePath(rawPath), expiresIn);
    return [key, error ? null : data?.signedUrl ?? null] as const;
  }));
  return Object.fromEntries(entries) as Record<string, string | null>;
}

export async function resolveConsultationIntakePhotos<T extends StylistIntakeSubmission & { source_photo_paths?: Record<string, string> | null }>(submission: T): Promise<T> {
  const paths = record(submission.source_photo_paths) as Record<string, string>;
  if (!Object.keys(paths).length) return submission;
  const signed = await signedConsultationPhotoUrls(paths, 2 * 60 * 60);
  return {
    ...submission,
    photo_urls: {
      ...(submission.photo_urls ?? {}),
      headshot: signed.headshot ?? null,
      full_body_front: signed.full_body_front ?? null,
      full_body_side: signed.full_body_side ?? null,
      one_outfit: signed.one_outfit ?? null,
    },
    one_outfit_image_url: signed.one_outfit ?? submission.one_outfit_image_url ?? null,
  };
}

export function workspaceBucket(input: {
  consultationStatus: string;
  readiness: ConsultationReadiness;
  reportStatus?: string | null;
  reportProgress?: string | null;
}) {
  if (input.reportStatus === 'error' || input.consultationStatus === 'stalled') return 'needs_attention';
  if (input.reportStatus === 'delivered' || input.reportStatus === 'sent') return 'delivered';
  if (input.reportStatus === 'approved') return 'ready_to_deliver';
  if (input.reportStatus === 'draft_ready' || input.reportStatus === 'in_review') return 'needs_review';
  if (input.reportStatus === 'generating' || input.reportProgress) return 'generating';
  if (input.consultationStatus === 'delivered') return 'delivered';
  if (!input.readiness.ready) return 'needs_inputs';
  return 'ready';
}
