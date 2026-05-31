import 'server-only';

import { supabaseAdmin } from './supabase';
import { resolveStyleEditImageUrls } from './styleEditImageGenerator';
import type { ResolvedStyleEditImageUrls, StyleEditImagePaths, StyleEditPageData, StyleEditTopicPlan } from './styleEditTypes';

export interface LoadedStyleEditIssue {
  id: string;
  profile_id: string;
  subscription_id: string;
  week_start: string;
  issue_number: number;
  status: string;
  progress_stage: string | null;
  topic_plan: StyleEditTopicPlan;
  page_data: StyleEditPageData | null;
  image_urls: ResolvedStyleEditImageUrls | null;
  share_token: string;
  approval_state: Record<string, boolean>;
  approved_at: string | null;
  scheduled_for: string | null;
  generated_at: string | null;
  sent_at: string | null;
  retry_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  style_edit_client_profiles: {
    customer_email: string;
    customer_name: string | null;
    customer_phone: string | null;
    profile_summary: string | null;
    personalization_profile: Record<string, unknown>;
  } | null;
}

type RawIssue = Omit<LoadedStyleEditIssue, 'image_urls'> & { image_urls: StyleEditImagePaths | null };

async function resolveIssue(row: RawIssue): Promise<LoadedStyleEditIssue> {
  return {
    ...row,
    image_urls: await resolveStyleEditImageUrls(row.image_urls),
  };
}

export async function loadStyleEditIssueById(issueId: string): Promise<LoadedStyleEditIssue | null> {
  const { data, error } = await supabaseAdmin
    .from('style_edit_issues')
    .select('*, style_edit_client_profiles(customer_email, customer_name, customer_phone, profile_summary, personalization_profile)')
    .eq('id', issueId)
    .single();

  if (error || !data) return null;
  return resolveIssue(data as unknown as RawIssue);
}

export async function loadPublicStyleEditIssue(shareToken: string): Promise<LoadedStyleEditIssue | null> {
  const { data, error } = await supabaseAdmin
    .from('style_edit_issues')
    .select('*, style_edit_client_profiles(customer_email, customer_name, customer_phone, profile_summary, personalization_profile)')
    .eq('share_token', shareToken)
    .in('status', ['approved', 'scheduled', 'sending', 'sent'])
    .single();

  if (error || !data) return null;
  return resolveIssue(data as unknown as RawIssue);
}
