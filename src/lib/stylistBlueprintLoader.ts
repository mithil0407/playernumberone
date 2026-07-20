import 'server-only';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from './supabase';
import {
  STYLIST_BLUEPRINT_CACHE_SECONDS,
  getStylistBlueprintCacheTag,
  getStylistBlueprintShareCacheTag,
} from './stylistBlueprintCache';
import {
  resolveStylistBlueprintImageUrls,
  type StylistBlueprintImagePaths,
  type ResolvedStylistBlueprintImageUrls,
} from './stylistBlueprintImageGenerator';
import type { LegacyStylistBlueprintReportData, StylistBlueprintReportData } from './stylistBlueprintGenerator';

const ADMIN_REPORT_SELECT_WITH_SOURCE = '*, stylist_intake_responses(id, customer_email, customer_phone, full_name, intake_source, consultation_id)';
const ADMIN_REPORT_SELECT_LEGACY = '*, stylist_intake_responses(id, customer_email, customer_phone, full_name)';
const PUBLIC_REPORT_SELECT_WITH_SOURCE = 'id, status, report_data, image_urls, share_token, sent_at, published_at, delivered_at, revision, section_approvals, submission_id, created_at, updated_at, error_message, progress_stage, stylist_intake_responses(id, customer_email, customer_phone, full_name, intake_source)';
const PUBLIC_REPORT_SELECT_LEGACY = 'id, status, report_data, image_urls, share_token, sent_at, section_approvals, submission_id, created_at, updated_at, error_message, progress_stage, stylist_intake_responses(id, customer_email, customer_phone, full_name)';

export interface LoadedStylistBlueprintReport {
  id: string;
  status: string;
  progress_stage: string | null;
  report_data: StylistBlueprintReportData | LegacyStylistBlueprintReportData | null;
  image_urls: ResolvedStylistBlueprintImageUrls | null;
  share_token: string;
  section_approvals: Record<string, boolean> | null;
  submission_id: string;
  created_at: string;
  updated_at: string;
  error_message: string | null;
  sent_at: string | null;
  published_at?: string | null;
  delivered_at?: string | null;
  revision?: number;
  stylist_intake_responses: { id: string; customer_email: string | null; customer_phone: string | null; full_name: string | null; intake_source?: string | null; consultation_id?: string | null } | null;
}

type RawStylistBlueprintReport = Omit<LoadedStylistBlueprintReport, 'image_urls'> & {
  image_urls: StylistBlueprintImagePaths | null;
};

async function resolveRowImages<T extends { image_urls: StylistBlueprintImagePaths | null }>(
  row: T,
): Promise<Omit<T, 'image_urls'> & { image_urls: ResolvedStylistBlueprintImageUrls | null }> {
  const imageUrls = await resolveStylistBlueprintImageUrls(row.image_urls);
  return { ...row, image_urls: imageUrls };
}

function isMissingIntakeSourceError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: string; message?: string; details?: string; hint?: string };
  const text = [candidate.code, candidate.message, candidate.details, candidate.hint].filter(Boolean).join(' ');
  return /intake_source/i.test(text) && /(PGRST204|schema cache|column|does not exist|could not find)/i.test(text);
}

export async function loadStylistBlueprintReportByIdFresh(reportId: string): Promise<LoadedStylistBlueprintReport | null> {
  const result = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select(ADMIN_REPORT_SELECT_WITH_SOURCE)
    .eq('id', reportId)
    .single();

  if (!result.error && result.data) {
    return resolveRowImages(result.data as unknown as RawStylistBlueprintReport);
  }

  if (isMissingIntakeSourceError(result.error)) {
    const legacyResult = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select(ADMIN_REPORT_SELECT_LEGACY)
      .eq('id', reportId)
      .single();

    if (!legacyResult.error && legacyResult.data) {
      return resolveRowImages(legacyResult.data as unknown as RawStylistBlueprintReport);
    }
  }

  return null;
}

async function loadPublicByShareToken(shareToken: string): Promise<LoadedStylistBlueprintReport | null> {
  const result = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select(PUBLIC_REPORT_SELECT_WITH_SOURCE)
    .eq('share_token', shareToken)
    .maybeSingle();

  if (!result.error && result.data) {
    const row = result.data as unknown as RawStylistBlueprintReport;
    const intake = Array.isArray(row.stylist_intake_responses)
      ? row.stylist_intake_responses[0]
      : row.stylist_intake_responses;
    if (intake?.intake_source === 'india_consultation' && !row.published_at) return null;
    return resolveRowImages(row);
  }

  if (isMissingIntakeSourceError(result.error)) {
    const legacyResult = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select(PUBLIC_REPORT_SELECT_LEGACY)
      .eq('share_token', shareToken)
      .maybeSingle();

    if (!legacyResult.error && legacyResult.data) {
      return resolveRowImages(legacyResult.data as unknown as RawStylistBlueprintReport);
    }
  }

  return null;
}

export const getStylistBlueprintReportById = cache(async (reportId: string) => {
  const load = unstable_cache(
    () => loadStylistBlueprintReportByIdFresh(reportId),
    ['stylist-blueprint-admin', reportId],
    { revalidate: STYLIST_BLUEPRINT_CACHE_SECONDS, tags: [getStylistBlueprintCacheTag(reportId)] },
  );
  return load();
});

export const getPublicStylistBlueprintByShareToken = cache(async (shareToken: string) => {
  const load = unstable_cache(
    () => loadPublicByShareToken(shareToken),
    ['stylist-blueprint-public-v2', shareToken],
    { revalidate: STYLIST_BLUEPRINT_CACHE_SECONDS, tags: [getStylistBlueprintShareCacheTag(shareToken)] },
  );
  return load();
});
