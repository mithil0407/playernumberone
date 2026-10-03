import 'server-only';

// Who the ICONIK agent is talking to. A WhatsApp number is matched to the
// client's most recent finished report — ICONIK Man (man_reports) or the women's
// Blueprint (stylist_blueprint_reports) — and that report's classification
// becomes their Style Passport. For now the agent is an after-consultation
// service: no finished report, no agent.

import { normalizeIndianWhatsappNumber } from '@/lib/indiaPhone';
import { supabaseAdmin } from '@/lib/supabase';

export type AgentLine = 'man' | 'woman';

export interface AgentClient {
  id: string;
  phone: string;
  first_name: string | null;
  email: string | null;
  line: AgentLine;
  source_table: 'man_reports' | 'stylist_blueprint_reports';
  source_report_id: string;
  report_share_token: string | null;
  status: 'active' | 'paused' | 'opted_out';
  last_inbound_at: string | null;
  last_outbound_at: string | null;
  created_at: string;
}

export interface StylePassport {
  line: AgentLine;
  firstName: string | null;
  /** Compact report facts the agent must treat as source of truth. */
  profile: Record<string, unknown>;
  reportUrl: string | null;
}

type AnyRecord = Record<string, unknown>;

const FINISHED_REPORT_STATUSES = ['sent', 'approved'];

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function firstName(value: unknown) {
  const name = typeof value === 'string' ? value.trim().split(/\s+/)[0] : '';
  return name && !name.includes('@') ? name.charAt(0).toUpperCase() + name.slice(1) : null;
}

/** Keeps only the named keys, dropping empty values, so the passport stays small. */
function pick(source: unknown, keys: string[]) {
  const record = asRecord(source);
  const picked: AnyRecord = {};
  for (const key of keys) {
    const value = record[key];
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value) && !value.length) continue;
    picked[key] = value;
  }
  return picked;
}

async function phoneMatches(table: 'man_intake_submissions' | 'stylist_intake_responses', phone: string) {
  // Phones are stored in whatever format the client typed, so narrow by the last
  // four digits in SQL and compare normalised numbers here.
  const { data, error } = await supabaseAdmin
    .from(table)
    .select(table === 'man_intake_submissions'
      ? 'id, customer_email, customer_phone, created_at'
      : 'id, customer_email, customer_phone, full_name, created_at')
    .ilike('customer_phone', `%${phone.slice(-4)}%`)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(`Could not search ${table}: ${error.message}`);
  return ((data ?? []) as unknown as AnyRecord[])
    .filter(row => normalizeIndianWhatsappNumber(String(row.customer_phone ?? '')) === phone);
}

interface ReportMatch {
  line: AgentLine;
  sourceTable: AgentClient['source_table'];
  reportId: string;
  shareToken: string | null;
  email: string | null;
  firstName: string | null;
  createdAt: string;
}

async function latestReportFor(
  line: AgentLine,
  submissions: AnyRecord[],
): Promise<ReportMatch | null> {
  if (!submissions.length) return null;
  const table = line === 'man' ? 'man_reports' : 'stylist_blueprint_reports';
  const query = supabaseAdmin
    .from(table)
    .select('id, submission_id, share_token, created_at')
    .in('submission_id', submissions.map(row => row.id as string))
    .in('status', FINISHED_REPORT_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1);
  const { data, error } = line === 'man' ? await query.eq('report_kind', 'blueprint') : await query;
  if (error) throw new Error(`Could not load ${table}: ${error.message}`);
  const report = data?.[0];
  if (!report) return null;
  const submission = submissions.find(row => row.id === report.submission_id) ?? {};
  return {
    line,
    sourceTable: table,
    reportId: report.id,
    shareToken: report.share_token ?? null,
    email: typeof submission.customer_email === 'string' ? submission.customer_email.toLowerCase() : null,
    firstName: firstName(submission.full_name),
    createdAt: report.created_at,
  };
}

async function nameFromCustomers(email: string | null) {
  if (!email) return null;
  const { data } = await supabaseAdmin
    .from('customers')
    .select('name')
    .ilike('email', email)
    .not('name', 'is', null)
    .limit(1);
  return firstName(data?.[0]?.name);
}

/**
 * Finds (or enrols) the agent client for a WhatsApp number. Returns null when
 * the number has no finished ICONIK report.
 */
export async function resolveAgentClientByPhone(rawPhone: string): Promise<AgentClient | null> {
  const phone = normalizeIndianWhatsappNumber(rawPhone);
  if (!phone) return null;

  const { data: existing, error } = await supabaseAdmin
    .from('agent_clients')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();
  if (error) throw new Error(`Could not load agent client: ${error.message}`);
  if (existing) return existing as AgentClient;

  const [menSubmissions, womenSubmissions] = await Promise.all([
    phoneMatches('man_intake_submissions', phone),
    phoneMatches('stylist_intake_responses', phone),
  ]);
  const matches = (await Promise.all([
    latestReportFor('man', menSubmissions),
    latestReportFor('woman', womenSubmissions),
  ])).filter((match): match is ReportMatch => Boolean(match));
  if (!matches.length) return null;

  const match = matches.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const name = match.firstName ?? await nameFromCustomers(match.email);
  const { data: created, error: insertError } = await supabaseAdmin
    .from('agent_clients')
    .insert({
      phone,
      first_name: name,
      email: match.email,
      line: match.line,
      source_table: match.sourceTable,
      source_report_id: match.reportId,
      report_share_token: match.shareToken,
    })
    .select('*')
    .single();

  if (insertError) {
    // Two webhooks for the same new client can race; the loser reads the winner's row.
    const { data: raced } = await supabaseAdmin.from('agent_clients').select('*').eq('phone', phone).maybeSingle();
    if (raced) return raced as AgentClient;
    throw new Error(`Could not enrol agent client: ${insertError.message}`);
  }
  return created as AgentClient;
}

export async function loadStylePassport(client: AgentClient): Promise<StylePassport> {
  const { data, error } = await supabaseAdmin
    .from(client.source_table)
    .select('report_data, share_token')
    .eq('id', client.source_report_id)
    .maybeSingle();
  if (error) throw new Error(`Could not load the client's report: ${error.message}`);

  const reportData = asRecord(data?.report_data);
  const classification = asRecord(reportData.classification);
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iconik.pro';
  const shareToken = data?.share_token ?? client.report_share_token;

  if (client.line === 'man') {
    return {
      line: 'man',
      firstName: client.first_name,
      reportUrl: shareToken ? new URL(`/man/report/${shareToken}`, site).toString() : null,
      profile: {
        client: pick(classification.client, ['primary_goal', 'height_category', 'location_region']),
        body: pick(classification.body, [
          'silhouette_type', 'fit_directive', 'highlight_zone', 'minimise_zone', 'avoid_cuts', 'height_adjustment', 'silhouette_rules',
        ]),
        colour: pick(classification.colour, [
          'season', 'undertone', 'skin_tone_depth', 'primary_palette', 'neutral_base_colours', 'accent_colours',
          'colours_to_avoid', 'pattern_guidance', 'fabric_tone_guidance',
        ]),
        style: pick(classification.style_brief, [
          'primary_brief', 'aesthetic_direction', 'tribes', 'register', 'expression', 'structure_level',
          'key_aspiration', 'style_blocker', 'anti_preferences',
        ]),
        face: pick(classification.face, ['face_shape', 'eyewear_shapes']),
      },
    };
  }

  const analysis = asRecord(reportData.analysis);
  return {
    line: 'woman',
    firstName: client.first_name ?? firstName(asRecord(classification.client).name),
    reportUrl: shareToken ? new URL(`/stylist/report/${shareToken}`, site).toString() : null,
    profile: {
      client: pick(classification.client, ['country', 'age_range', 'lifestyle_summary']),
      body: pick(classification.body, ['geometry', 'proportion_directive', 'silhouette_rules', 'focus_areas', 'coverage_rules']),
      colour: pick(classification.colour, [
        'palette_name', 'undertone_direction', 'depth', 'contrast', 'base_palette', 'accent_palette', 'palette', 'avoid_colours',
      ]),
      style: {
        ...pick(classification.taste, ['style_archetype', 'moodboard', 'signature_codes', 'anti_codes', 'shopping_filters']),
        ...pick(analysis, ['style_direction']),
      },
      fabrics: pick(classification.fabrics, ['approved', 'avoid']),
      face_and_accessories: pick(classification.face_hair_accessories, [
        'face_shape', 'neckline_direction', 'approved_necklines', 'earring_shapes', 'jewellery_direction', 'eyewear_shapes',
      ]),
    },
  };
}
