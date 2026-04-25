import 'server-only';

import { revalidateTag } from 'next/cache';
import { supabaseGlobeServer } from './serverSupabaseGlobe';

export const GLOBE_REPORT_CACHE_SECONDS = 60;

export function getGlobeReportCacheTag(reportId: string): string {
  return `globe-report:${reportId}`;
}

export function getGlobeReportShareCacheTag(shareToken: string): string {
  return `globe-report-share:${shareToken}`;
}

export async function revalidateGlobeReportCache(
  reportId: string,
  shareToken?: string | null,
): Promise<void> {
  revalidateTag(getGlobeReportCacheTag(reportId));

  let resolvedShareToken = shareToken ?? null;

  if (!resolvedShareToken) {
    const { data } = await supabaseGlobeServer
      .from('globe_reports')
      .select('share_token')
      .eq('id', reportId)
      .maybeSingle();

    resolvedShareToken = data?.share_token ?? null;
  }

  if (resolvedShareToken) {
    revalidateTag(getGlobeReportShareCacheTag(resolvedShareToken));
  }
}
