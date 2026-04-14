import 'server-only';

import { revalidateTag } from 'next/cache';
import { supabaseAdmin } from './supabase';

export const MAN_REPORT_CACHE_SECONDS = 60;

export function getManReportCacheTag(reportId: string): string {
  return `man-report:${reportId}`;
}

export function getManReportShareCacheTag(shareToken: string): string {
  return `man-report-share:${shareToken}`;
}

export async function revalidateManReportCache(
  reportId: string,
  shareToken?: string | null,
): Promise<void> {
  revalidateTag(getManReportCacheTag(reportId));

  let resolvedShareToken = shareToken ?? null;

  if (!resolvedShareToken) {
    const { data } = await supabaseAdmin
      .from('man_reports')
      .select('share_token')
      .eq('id', reportId)
      .maybeSingle();

    resolvedShareToken = data?.share_token ?? null;
  }

  if (resolvedShareToken) {
    revalidateTag(getManReportShareCacheTag(resolvedShareToken));
  }
}
