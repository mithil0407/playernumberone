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

const PUBLIC_VIEWABLE_STATUSES = ['sent', 'draft_ready', 'in_review', 'approved'] as const;

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
  stylist_intake_responses: { id: string; customer_email: string; customer_phone: string | null; full_name: string | null } | null;
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

export async function loadStylistBlueprintReportByIdFresh(reportId: string): Promise<LoadedStylistBlueprintReport | null> {
  const { data, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('*, stylist_intake_responses(id, customer_email, customer_phone, full_name)')
    .eq('id', reportId)
    .single();

  if (error || !data) return null;
  return resolveRowImages(data as unknown as RawStylistBlueprintReport);
}

async function loadPublicByShareToken(shareToken: string): Promise<LoadedStylistBlueprintReport | null> {
  const { data, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, status, report_data, image_urls, share_token, sent_at, section_approvals, submission_id, created_at, updated_at, error_message, progress_stage, stylist_intake_responses(id, customer_email, customer_phone, full_name)')
    .eq('share_token', shareToken)
    .in('status', [...PUBLIC_VIEWABLE_STATUSES])
    .single();

  if (error || !data) return null;
  return resolveRowImages(data as unknown as RawStylistBlueprintReport);
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
    ['stylist-blueprint-public', shareToken],
    { revalidate: STYLIST_BLUEPRINT_CACHE_SECONDS, tags: [getStylistBlueprintShareCacheTag(shareToken)] },
  );
  return load();
});
