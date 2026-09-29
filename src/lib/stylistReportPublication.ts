/**
 * One vocabulary for the gap between a stylist's working draft and the copy her
 * client can actually open.
 *
 * A published report carries a frozen snapshot (`published_report_data`) plus
 * the `revision` it was taken at. The stylist keeps editing the live row, so
 * these two drift apart the moment she starts a revision — and that drift, not
 * the report's status, is what tells us there is work the client has not seen.
 */
export interface StylistReportPublicationState {
  revision?: number | null;
  published_at?: string | null;
  published_revision?: number | null;
  published_version?: number | null;
  status?: string | null;
}

/** Has this report been published at least once, i.e. is its link live? */
export function isPublishedReport(report: StylistReportPublicationState | null | undefined) {
  return Boolean(report?.published_at);
}

/**
 * Edits the client has not been given yet. A report that has never been
 * published has no snapshot to differ from, so it reports false: everything in
 * it is unpublished by definition, and the first publish covers all of it.
 *
 * Rows loaded in full answer this exactly, by revision. Summary rows — the
 * dashboard queue carries report headlines, never their bodies — answer it from
 * status instead: the studio sets a report back to in_review on every edit, and
 * publishing moves it forward again, so for a published report the two agree.
 */
export function hasUnpublishedChanges(report: StylistReportPublicationState | null | undefined) {
  if (!report?.published_at) return false;
  if (report.published_revision != null && report.revision != null) {
    return Number(report.revision) !== Number(report.published_revision);
  }
  return report.status === 'in_review' || report.status === 'draft_ready';
}

/** 1 for the report as first delivered, 2 once a revision has been published. */
export function publishedVersion(report: StylistReportPublicationState | null | undefined) {
  return Number(report?.published_version ?? 0);
}

/** Has a revision already been published to this client? */
export function isRevisedReport(report: StylistReportPublicationState | null | undefined) {
  return publishedVersion(report) > 1;
}
