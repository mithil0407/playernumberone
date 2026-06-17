import 'server-only';

import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '@/lib/supabase';

const TEXT_MODEL = 'gemini-3-flash-preview';
const CHAT_IMAGE_BUCKET = 'man-edit-chat-images';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

type AnyRecord = Record<string, unknown>;

export interface ManEditReportContext {
  report: {
    id: string;
    share_token: string;
    report_data: AnyRecord | null;
    status: string;
  };
  submission: AnyRecord;
  subscription: AnyRecord | null;
  feedback: AnyRecord[];
  recommendations: AnyRecord[];
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function toIsoFromSeconds(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? new Date(value * 1000).toISOString()
    : null;
}

export function currentMonthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export async function loadManEditReportContext(
  shareToken: string,
  requireActiveSubscription = true,
): Promise<ManEditReportContext | null> {
  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('id, status, share_token, report_data, man_intake_submissions(*)')
    .eq('share_token', shareToken)
    .in('status', ['sent', 'draft_ready', 'in_review', 'approved'])
    .maybeSingle();

  if (error || !report) return null;

  const rawSubmission = report.man_intake_submissions;
  const submission = Array.isArray(rawSubmission)
    ? asRecord(rawSubmission[0])
    : asRecord(rawSubmission);
  const email = firstString(submission.customer_email, asRecord(report.report_data).clientEmail);

  if (!email) return null;

  const { data: subscription } = await supabaseAdmin
    .from('man_edit_subscriptions')
    .select('*')
    .eq('customer_email', email)
    .in('status', ['active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (requireActiveSubscription && !subscription) {
    return {
      report: {
        id: report.id,
        share_token: report.share_token,
        report_data: asRecord(report.report_data),
        status: report.status,
      },
      submission,
      subscription: null,
      feedback: [],
      recommendations: [],
    };
  }

  if (subscription?.id && !subscription.report_id) {
    await supabaseAdmin
      .from('man_edit_subscriptions')
      .update({ report_id: report.id })
      .eq('id', subscription.id);
  }

  const [{ data: feedback }, { data: recommendations }] = await Promise.all([
    supabaseAdmin
      .from('man_report_outfit_feedback')
      .select('*')
      .eq('report_id', report.id)
      .order('updated_at', { ascending: false }),
    supabaseAdmin
      .from('man_edit_monthly_recommendations')
      .select('*')
      .eq('report_id', report.id)
      .in('status', ['approved', 'sent'])
      .order('month_start', { ascending: false }),
  ]);

  return {
    report: {
      id: report.id,
      share_token: report.share_token,
      report_data: asRecord(report.report_data),
      status: report.status,
    },
    submission,
    subscription: subscription ?? null,
    feedback: feedback ?? [],
    recommendations: recommendations ?? [],
  };
}

export function hasActiveManEdit(context: ManEditReportContext | null) {
  return Boolean(context?.subscription?.id && context.subscription.status === 'active');
}

function summarizeReport(reportData: AnyRecord) {
  const classification = asRecord(reportData.classification);
  const sections = asRecord(reportData.sections);
  const body = asRecord(classification.body);
  const face = asRecord(classification.face);
  const colour = asRecord(classification.colour);
  const styleBrief = asRecord(classification.style_brief);

  return [
    `Body: ${firstString(body.silhouette_type, body.fit_directive, sections.s2_body_geometry)}`,
    `Face/Grooming: ${firstString(face.face_shape, face.grooming_focus, sections.s1_face_architecture)}`,
    `Colour: ${firstString(colour.season, colour.undertone, sections.s3_chromatic_harmony)}`,
    `Style direction: ${firstString(styleBrief.aesthetic_direction, styleBrief.primary_brief, sections.s0_snapshot)}`,
    `Outfit formulas: ${asString(sections.s4_outfits).slice(0, 5000)}`,
    `Shopping rules: ${asString(sections.s5_shopping ?? sections.s5_rules).slice(0, 1800)}`,
  ].filter(Boolean).join('\n\n');
}

function summarizeSubmission(submission: AnyRecord) {
  return [
    `Goal: ${firstString(submission.primary_goal, submission.primary_style_goal)}`,
    `Dressing context: ${firstString(submission.dressing_context)}`,
    `Wardrobe: ${firstString(submission.wardrobe_composition)}`,
    `Fit preference: ${firstString(submission.fit_preference)}`,
    `Anti-preferences: ${firstString(submission.style_anti_pref, submission.style_anti_pref_note)}`,
    `Free note: ${firstString(submission.free_text_note)}`,
  ].filter(line => !line.endsWith(': ')).join('\n');
}

function summarizeFeedback(feedback: AnyRecord[]) {
  if (!feedback.length) return 'No outfit likes/dislikes have been recorded yet.';
  return feedback.map(item => {
    const label = firstString(item.outfit_label, item.outfit_key);
    return `${item.vote === 'like' ? 'Liked' : 'Disliked'}: ${label}`;
  }).join('\n');
}

function summarizeRecommendations(recommendations: AnyRecord[]) {
  if (!recommendations.length) return 'No approved monthly edits yet.';
  return recommendations.slice(0, 4).map(item => {
    const data = asRecord(item.page_data);
    return `${item.month_start}: ${firstString(data.title, data.issueTitle, `Issue ${item.issue_number}`)}`;
  }).join('\n');
}

export function buildManEditProfile(context: ManEditReportContext) {
  const profile = {
    client: {
      email: firstString(context.submission.customer_email),
      phone: firstString(context.submission.customer_phone),
      name: firstString(context.subscription?.customer_name, context.submission.customer_email).split('@')[0],
    },
    reportSummary: summarizeReport(context.report.report_data ?? {}),
    intakeSummary: summarizeSubmission(context.submission),
    outfitFeedback: summarizeFeedback(context.feedback),
    monthlyHistory: summarizeRecommendations(context.recommendations),
  };

  const profileSummary = [
    firstString(asRecord(asRecord(context.report.report_data).classification).style_brief),
    firstString(context.submission.primary_goal),
    `${context.feedback.length} outfit feedback signal(s)`,
  ].filter(Boolean).join(' | ');

  return { profile, profileSummary };
}

export async function rebuildManEditProfile(context: ManEditReportContext) {
  if (!context.subscription?.id) return null;
  const { profile, profileSummary } = buildManEditProfile(context);

  const { data, error } = await supabaseAdmin
    .from('man_edit_profiles')
    .upsert({
      subscription_id: context.subscription.id,
      report_id: context.report.id,
      customer_email: firstString(context.submission.customer_email, context.subscription.customer_email),
      customer_name: firstString(context.subscription.customer_name),
      status: 'ready',
      profile_summary: profileSummary || null,
      personalization_profile: profile,
      source_snapshot: {
        report_id: context.report.id,
        subscription_id: context.subscription.id,
        feedback_count: context.feedback.length,
      },
      last_built_at: new Date().toISOString(),
      error_message: null,
    }, { onConflict: 'subscription_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function updateManEditSubscriptionFromWebhook(input: {
  subscriptionId: string;
  status: string;
  paymentId?: string | null;
  currentStart?: number;
  chargeAt?: number;
  endedAt?: number;
}) {
  const patch: Record<string, unknown> = {
    status: input.status,
    updated_at: new Date().toISOString(),
  };
  if (input.paymentId) patch.razorpay_payment_id = input.paymentId;
  if (input.currentStart) patch.start_at = toIsoFromSeconds(input.currentStart);
  if (input.chargeAt) patch.next_billing_at = toIsoFromSeconds(input.chargeAt);
  if (input.endedAt) patch.ended_at = toIsoFromSeconds(input.endedAt);
  if (input.status === 'cancelled') patch.cancelled_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('man_edit_subscriptions')
    .update(patch)
    .eq('razorpay_subscription_id', input.subscriptionId)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getManEditSubscriptionByRazorpayId(subscriptionId: string) {
  const { data, error } = await supabaseAdmin
    .from('man_edit_subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', subscriptionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function uploadManEditChatImage(reportId: string, file: File) {
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
  const path = `${reportId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const contentType = file.type || 'image/jpeg';

  const { data, error } = await supabaseAdmin.storage
    .from(CHAT_IMAGE_BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw error;

  const { data: signed } = await supabaseAdmin.storage
    .from(CHAT_IMAGE_BUCKET)
    .createSignedUrl(data.path, 60 * 60 * 24 * 30);

  return {
    path: data.path,
    signedUrl: signed?.signedUrl ?? null,
    bytes,
    mimeType: contentType,
  };
}

export async function generateManEditChatReply(input: {
  context: ManEditReportContext;
  message: string;
  image?: { bytes: Buffer; mimeType: string } | null;
}) {
  const { profile } = buildManEditProfile(input.context);
  const { data: recentMessages } = await supabaseAdmin
    .from('man_edit_chat_messages')
    .select('role, content')
    .eq('report_id', input.context.report.id)
    .order('created_at', { ascending: false })
    .limit(12);

  const history = [...(recentMessages ?? [])].reverse()
    .map(item => `${item.role}: ${item.content}`)
    .join('\n');

  const prompt = `You are the ICONIK Man AI stylist. Give precise, practical, premium styling advice.

Rules:
- Use the client's profile, report, likes, and dislikes as source-of-truth.
- Be direct and specific: name colours, fits, fabric weights, styling fixes, and what to avoid.
- If the user asks about an uploaded outfit image, evaluate fit, colour harmony, occasion appropriateness, and 2-4 concrete improvements.
- Do not mention internal JSON, database fields, or that you are an AI model.
- Keep the answer under 220 words unless the user asks for a deeper breakdown.

CLIENT PROFILE:
${JSON.stringify(profile, null, 2)}

RECENT CHAT:
${history || 'No previous chat.'}

USER QUESTION:
${input.message}`;

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (input.image) {
    parts.push({
      inlineData: {
        mimeType: input.image.mimeType,
        data: input.image.bytes.toString('base64'),
      },
    });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ parts }],
  });

  return (response.text ?? '').trim() || 'I could not generate a useful styling answer for that. Please try rephrasing it.';
}

function extractJson(text: string) {
  const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? match[0] : cleaned;
}

export async function generateManEditMonthlyDraft(context: ManEditReportContext, issueNumber: number) {
  const { profile } = buildManEditProfile(context);
  const prompt = `You are ICONIK's senior men's stylist. Create one monthly outfit recommendation edit for this paid Iconik Man Edit subscriber.

Return ONLY valid JSON:
{
  "title": "string",
  "subtitle": "string",
  "monthLabel": "string",
  "clientName": "string",
  "diagnosis": "string",
  "outfits": [
    {
      "title": "string",
      "occasion": "string",
      "formula": "string",
      "colourLogic": "string",
      "fitLogic": "string",
      "shoppingNotes": "string"
    }
  ],
  "paletteNotes": ["string", "string", "string"],
  "avoidThisMonth": ["string", "string", "string"],
  "stylistNote": "string"
}

Rules:
- Generate exactly 6 outfits.
- Use Indian shopping language and climate context when relevant.
- Reflect the client's liked/disliked outfit feedback.
- Do not recommend items that conflict with their body geometry, colours to avoid, or anti-preferences.
- The edit must feel premium, direct, and immediately usable.

Issue number: ${issueNumber}
Profile:
${JSON.stringify(profile, null, 2)}`;

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ parts: [{ text: prompt }] }],
  });

  const raw = response.text ?? '';
  try {
    return JSON.parse(extractJson(raw)) as AnyRecord;
  } catch {
    throw new Error(`Gemini returned invalid monthly edit JSON: ${raw.slice(0, 300)}`);
  }
}
