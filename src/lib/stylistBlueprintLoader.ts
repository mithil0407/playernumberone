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
  mapStylistBlueprintImagePaths,
  resolveStylistBlueprintImageUrls,
  type StylistBlueprintImagePaths,
  type ResolvedStylistBlueprintImageUrls,
} from './stylistBlueprintImageGenerator';
import type { LegacyStylistBlueprintReportData, StylistBlueprintReportData } from './stylistBlueprintGenerator';
import { isVersionedStylistBlueprintReportData } from './stylistBlueprintSchema';
import { hasUnpublishedChanges, publishedVersion } from './stylistReportPublication';

const ADMIN_REPORT_SELECT_WITH_SOURCE = '*, stylist_intake_responses(id, customer_email, customer_phone, full_name, intake_source, consultation_id)';
const ADMIN_REPORT_SELECT_LEGACY = '*, stylist_intake_responses(id, customer_email, customer_phone, full_name)';
// Everything on the row, so a published snapshot column that a database has not
// been migrated for yet reads as absent rather than failing the query and taking
// every client link down with it. Only publicReport()'s picked fields are
// ever returned to a reader.
const PUBLIC_REPORT_SELECT_WITH_SOURCE = '*, stylist_intake_responses(id, customer_email, customer_phone, full_name, intake_source)';
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
  published_report_data?: StylistBlueprintReportData | LegacyStylistBlueprintReportData | null;
  published_revision?: number | null;
  published_version?: number | null;
  stylist_intake_responses: { id: string; customer_email: string | null; customer_phone: string | null; full_name: string | null; intake_source?: string | null; consultation_id?: string | null } | null;
}

type RawStylistBlueprintReport = Omit<LoadedStylistBlueprintReport, 'image_urls'> & {
  image_urls: StylistBlueprintImagePaths | null;
  published_image_urls?: StylistBlueprintImagePaths | null;
};

/**
 * Which copy of a report a reader gets. `published` is the snapshot written at
 * publish time — what the client was sent and keeps seeing while her stylist
 * edits. `draft` is the stylist's live working copy, used only for her own
 * preview. Reports that have never been published have no snapshot, so both
 * resolve to the live row exactly as before.
 */
type ReportView = 'published' | 'draft';

function viewedReport(row: RawStylistBlueprintReport, view: ReportView) {
  const snapshot = view === 'published' && row.published_report_data != null;
  return {
    report_data: snapshot ? row.published_report_data ?? null : row.report_data,
    image_urls: snapshot ? row.published_image_urls ?? null : row.image_urls,
  };
}

type PublicStylistBlueprintReport = Pick<LoadedStylistBlueprintReport, 'id' | 'status' | 'report_data' | 'image_urls' | 'progress_stage' | 'error_message'> & {
  stylist_intake_responses: { intake_source?: string | null } | null;
};

export function stylistBlueprintClientImageUrl(shareToken: string, path: string) {
  return `/api/stylist-blueprint/share/${encodeURIComponent(shareToken)}/image?p=${encodeURIComponent(path)}`;
}

async function publicReport(row: RawStylistBlueprintReport, view: ReportView = 'published'): Promise<PublicStylistBlueprintReport> {
  const viewed = viewedReport(row, view);
  let data = viewed.report_data;
  if (isVersionedStylistBlueprintReportData(data)) {
    const { outfit_engine: _internalEngine, ...clientData } = data;
    void _internalEngine;
    const hidden = new Set(data.studio?.hidden_page_numbers ?? []);
    data = { ...clientData, pages: data.pages.filter(page => !hidden.has(page.page_number)) };
  }
  return {
    id: row.id, status: row.status, report_data: data,
    // Stable links that sign on request. The page is cached, and signed URLs
    // baked into it expired after an hour, so a client opening her link later
    // saw every image broken.
    image_urls: mapStylistBlueprintImagePaths(viewed.image_urls, path => stylistBlueprintClientImageUrl(row.share_token, path)),
    progress_stage: null, error_message: null,
    stylist_intake_responses: row.stylist_intake_responses ? { intake_source: row.stylist_intake_responses.intake_source } : null,
  };
}

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

/**
 * The client-facing view of a report plus whether its share link is live. India
 * consultation reports go live only once published; other reports are live as
 * soon as they exist.
 */
async function loadClientReportByShareToken(shareToken: string, options: { requireLive?: boolean; view?: ReportView } = {}): Promise<{ report: PublicStylistBlueprintReport; live: boolean; publishedVersion: number; hasUnpublishedChanges: boolean } | null> {
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
    const live = !(intake?.intake_source === 'india_consultation' && !row.published_at);
    // Skip resolving signed image URLs for a link that is about to 404.
    if (!live && options.requireLive) return null;
    return {
      report: await publicReport({ ...row, stylist_intake_responses: intake }, options.view ?? 'published'),
      live,
      publishedVersion: publishedVersion(row),
      hasUnpublishedChanges: hasUnpublishedChanges(row),
    };
  }

  if (isMissingIntakeSourceError(result.error)) {
    const legacyResult = await supabaseAdmin
      .from('stylist_blueprint_reports')
      .select(PUBLIC_REPORT_SELECT_LEGACY)
      .eq('share_token', shareToken)
      .maybeSingle();

    if (!legacyResult.error && legacyResult.data) {
      return { report: await publicReport(legacyResult.data as unknown as RawStylistBlueprintReport), live: true, publishedVersion: 0, hasUnpublishedChanges: false };
    }
  }

  return null;
}

async function loadPublicByShareToken(shareToken: string): Promise<PublicStylistBlueprintReport | null> {
  const loaded = await loadClientReportByShareToken(shareToken, { requireLive: true });
  return loaded?.live ? loaded.report : null;
}

/**
 * The exact client view of a report, including one not yet published, for staff
 * previewing it. Deliberately uncached: it must reflect the latest edits, and an
 * unpublished report must never land in the public cache. Callers must check
 * access with canAccessBlueprintReport before rendering it.
 *
 * This is the one reader that wants the live draft: a stylist previewing a
 * revision needs to see her unpublished edits, not the copy her client is
 * still reading.
 */
export async function getStylistBlueprintClientPreviewByShareToken(shareToken: string) {
  return loadClientReportByShareToken(shareToken, { view: 'draft' });
}

export const getStylistBlueprintReportById = cache(async (reportId: string) => {
  const load = unstable_cache(
    () => loadStylistBlueprintReportByIdFresh(reportId),
    ['stylist-blueprint-admin', reportId],
    { revalidate: STYLIST_BLUEPRINT_CACHE_SECONDS, tags: [getStylistBlueprintCacheTag(reportId)] },
  );
  return load();
});

/** One row, typed by hand because it is fetched with two different selects. */
type ClientImageSourceRow = {
  id: string;
  image_urls: StylistBlueprintImagePaths | null;
  published_image_urls?: StylistBlueprintImagePaths | null;
  published_at: string | null;
  stylist_intake_responses: { intake_source?: string | null } | Array<{ intake_source?: string | null }> | null;
};

async function loadClientImageSource(shareToken: string) {
  const select = (columns: string) => supabaseAdmin
    .from('stylist_blueprint_reports')
    .select(columns)
    .eq('share_token', shareToken)
    .maybeSingle();
  const snapshot = await select('id, image_urls, published_image_urls, published_at, stylist_intake_responses(intake_source)');
  // Same reason as the row select above: images must keep resolving on a
  // database that has not run the snapshot migration yet.
  const fallback = snapshot.error
    ? await select('id, image_urls, published_at, stylist_intake_responses(intake_source)')
    : snapshot;
  const data = fallback.data as unknown as ClientImageSourceRow | null;
  if (!data) return null;
  const intake = Array.isArray(data.stylist_intake_responses) ? data.stylist_intake_responses[0] : data.stylist_intake_responses;
  const live = !(intake?.intake_source === 'india_consultation' && !data.published_at);
  const draftPaths = data.image_urls ?? null;
  const publishedPaths = data.published_image_urls ?? null;
  return {
    reportId: data.id,
    // What the client's copy of the page references, and may be served publicly.
    imagePaths: publishedPaths ?? draftPaths,
    // Images that only exist in the stylist's unpublished draft. Staff-only:
    // a client mid-revision must not be served her half-finished new looks.
    draftImagePaths: draftPaths,
    live,
  };
}

/** What the client image route needs, cached briefly because a report page requests dozens of images at once. */
export const getStylistBlueprintClientImageSource = cache(async (shareToken: string) => {
  const load = unstable_cache(
    () => loadClientImageSource(shareToken),
    ['stylist-blueprint-client-images-v1', shareToken],
    { revalidate: STYLIST_BLUEPRINT_CACHE_SECONDS, tags: [getStylistBlueprintShareCacheTag(shareToken)] },
  );
  return load();
});

export const getPublicStylistBlueprintByShareToken = cache(async (shareToken: string) => {
  const load = unstable_cache(
    () => loadPublicByShareToken(shareToken),
    ['stylist-blueprint-public-v3', shareToken],
    { revalidate: STYLIST_BLUEPRINT_CACHE_SECONDS, tags: [getStylistBlueprintShareCacheTag(shareToken)] },
  );
  return load();
});
