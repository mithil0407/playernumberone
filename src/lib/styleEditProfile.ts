import 'server-only';

import { supabaseAdmin } from './supabase';
import type { StyleEditPersonalizationProfile } from './styleEditTypes';

type AnyRecord = Record<string, unknown>;

interface StyleEditSubscriptionRow extends AnyRecord {
  id: string;
  order_id: string | null;
  lead_id: string | null;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function summarizeIntake(intake: AnyRecord | null) {
  if (!intake) return '';
  const lifestyle = asRecord(intake.lifestyle_context);
  const pieces = asRecord(intake.piece_preferences);
  return [
    firstString(intake.selected_moodboard_label),
    asStringArray(intake.focus_areas).join(', '),
    firstString(lifestyle.occupation, lifestyle.shopFrequency),
    firstString(pieces.tops, pieces.bottoms),
  ].filter(Boolean).join(' | ');
}

function profileFromRows(input: {
  subscription: StyleEditSubscriptionRow;
  intake: AnyRecord | null;
  report: AnyRecord | null;
  lead: AnyRecord | null;
  recentTopics: string[];
}): StyleEditPersonalizationProfile {
  const { subscription, intake, report, lead, recentTopics } = input;
  const reportData = asRecord(report?.report_data);
  const analysis = asRecord(reportData.analysis);
  const classification = asRecord(reportData.classification);
  const client = asRecord(classification.client);
  const taste = asRecord(classification.taste);
  const body = asRecord(classification.body);
  const colour = asRecord(classification.colour);
  const intakeLifestyle = asRecord(intake?.lifestyle_context);

  return {
    client: {
      name: firstString(client.name, intake?.full_name, subscription.customer_name, subscription.customer_email.split('@')[0]),
      email: subscription.customer_email,
      phone: firstString(subscription.customer_phone, intake?.customer_phone) || null,
      country: firstString(client.country, intake?.country),
    },
    styleProfile: {
      archetype: firstString(taste.style_archetype, analysis.style_direction, lead?.aesthetic, intake?.selected_moodboard_label),
      moodboard: firstString(taste.moodboard, intake?.selected_moodboard_label),
      signatureCodes: asStringArray(taste.signature_codes),
      antiCodes: asStringArray(taste.anti_codes),
      shoppingFilters: asStringArray(taste.shopping_filters),
    },
    body: {
      geometry: firstString(body.geometry, analysis.silhouette_profile, lead?.body_shape),
      focusAreas: asStringArray(body.focus_areas).length ? asStringArray(body.focus_areas) : asStringArray(intake?.focus_areas),
      silhouetteRules: asStringArray(body.silhouette_rules),
      coverageRules: asStringArray(body.coverage_rules),
    },
    colour: {
      paletteName: firstString(colour.palette_name, analysis.chromatic_family, lead?.colour_direction),
      palette: Array.isArray(colour.palette)
        ? colour.palette as Array<{ name: string; hex: string; usage?: string }>
        : Array.isArray(colour.base_palette)
          ? colour.base_palette as Array<{ name: string; hex: string; usage?: string }>
          : [],
      avoidColours: asStringArray(colour.avoid_colours),
    },
    lifestyle: {
      ...intakeLifestyle,
      dressingContext: lead?.dressing_context ?? null,
      styleStruggle: lead?.style_struggle ?? null,
      budget: intakeLifestyle.budget ?? null,
    },
    photos: asRecord(intake?.photo_urls),
    intakeSummary: summarizeIntake(intake),
    recentIssueTopics: recentTopics,
  };
}

export async function logStyleEditEvent(input: {
  issueId?: string | null;
  profileId?: string | null;
  subscriptionId?: string | null;
  eventType: string;
  status?: string | null;
  message?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await supabaseAdmin.from('style_edit_generation_events').insert({
    issue_id: input.issueId ?? null,
    profile_id: input.profileId ?? null,
    subscription_id: input.subscriptionId ?? null,
    event_type: input.eventType,
    status: input.status ?? null,
    message: input.message ?? null,
    metadata: input.metadata ?? {},
  });
}

export async function buildStyleEditClientProfile(subscriptionId: string) {
  const { data: subscription, error: subError } = await supabaseAdmin
    .from('style_edit_subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single();

  if (subError || !subscription) {
    throw new Error('Style Edit subscription not found');
  }

  const typedSubscription = subscription as StyleEditSubscriptionRow;
  const email = typedSubscription.customer_email;

  const [intakeRes, reportRes, leadRes, previousIssuesRes] = await Promise.all([
    supabaseAdmin
      .from('stylist_intake_responses')
      .select('*')
      .eq('customer_email', email)
      .not('completed_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from('stylist_blueprint_reports')
      .select('*, stylist_intake_responses!inner(customer_email)')
      .eq('stylist_intake_responses.customer_email', email)
      .in('status', ['draft_ready', 'in_review', 'approved', 'sent'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    typedSubscription.lead_id
      ? supabaseAdmin.from('style_scan_leads').select('*').eq('id', typedSubscription.lead_id).maybeSingle()
      : supabaseAdmin.from('style_scan_leads').select('*').eq('email', email).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin
      .from('style_edit_issues')
      .select('topic_plan')
      .eq('subscription_id', subscriptionId)
      .order('week_start', { ascending: false })
      .limit(6),
  ]);

  const intake = (intakeRes.data as AnyRecord | null) ?? null;
  const report = (reportRes.data as AnyRecord | null) ?? null;
  const lead = (leadRes.data as AnyRecord | null) ?? null;
  const recentTopics = (previousIssuesRes.data ?? [])
    .map(row => firstString(asRecord(row.topic_plan).title, asRecord(row.topic_plan).theme))
    .filter(Boolean);

  const hasMinimumProfile = Boolean(intake || report || lead);
  const personalizationProfile = profileFromRows({
    subscription: typedSubscription,
    intake,
    report,
    lead,
    recentTopics,
  });
  const profileSummary = [
    personalizationProfile.styleProfile.archetype,
    personalizationProfile.colour.paletteName,
    personalizationProfile.body.geometry,
  ].filter(Boolean).join(' | ');
  const now = new Date().toISOString();

  const payload = {
    subscription_id: subscriptionId,
    order_id: typedSubscription.order_id ?? intake?.order_id ?? null,
    lead_id: typedSubscription.lead_id ?? intake?.lead_id ?? lead?.id ?? null,
    intake_id: intake?.id ?? null,
    blueprint_report_id: report?.id ?? null,
    customer_email: email,
    customer_name: typedSubscription.customer_name ?? personalizationProfile.client.name,
    customer_phone: typedSubscription.customer_phone ?? personalizationProfile.client.phone ?? null,
    status: hasMinimumProfile ? 'ready' : 'pending_profile',
    profile_summary: profileSummary || null,
    personalization_profile: personalizationProfile,
    source_snapshot: {
      subscription_id: subscriptionId,
      intake_id: intake?.id ?? null,
      blueprint_report_id: report?.id ?? null,
      lead_id: lead?.id ?? null,
    },
    last_built_at: now,
    error_message: hasMinimumProfile ? null : 'No completed intake, Blueprint, or Style Score found yet.',
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from('style_edit_client_profiles')
    .upsert(payload, { onConflict: 'subscription_id' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to build Style Edit profile');
  }

  await logStyleEditEvent({
    profileId: data.id,
    subscriptionId,
    eventType: 'profile_rebuilt',
    status: data.status,
    message: data.error_message,
  });

  return data;
}

export async function ensureStyleEditClientProfile(subscriptionId: string) {
  const { data } = await supabaseAdmin
    .from('style_edit_client_profiles')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .maybeSingle();

  if (data) return data;
  return buildStyleEditClientProfile(subscriptionId);
}

export function getWeekStart(date = new Date()) {
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = next.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setUTCDate(next.getUTCDate() + diff);
  return next.toISOString().slice(0, 10);
}
