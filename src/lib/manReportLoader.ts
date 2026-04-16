import 'server-only';

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from './supabase';
import {
  MAN_REPORT_CACHE_SECONDS,
  getManReportCacheTag,
  getManReportShareCacheTag,
} from './manReportCache';
import {
  resolveManReportImageUrls,
  type ManReportImagePaths,
  type ResolvedImageUrls,
} from './manImageGenerator';
import type { ReportData } from './manReportGenerator';

const PUBLIC_VIEWABLE_STATUSES = ['sent', 'draft_ready', 'in_review', 'approved'] as const;

export interface AdminLoadedManReport {
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
  man_intake_submissions: { id: string; customer_email: string; customer_phone: string | null } | null;
}

export interface PublicLoadedManReport {
  id: string;
  status: string;
  report_data: ReportData | null;
  image_urls: ResolvedImageUrls | null;
  share_token: string;
  sent_at: string | null;
}

type AdminRawManReport = Omit<AdminLoadedManReport, 'image_urls'> & {
  image_urls: ManReportImagePaths | null;
};

type PublicRawManReport = Omit<PublicLoadedManReport, 'image_urls'> & {
  image_urls: ManReportImagePaths | null;
};

async function resolveRowImages<T extends { image_urls: ManReportImagePaths | null }>(
  row: T,
): Promise<Omit<T, 'image_urls'> & { image_urls: ResolvedImageUrls | null }> {
  const imageUrls = await resolveManReportImageUrls(row.image_urls);
  return {
    ...row,
    image_urls: imageUrls,
  };
}

export async function loadAdminManReportByIdFresh(reportId: string): Promise<AdminLoadedManReport | null> {
  const { data, error } = await supabaseAdmin
    .from('man_reports')
    .select('*, man_intake_submissions(id, customer_email, customer_phone)')
    .eq('id', reportId)
    .single();

  if (error || !data) return null;

  return resolveRowImages(data as AdminRawManReport);
}

async function loadPublicReportByShareToken(shareToken: string): Promise<PublicLoadedManReport | null> {
  const { data, error } = await supabaseAdmin
    .from('man_reports')
    .select('id, status, report_data, image_urls, share_token, sent_at')
    .eq('share_token', shareToken)
    .in('status', [...PUBLIC_VIEWABLE_STATUSES])
    .single();

  if (error || !data) return null;

  return resolveRowImages(data as PublicRawManReport);
}

export const getAdminManReportById = cache(async (reportId: string): Promise<AdminLoadedManReport | null> => {
  const load = unstable_cache(
    () => loadAdminManReportByIdFresh(reportId),
    ['man-report-admin', reportId],
    {
      revalidate: MAN_REPORT_CACHE_SECONDS,
      tags: [getManReportCacheTag(reportId)],
    },
  );

  return load();
});

export const getPublicManReportByShareToken = cache(async (
  shareToken: string,
): Promise<PublicLoadedManReport | null> => {
  const load = unstable_cache(
    () => loadPublicReportByShareToken(shareToken),
    ['man-report-public', shareToken],
    {
      revalidate: MAN_REPORT_CACHE_SECONDS,
      tags: [getManReportShareCacheTag(shareToken)],
    },
  );

  return load();
});
