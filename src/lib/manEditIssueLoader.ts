import 'server-only';

import { supabaseAdmin } from './supabase';
import { resolveManReportImageUrls, type ManReportImagePaths } from './manImageGenerator';
import type { ReportData } from './manReportGenerator';
import type { ManShoppingState } from './manShopping';
import type { ManEditIssueContent } from './manEditIssueTypes';

// Same statuses the Blueprint share link opens for, so the stylist can preview
// a draft at its real URL before sending. The page marks unsent issues.
const VIEWABLE_STATUSES = ['sent', 'draft_ready', 'in_review', 'approved'];

export interface ManEditIssueSummary {
  issueNumber: number;
  shareToken: string;
  title: string;
  periodLabel: string;
}

export interface LoadedManEditIssue {
  id: string;
  status: string;
  sentAt: string | null;
  shareToken: string;
  s4Outfits: string;
  edit: ManEditIssueContent;
  outfitImages: (string | null)[];
  shopping: ManShoppingState | null;
  votes: Record<string, 'like' | 'dislike'>;
  otherIssues: ManEditIssueSummary[];
}

export function manEditOutfitKey(issueNumber: number, outfitNumber: number) {
  return `edit-${issueNumber}-outfit-${outfitNumber}`;
}

export async function loadManEditIssueByShareToken(shareToken: string): Promise<LoadedManEditIssue | null> {
  const { data: row } = await supabaseAdmin
    .from('man_reports')
    .select('id, status, sent_at, share_token, report_data, image_urls, shopping_data, edit_subscription_id')
    .eq('share_token', shareToken)
    .eq('report_kind', 'edit')
    .in('status', VIEWABLE_STATUSES)
    .maybeSingle();

  const reportData = row?.report_data as ReportData | null;
  if (!row || !reportData?.edit) return null;

  const [images, { data: feedback }, { data: siblings }] = await Promise.all([
    resolveManReportImageUrls(row.image_urls as ManReportImagePaths | null),
    supabaseAdmin
      .from('man_report_outfit_feedback')
      .select('outfit_key, vote')
      .eq('report_id', row.id),
    supabaseAdmin
      .from('man_reports')
      .select('share_token, edit_issue_number, report_data')
      .eq('report_kind', 'edit')
      .eq('edit_subscription_id', row.edit_subscription_id)
      .eq('status', 'sent')
      .neq('id', row.id)
      .order('edit_issue_number', { ascending: false }),
  ]);

  return {
    id: row.id,
    status: row.status,
    sentAt: row.sent_at,
    shareToken: row.share_token,
    s4Outfits: reportData.sections.s4_outfits,
    edit: reportData.edit,
    outfitImages: images?.outfitCards ?? [],
    shopping: row.shopping_data as ManShoppingState | null,
    votes: Object.fromEntries((feedback ?? []).map(item => [item.outfit_key, item.vote])),
    otherIssues: (siblings ?? []).flatMap(item => {
      const edit = (item.report_data as ReportData | null)?.edit;
      return edit && item.share_token
        ? [{ issueNumber: item.edit_issue_number as number, shareToken: item.share_token as string, title: edit.title, periodLabel: edit.periodLabel }]
        : [];
    }),
  };
}

/** Sent Edit issues for the subscription anchored on this Blueprint, newest first. */
export async function listSentEditIssuesForBlueprint(blueprintId: string): Promise<ManEditIssueSummary[]> {
  const { data } = await supabaseAdmin
    .from('man_reports')
    .select('share_token, edit_issue_number, report_data')
    .eq('report_kind', 'edit')
    .eq('parent_report_id', blueprintId)
    .eq('status', 'sent')
    .order('edit_issue_number', { ascending: false });

  return (data ?? []).flatMap(item => {
    const edit = (item.report_data as ReportData | null)?.edit;
    return edit && item.share_token
      ? [{ issueNumber: item.edit_issue_number as number, shareToken: item.share_token as string, title: edit.title, periodLabel: edit.periodLabel }]
      : [];
  });
}
