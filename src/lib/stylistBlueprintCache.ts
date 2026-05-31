import { revalidateTag } from 'next/cache';
import { supabaseAdmin } from './supabase';

export const STYLIST_BLUEPRINT_CACHE_SECONDS = 60;

export function getStylistBlueprintCacheTag(reportId: string) {
  return `stylist-blueprint:${reportId}`;
}

export function getStylistBlueprintShareCacheTag(shareToken: string) {
  return `stylist-blueprint-share:${shareToken}`;
}

export async function revalidateStylistBlueprintCache(reportId: string, shareToken?: string | null) {
  revalidateTag(getStylistBlueprintCacheTag(reportId));

  let resolvedShareToken = shareToken ?? null;
  if (!resolvedShareToken) {
    const { data } = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('share_token')
      .eq('id', reportId)
      .maybeSingle();
    resolvedShareToken = data?.share_token ?? null;
  }

  if (resolvedShareToken) {
    revalidateTag(getStylistBlueprintShareCacheTag(resolvedShareToken));
  }
}
