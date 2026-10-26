import 'server-only';

import { supabaseAdmin } from './supabase';
import { classifyIntakePhotoStoragePath, PRIVATE_STYLIST_PHOTO_BUCKET } from './stylistIntakeStoragePath';
import type { StylistIntakeSubmission } from './stylistBlueprintGenerator';
import { consultationReadiness } from './stylistConsultationReadiness';
export { consultationReadiness } from './stylistConsultationReadiness';
import { inferMeasurementUnit, type MeasurementUnit } from './consultationMeasurements';
export type { ConsultationReadiness } from './stylistConsultationReadiness';

export const CONSULTATION_UPLOAD_BUCKET = 'consultation-client-uploads';
export const PRIVATE_STYLIST_INTAKE_BUCKET = PRIVATE_STYLIST_PHOTO_BUCKET;

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
  // Commas inside brackets belong to one answer: "Earthy colours (Navy blue,
  // rust, terracotta)" is one preference, not three fragments.
  return one ? one.split(/[,;\n](?![^()]*\))/).map(item => item.trim()).filter(Boolean) : [];
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

function measurementCentimetres(value: unknown, unit: MeasurementUnit) {
  const parsed = numeric(value);
  if (parsed === undefined) return undefined;
  return Math.round((unit === 'in' ? parsed * 2.54 : parsed) * 10) / 10;
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

  if (consultationResult.error || uploadResult.error) throw new Error('Could not load consultation inputs. Please retry.');
  if (!consultationResult.data) return null;
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
  const measurementUnit = inferMeasurementUnit(uploadMeasurements);
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
    shoulders_cm: measurementCentimetres(uploadMeasurements.shoulders, measurementUnit),
    bust_cm: measurementCentimetres(uploadMeasurements.bust, measurementUnit),
    chest_cm: measurementCentimetres(uploadMeasurements.chest, measurementUnit),
    waist_cm: measurementCentimetres(uploadMeasurements.waist, measurementUnit),
    hips_cm: measurementCentimetres(uploadMeasurements.hips, measurementUnit),
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
      fit_restrictions: [...list(data.fitRestrictions), ...list(data.fitRestrictionsOther)],
      fabric_restrictions: [...list(data.fabricRestrictions), ...list(data.fabricsAvoided).filter(item => !/^none\.?$/i.test(item))],
      cultural_restrictions: list(data.culturalRestrictions),
      modesty_preference: text(data.modestyPreference),
      modesty_reason: text(data.modestyReason),
    }),
    lifestyle_context: compact({
      occupation: text(data.occupation),
      occasions: Array.from(new Set([...list(data.occasions), ...list(data.occasionsNeedHelp)])),
      upcoming_events: list(data.upcomingEvents).length ? list(data.upcomingEvents) : list(data.upcomingEvent),
      winterwear: text(data.winterwearNeed),
      consultation_reason: text(data.consultationReason),
      desired_feelings: list(data.desiredFeelings),
      life_changes: list(data.lifeChanges),
      goals,
      market: 'India',
    }),
    piece_preferences: compact({
      loved: list(data.itemsLoved),
      go_to_outfits: list(data.goToOutfits),
      fabrics_preferred: list(data.fabricsPreferred).filter(item => !/^no preference\.?$/i.test(item)),
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
  const entries = Object.entries(paths).filter(([, path]) => typeof path === 'string' && path.trim());
  if (!entries.length) return {} as Record<string, string | null>;
  const normalized = entries.map(([, path]) => cleanStoragePath(path));
  const { data, error } = await supabaseAdmin.storage.from(CONSULTATION_UPLOAD_BUCKET).createSignedUrls(normalized, expiresIn);
  if (error) throw new Error('Could not load client photos. Please retry.');
  const signedByPath = new Map((data ?? []).map(item => [item.path, item.signedUrl]));
  return Object.fromEntries(entries.map(([key], index) => [key, signedByPath.get(normalized[index]) || null])) as Record<string, string | null>;

}

export async function signedIntakePhotoUrls(paths: Record<string, string>, expiresIn = 60 * 60) {
  const entries = Object.entries(paths).filter(([, value]) => typeof value === 'string' && value.trim());
  if (!entries.length) return {} as Record<string, string | null>;
  const signed = await Promise.all(entries.map(async ([key, rawPath]) => {
    const classified = classifyIntakePhotoStoragePath(rawPath);
    if (!classified) throw new Error('Invalid intake photo path');
    const { data, error } = await supabaseAdmin.storage.from(classified.bucket).createSignedUrl(classified.path, expiresIn);
    if (error || !data?.signedUrl) throw new Error(`Could not load ${key} photo. Please retry.`);
    return [key, data.signedUrl] as const;
  }));
  return Object.fromEntries(signed) as Record<string, string | null>;
}

export async function resolveConsultationIntakePhotos<T extends StylistIntakeSubmission & { source_photo_paths?: Record<string, string> | null }>(submission: T): Promise<T> {
  const paths = record(submission.source_photo_paths) as Record<string, string>;
  if (!Object.keys(paths).length) return submission;
  const signed = await signedIntakePhotoUrls(paths, 2 * 60 * 60);
  return {
    ...submission,
    photo_urls: {
      ...(submission.photo_urls ?? {}),
      ...signed,
    },
    one_outfit_image_url: signed.one_outfit ?? submission.one_outfit_image_url ?? null,
  };
}

/**
 * The client's answers as the current mapping reads them. An intake is
 * snapshotted when a report is first created, so one made before a mapping fix
 * still lacks answers such as "No dresses and skirts at work" or her go-to
 * outfits. Outfit routes re-read the consultation so a regenerate sees what
 * she actually said; the stylist's own overrides still win. Falls back to the
 * stored intake if the consultation cannot be read.
 */
export async function withCurrentConsultationAnswers<T extends StylistIntakeSubmission & { consultation_id?: string | null; workspace_overrides?: unknown }>(submission: T): Promise<T> {
  if (!submission.consultation_id) return submission;
  try {
    const source = await loadConsultationSource(submission.consultation_id);
    if (!source) return submission;
    const mapped = consultationSourceToIntake(source);
    const overrides = record(submission.workspace_overrides);
    const pick = (key: 'coverage_requirements' | 'piece_preferences' | 'lifestyle_context') =>
      (overrides[key] as Record<string, unknown> | undefined) ?? mapped[key] ?? submission[key];
    return {
      ...submission,
      coverage_requirements: pick('coverage_requirements'),
      piece_preferences: pick('piece_preferences'),
      lifestyle_context: pick('lifestyle_context'),
    };
  } catch {
    return submission;
  }
}

export { workspaceBucket } from './stylistWorkspaceQueueModel';
