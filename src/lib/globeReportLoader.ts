import 'server-only';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { supabaseGlobeServer } from './serverSupabaseGlobe';
import {
  GLOBE_REPORT_CACHE_SECONDS,
  getGlobeReportCacheTag,
  getGlobeReportShareCacheTag,
} from './globeReportCache';
import {
  resolveGlobeReportImageUrls,
  type GlobeReportImagePaths,
  type ResolvedImageUrls,
} from './globeImageGenerator';
import type { ReportData } from './globeReportGenerator';

const PUBLIC_VIEWABLE_STATUSES = ['sent', 'draft_ready', 'in_review', 'approved'] as const;

export interface AdminLoadedGlobeReport {
  id: string;
  status: string;
  progress_stage: string | null;
  report_data: ReportData | null;
  image_urls: ResolvedImageUrls | null;
  share_token: string;
  section_approvals: Record<string, boolean> | null;
  submission_id: string;
  created_at: string;
  updated_at: string;
  error_message: string | null;
  sent_at: string | null;
  globe_intake_submissions: { id: string; customer_email: string; customer_phone: string | null } | null;
}

export interface PublicLoadedGlobeReport {
  id: string;
  status: string;
  report_data: ReportData | null;
  image_urls: ResolvedImageUrls | null;
  share_token: string;
  sent_at: string | null;
}

type AdminRawGlobeReport = Omit<AdminLoadedGlobeReport, 'image_urls'> & {
  image_urls: GlobeReportImagePaths | null;
};

type PublicRawGlobeReport = Omit<PublicLoadedGlobeReport, 'image_urls'> & {
  image_urls: GlobeReportImagePaths | null;
};

async function resolveRowImages<T extends { image_urls: GlobeReportImagePaths | null }>(
  row: T,
): Promise<Omit<T, 'image_urls'> & { image_urls: ResolvedImageUrls | null }> {
  const imageUrls = await resolveGlobeReportImageUrls(row.image_urls);
  return {
    ...row,
    image_urls: imageUrls,
  };
}

export async function loadAdminGlobeReportByIdFresh(reportId: string): Promise<AdminLoadedGlobeReport | null> {
  const { data, error } = await supabaseGlobeServer
    .from('globe_reports')
    .select('*, globe_intake_submissions(id, customer_email, customer_phone)')
    .eq('id', reportId)
    .single();

  if (error || !data) return null;

  return resolveRowImages(data as AdminRawGlobeReport);
}

async function loadPublicReportByShareToken(shareToken: string): Promise<PublicLoadedGlobeReport | null> {
  const { data, error } = await supabaseGlobeServer
    .from('globe_reports')
    .select('id, status, report_data, image_urls, share_token, sent_at')
    .eq('share_token', shareToken)
    .in('status', [...PUBLIC_VIEWABLE_STATUSES])
    .single();

  if (error || !data) return null;

  return resolveRowImages(data as PublicRawGlobeReport);
}

export const getAdminGlobeReportById = cache(async (reportId: string): Promise<AdminLoadedGlobeReport | null> => {
  const load = unstable_cache(
    () => loadAdminGlobeReportByIdFresh(reportId),
    ['globe-report-admin', reportId],
    {
      revalidate: GLOBE_REPORT_CACHE_SECONDS,
      tags: [getGlobeReportCacheTag(reportId)],
    },
  );

  return load();
});

export const getPublicGlobeReportByShareToken = cache(async (
  shareToken: string,
): Promise<PublicLoadedGlobeReport | null> => {
  const load = unstable_cache(
    () => loadPublicReportByShareToken(shareToken),
    ['globe-report-public', shareToken],
    {
      revalidate: GLOBE_REPORT_CACHE_SECONDS,
      tags: [getGlobeReportShareCacheTag(shareToken)],
    },
  );

  return load();
});
