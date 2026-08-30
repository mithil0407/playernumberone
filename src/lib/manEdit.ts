import 'server-only';

import { GoogleGenAI } from '@google/genai';
import OpenAI, { toFile } from 'openai';
import type { Response as OpenAIResponse } from 'openai/resources/responses/responses';
import { supabaseAdmin } from '@/lib/supabase';
import {
  buildManWhatsappOutfitEngineContext,
  buildManWhatsappShoppingIntent,
  findRequestedRetailer,
  formatShoppingProductLinks,
  manWhatsappVoiceRules,
  rankMatchingShoppingProducts,
  retailersForShoppingIntent,
  type ManWhatsappRouteDecision,
} from '@/lib/manWhatsappStylist';
import type { ClassificationResult } from '@/lib/manReportGenerator';
import { buildManWhatsappOutfitImagePrompt } from '@/lib/manWhatsappOutfitImagePrompt';
import {
  MAN_STYLE_MEMORY_CATEGORIES,
  MAN_STYLE_MEMORY_KINDS,
  enforceContextualMemoryKind,
  normalizeMemoryKey,
  type ManStyleMemory,
  type ManStyleMemoryCategory,
  type ManStyleMemoryKind,
  type ManWhatsappInteractionAnalysis,
} from '@/lib/manWhatsappMemoryPolicy';

const TEXT_MODEL = 'gemini-3-flash-preview';
export const ICONIK_MAN_WHATSAPP_TEXT_MODEL = process.env.ICONIK_MAN_WHATSAPP_TEXT_MODEL?.trim() || 'gpt-5.6-luna';
const OUTFIT_IMAGE_MODEL = process.env.ICONIK_MAN_WHATSAPP_IMAGE_MODEL || 'gpt-image-2';
const CHAT_IMAGE_BUCKET = 'man-edit-chat-images';
const OUTFIT_REFERENCE_MAX_BYTES = 20 * 1024 * 1024;

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

type AnyRecord = Record<string, unknown>;

export interface ManEditReportContext {
  report: {
    id: string;
    share_token: string;
    report_data: AnyRecord | null;
    image_urls: AnyRecord | null;
    shopping_data: AnyRecord | null;
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
    .select('id, status, share_token, report_data, image_urls, shopping_data, man_intake_submissions(*)')
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
        image_urls: asRecord(report.image_urls),
        shopping_data: asRecord(report.shopping_data),
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
      image_urls: asRecord(report.image_urls),
      shopping_data: asRecord(report.shopping_data),
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

function buildStructuredStyleProfile(context: ManEditReportContext) {
  const reportData = asRecord(context.report.report_data);
  const classification = asRecord(reportData.classification);
  const submission = context.submission;

  return {
    classification,
    intake: {
      primaryGoal: firstString(submission.primary_goal, submission.primary_style_goal),
      styleRelationship: firstString(submission.style_relationship),
      dressingContext: firstString(submission.dressing_context),
      location: firstString(submission.location_tier),
      height: firstString(submission.height_category),
      selfReportedBodyShape: firstString(submission.body_shape),
      fatStorageZone: firstString(submission.fat_storage_zone),
      highlightZone: firstString(submission.highlight_zone),
      minimiseZone: firstString(submission.minimise_zone),
      fitPreference: firstString(submission.fit_preference),
      wardrobeComposition: firstString(submission.wardrobe_composition),
      styleTribes: firstString(submission.style_tribes),
      styleStructure: firstString(submission.style_pole_structure),
      styleExpression: firstString(submission.style_pole_expression),
      styleTone: firstString(submission.style_pole_tone),
      styleRegister: firstString(submission.style_pole_register),
      styleBlocker: firstString(submission.style_blocker),
      antiPreferences: firstString(submission.style_anti_pref, submission.style_anti_pref_note),
      freeNote: firstString(submission.free_text_note),
    },
  };
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

function summarizeAvailableImages(imageUrls: AnyRecord) {
  const countArray = (key: string) => Array.isArray(imageUrls[key])
    ? (imageUrls[key] as unknown[]).filter(Boolean).length
    : 0;
  const diagnostic = asRecord(imageUrls.diagnostic);
  const deliverables = asRecord(imageUrls.deliverables);
  const comboGrids = asRecord(imageUrls.comboGridCards);
  const namedCount = (record: AnyRecord) => Object.values(record).filter(Boolean).length;

  return [
    `${countArray('outfitCards')} personalised outfit visual(s)`,
    `${countArray('hairstyleCards')} hairstyle visual(s)`,
    `${countArray('beardCards')} beard visual(s)`,
    `${countArray('eyewearCards')} eyewear visual(s)`,
    `${namedCount(diagnostic)} diagnostic visual(s)`,
    `${namedCount(deliverables)} deliverable image(s)`,
    `${namedCount(comboGrids)} outfit combination grid(s)`,
  ].join(', ');
}

function summarizeShoppingData(shoppingData: AnyRecord) {
  const slots = asRecord(shoppingData.slots);
  const selected = Object.entries(slots).flatMap(([slotKey, rawSlot]) => {
    const slot = asRecord(rawSlot);
    const products = Array.isArray(slot.selected) ? slot.selected : [];
    return products.slice(0, 3).map(rawProduct => {
      const product = asRecord(rawProduct);
      const title = firstString(product.title, slot.descriptor, slotKey);
      const merchant = firstString(product.merchant);
      const url = firstString(product.url);
      return [title, merchant && `from ${merchant}`, url].filter(Boolean).join(' ');
    });
  }).filter(Boolean);

  return selected.length
    ? selected.slice(0, 24).join('\n')
    : 'No verified shopping links are currently attached to the report.';
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
    availableReportVisuals: summarizeAvailableImages(context.report.image_urls ?? {}),
    verifiedShoppingLinks: summarizeShoppingData(context.report.shopping_data ?? {}),
    structuredStyleProfile: buildStructuredStyleProfile(context),
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
  return uploadManEditChatImageBytes(reportId, bytes, file.type || 'image/jpeg', file.name);
}

export async function uploadManEditChatImageBytes(
  reportId: string,
  bytes: Buffer,
  contentType: string,
  originalName = 'whatsapp-image.jpg',
) {
  const extension = originalName.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
  const path = `${reportId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;

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
  memories?: string[];
  channel?: 'web' | 'whatsapp';
  firstName?: string;
  route?: ManWhatsappRouteDecision;
  conversationReference?: string | null;
  memoryDiversityBrief?: string;
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

  const whatsappRules = input.channel === 'whatsapp'
    ? manWhatsappVoiceRules(input.route?.intent ?? 'general_style')
    : '';

  const reportData = asRecord(input.context.report.report_data);
  const classification = asRecord(reportData.classification) as unknown as ClassificationResult;
  const outfitEngine = input.route?.useOutfitEngine && Object.keys(asRecord(reportData.classification)).length
    ? buildManWhatsappOutfitEngineContext({
        classification,
        message: input.message,
        intent: input.route.intent,
      })
    : '';

  const prompt = `You are the ICONIK Man personal stylist. Give useful, relaxed and practical styling advice.

Rules:
- Use the client's profile and report as source-of-truth. Treat saved memories according to their labelled kind.
- Always obey hard constraints and standing instructions. Soft preferences are optional priors, never requirements.
- Use at most one positive soft preference in a recommendation, and only when it genuinely improves this answer. Never repeat an element merely to demonstrate that you remember it.
- Treat historical outfit likes/dislikes as evidence about those specific looks, not an instruction to repeat their colours or garments.
- Use RECENT CHAT for conversational continuity and resolving references only. Do not turn a reaction found there into a durable preference; only LONG-TERM STYLE MEMORIES may influence future turns as memory.
- The latest explicit occasion or dress code overrides an older one. A football request can become casual later, and a casual request can become performance-focused later.
- When the user explicitly switches context, follow the new context. When a short continuation genuinely supports multiple occasions, ask one focused clarification instead of guessing.
- Be direct and specific, but mention only the details needed to act on the answer. Do not name fabric weights or explain styling theory unless asked.
- If the user shares an outfit image, first say what works, then give one or two concrete improvements. Rate the outfit only when requested; never rate the person's body or attractiveness.
- Do not mention internal JSON, database fields, or that you are an AI model.
- For WhatsApp, obey the shorter route-specific length in WHATSAPP VOICE. For web chat, keep the answer under 220 words unless the user asks for a deeper breakdown.
- Follow REQUEST ROUTE as the controlling job for this turn. Do not answer a shopping request as general styling advice.
${whatsappRules}

REQUEST ROUTE:
${input.route?.intent ?? 'general_style'}

CONVERSATION REFERENCE:
${input.conversationReference?.trim() || 'No earlier outfit needs resolving for this turn.'}

${outfitEngine}

CLIENT PROFILE:
${JSON.stringify(profile, null, 2)}

CLIENT NAME:
${input.firstName || 'Client'}

LONG-TERM STYLE MEMORIES:
${input.memories?.length ? input.memories.join('\n') : 'No additional WhatsApp preferences have been saved yet.'}

RECENT RECOMMENDATION DIVERSITY:
${input.memoryDiversityBrief || 'No recent recommendation fingerprints are available.'}

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

  if (input.channel === 'whatsapp') {
    if (!openai) throw new Error('OPENAI_API_KEY is not configured');
    const content: Array<
      | { type: 'input_text'; text: string }
      | { type: 'input_image'; image_url: string; detail: 'auto' }
    > = [{ type: 'input_text', text: prompt }];
    if (input.image) {
      content.push({
        type: 'input_image',
        image_url: `data:${input.image.mimeType};base64,${input.image.bytes.toString('base64')}`,
        detail: 'auto',
      });
    }

    const response = await openai.responses.create({
      model: ICONIK_MAN_WHATSAPP_TEXT_MODEL,
      input: [{ role: 'user', content }],
      reasoning: { effort: 'medium' },
      max_output_tokens: 1_200,
      store: false,
      metadata: { workload: 'iconik_man_whatsapp_reply' },
    });
    return response.output_text.trim()
      || 'I could not generate a useful styling answer for that. Please try rephrasing it.';
  }

  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ parts }],
  });

  return (response.text ?? '').trim() || 'I could not generate a useful styling answer for that. Please try rephrasing it.';
}

interface ShoppingCitation {
  title: string;
  url: string;
  evidence: string;
}

function canonicalRetailUrl(value: string) {
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return value;
  }
}

function shoppingCitations(response: OpenAIResponse) {
  const citations: ShoppingCitation[] = [];
  const seen = new Set<string>();
  for (const output of response.output) {
    if (output.type !== 'message') continue;
    for (const content of output.content) {
      if (content.type !== 'output_text') continue;
      for (const annotation of content.annotations) {
        if (annotation.type !== 'url_citation') continue;
        const url = canonicalRetailUrl(annotation.url);
        if (seen.has(url)) continue;
        seen.add(url);
        const lineStart = content.text.lastIndexOf('\n', Math.max(0, annotation.start_index - 1)) + 1;
        const nextLine = content.text.indexOf('\n', annotation.end_index);
        const lineEnd = nextLine < 0 ? content.text.length : nextLine;
        const evidence = content.text.slice(lineStart, lineEnd)
          .replace(/\s+/g, ' ')
          .trim();
        citations.push({ title: annotation.title || 'Product', url, evidence });
      }
    }
  }
  return citations;
}

function isAllowedRetailUrl(url: string, domains: string[]) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return domains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export async function generateManEditShoppingReply(input: {
  context: ManEditReportContext;
  message: string;
  conversationReference?: string | null;
  memories?: string[];
  memoryDiversityBrief?: string;
}) {
  if (!openai) throw new Error('OPENAI_API_KEY is not configured');
  const retailer = findRequestedRetailer(input.message);
  const shoppingIntent = buildManWhatsappShoppingIntent(input.message, input.conversationReference ?? '');
  if (shoppingIntent.clarification) return shoppingIntent.clarification;

  const allowedRetailers = retailersForShoppingIntent(shoppingIntent, retailer);
  const allowedDomains = allowedRetailers.map(item => item.domain);
  const { profile } = buildManEditProfile(input.context);

  const prompt = `You are ICONIK's high-precision shopping retriever for an Indian male client. Search current products only on the allowed retailer domains.

SHOPPING REQUEST: ${input.message}
RESOLVED PRODUCT QUERY: ${shoppingIntent.query}
GARMENT: ${shoppingIntent.garment}
CURRENT OCCASION: ${shoppingIntent.occasion ?? 'not specified'}
HARD REQUIREMENTS: ${shoppingIntent.hardRequirements.join('; ') || 'correct menswear garment category'}
AUTOMATIC REJECTIONS: ${shoppingIntent.exclusions.join('; ') || 'wrong category or department'}
REQUESTED RETAILER: ${retailer?.name ?? 'No single retailer specified'}
EARLIER OUTFIT DIRECTION: ${input.conversationReference?.trim() || 'None'}
CLIENT STYLE PROFILE: ${JSON.stringify(profile.structuredStyleProfile, null, 2)}
SAVED PREFERENCES: ${input.memories?.length ? input.memories.join('\n') : 'None'}
RECENT RECOMMENDATIONS: ${input.memoryDiversityBrief || 'None'}
SOURCE PRIORITY: ${allowedRetailers.map(item => item.name).join(' > ')}

Find up to three products that satisfy every HARD REQUIREMENT. The latest explicit occasion controls the search; use EARLIER OUTFIT DIRECTION only to resolve words such as this, these, it, or similar. Never let an older colour or occasion override the current request.

For football, training, or running products, require explicit performance/sports evidence and reject cotton-twill, chino, denim, cargo, or casual-only products. Reject wrong colours, wrong garment categories, womenswear, childrenswear, category pages, search-result pages, editorial pages, and weak "closest" matches. Prefer official brand stores and established sports retailers before broad fashion marketplaces.

Return one short line per qualifying product containing its exact product name, retailer, verified colour, and performance/material evidence. Cite that same line with the exact product detail page. Do not cite a page unless the page itself establishes the required attributes. It is correct to return no products when nothing is strong enough.`;

  try {
    const response = await openai.responses.create({
      model: ICONIK_MAN_WHATSAPP_TEXT_MODEL,
      input: prompt,
      tools: [{
        type: 'web_search',
        filters: { allowed_domains: allowedDomains },
        search_context_size: 'medium',
        user_location: {
          type: 'approximate',
          country: 'IN',
          timezone: 'Asia/Kolkata',
        },
      }],
      tool_choice: 'required',
      reasoning: { effort: 'low' },
      max_output_tokens: 1_000,
      store: false,
      metadata: { workload: 'iconik_man_whatsapp_shopping' },
    });
    const citations = shoppingCitations(response)
      .filter(citation => isAllowedRetailUrl(citation.url, allowedDomains))
    const products = rankMatchingShoppingProducts(shoppingIntent, citations);

    if (products.length) {
      return formatShoppingProductLinks(products);
    }
  } catch (error) {
    console.warn('[man whatsapp pilot] precision retailer search failed:', error instanceof Error ? error.message : error);
  }

  const retailerLabel = retailer?.name ?? 'the trusted stores I checked';
  const nextStep = retailer
    ? 'Should I check other trusted stores instead?'
    : 'Should I widen the colour or style slightly?';
  return `I couldn’t find a strong enough ${shoppingIntent.query} match from ${retailerLabel}, so I won’t send you a loosely related product. ${nextStep}`;
}

export async function generateManEditOutfitImage(input: {
  context: ManEditReportContext;
  request: string;
  outfitDirection?: string | null;
  memories?: string[];
}) {
  if (!openai) throw new Error('OPENAI_API_KEY is not configured');
  const { profile } = buildManEditProfile(input.context);
  const headshotUrl = firstString(input.context.submission.photo_headshot_url);
  const fullBodyUrl = firstString(input.context.submission.photo_fullbody_url);
  if (!headshotUrl || !fullBodyUrl) {
    throw new Error('Both the original headshot and full-body reference are required for a personalised outfit visual');
  }
  const referenceCandidates = [
    { label: 'headshot', url: headshotUrl },
    { label: 'full-body', url: fullBodyUrl },
  ];

  const referenceImages = [];
  for (const candidate of referenceCandidates) {
    const response = await fetch(candidate.url);
    if (!response.ok) {
      throw new Error(`${candidate.label} reference fetch failed: HTTP ${response.status}`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > OUTFIT_REFERENCE_MAX_BYTES) {
      throw new Error(`${candidate.label} reference has invalid size: ${bytes.length}`);
    }
    const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || 'image/jpeg';
    if (!/^image\/(?:jpeg|png|webp)$/i.test(mimeType)) {
      throw new Error(`${candidate.label} reference has unsupported type: ${mimeType}`);
    }
    const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    referenceImages.push(await toFile(bytes, `${candidate.label}.${extension}`, { type: mimeType }));
  }

  if (referenceImages.length !== 2) {
    throw new Error('Both client reference images must be usable for a personalised outfit visual');
  }

  const reportData = asRecord(input.context.report.report_data);
  const classification = asRecord(reportData.classification);
  const face = asRecord(classification.face);
  const prompt = buildManWhatsappOutfitImagePrompt({
    profile,
    request: input.request,
    outfitDirection: input.outfitDirection,
    memories: input.memories,
    facialHairPresence: firstString(face.facial_hair_presence, face.facialHairPresence) || 'unclear',
  });

  const result = await openai.images.edit({
    model: OUTFIT_IMAGE_MODEL,
    image: referenceImages,
    prompt,
    size: '1024x1536',
    quality: 'medium',
    output_format: 'png',
  });
  const imageBase64 = (result as { data?: Array<{ b64_json?: string }> }).data?.[0]?.b64_json;
  if (!imageBase64) throw new Error('The image model returned no image data');

  return {
    bytes: Buffer.from(imageBase64, 'base64'),
    mimeType: 'image/png',
    model: OUTFIT_IMAGE_MODEL,
  };
}

export async function analyzeManWhatsappInteraction(input: {
  userMessage: string;
  assistantReply: string;
  route: string;
  activeMemories: ManStyleMemory[];
  selectedMemoryKeys: string[];
}): Promise<ManWhatsappInteractionAnalysis> {
  const empty: ManWhatsappInteractionAnalysis = {
    memoryUpdates: [],
    recommendationFingerprint: null,
  };
  if (!input.userMessage.trim() || /^\[Unsupported WhatsApp message:/i.test(input.userMessage)) {
    return empty;
  }

  const activeMemorySummary = input.activeMemories.map(memory => ({
    memory_key: memory.memoryKey,
    kind: memory.kind,
    category: memory.category,
    value: memory.value,
    context_scopes: memory.contextScopes,
  }));
  const prompt = `Analyse one completed ICONIK Man WhatsApp interaction. This is a memory write and recommendation audit, not a reply to the customer.

Return ONLY valid JSON in this exact shape:
{
  "memory_updates": [{
    "memory_key": "exact existing key when this reinforces the same semantic fact, otherwise null",
    "kind": "hard_constraint|standing_instruction|soft_preference|wardrobe_fact|local_feedback",
    "category": "like|dislike|fit|colour|brand|budget|owned_item|lifestyle|other",
    "value": "short standalone fact",
    "context_scopes": ["occasion, garment or situation where this applies"],
    "strength": 0.0,
    "confidence": 0.0,
    "supersedes_keys": ["exact existing memory key"]
  }],
  "recommendation_fingerprint": {
    "primary_colours": ["string"],
    "primary_garments": ["string"],
    "layer_type": "string or null",
    "bottom_silhouette": "string or null",
    "footwear": "string or null",
    "archetype": "string or null",
    "memory_keys_used": ["exact selected memory key"]
  }
}

MEMORY CLASSIFICATION:
- "I like this jacket/look" or approval of the current answer is local_feedback. It describes this specific option and must not become a universal preference.
- An explicit general pattern such as "I usually prefer...", "I love wearing...", or repeated evidence is soft_preference.
- "Always do..." is standing_instruction. A clear global "never", "avoid", allergy, non-negotiable or firm dislike is hard_constraint.
- Owned clothes, budget and recurring lifestyle facts are wardrobe_fact.
- Do not save a one-off occasion, a question, sensitive personal data, inferred image traits, the assistant's suggestion, or anything the customer did not explicitly state.
- Use context scopes whenever a preference is conditional. Keep an empty array only for genuinely general facts.
- Set supersedes_keys only for a clear contradiction, using exact keys from ACTIVE MEMORIES. Never guess a key.
- When the customer repeats or paraphrases an existing fact, set memory_key to that exact existing key so the evidence is reinforced instead of creating a duplicate.
- Maximum four updates. Omit anything below 0.75 confidence.

FINGERPRINT RULES:
- Return null unless the assistant reply actually recommends an outfit, garment or purchasable option.
- Describe only the recommendation that was actually given, not the customer message.
- memory_keys_used must be a subset of SELECTED MEMORY KEYS and include only a memory visibly reflected in the recommendation. It may be empty.

ROUTE: ${input.route}
ACTIVE MEMORIES: ${JSON.stringify(activeMemorySummary)}
SELECTED MEMORY KEYS: ${JSON.stringify(input.selectedMemoryKeys)}
CUSTOMER: ${input.userMessage}
ASSISTANT: ${input.assistantReply}`;

  try {
    if (!openai) throw new Error('OPENAI_API_KEY is not configured');
    const response = await openai.responses.create({
      model: ICONIK_MAN_WHATSAPP_TEXT_MODEL,
      input: prompt,
      reasoning: { effort: 'low' },
      max_output_tokens: 1_000,
      store: false,
      metadata: { workload: 'iconik_man_whatsapp_memory_v2' },
    });
    const parsed = asRecord(JSON.parse(extractJson(response.output_text)));
    const activeKeys = new Set(input.activeMemories.map(memory => memory.memoryKey));
    const selectedKeys = new Set(input.selectedMemoryKeys);
    const memoryUpdates = (Array.isArray(parsed.memory_updates) ? parsed.memory_updates : [])
      .flatMap(raw => {
        const memory = asRecord(raw);
        const category = firstString(memory.category) as ManStyleMemoryCategory;
        const proposedKind = firstString(memory.kind) as ManStyleMemoryKind;
        const value = firstString(memory.value).slice(0, 240);
        const confidence = typeof memory.confidence === 'number'
          ? Math.max(0, Math.min(1, memory.confidence))
          : 0;
        const strength = typeof memory.strength === 'number'
          ? Math.max(0, Math.min(1, memory.strength))
          : 0.5;
        if (
          !MAN_STYLE_MEMORY_CATEGORIES.includes(category)
          || !MAN_STYLE_MEMORY_KINDS.includes(proposedKind)
          || !value
          || confidence < 0.75
        ) return [];
        const kind = enforceContextualMemoryKind({
          message: input.userMessage,
          category,
          proposedKind,
        });
        const contextScopes = (Array.isArray(memory.context_scopes) ? memory.context_scopes : [])
          .filter((scope): scope is string => typeof scope === 'string' && Boolean(scope.trim()))
          .map(scope => scope.trim().slice(0, 80))
          .slice(0, 5);
        const supersedesKeys = (Array.isArray(memory.supersedes_keys) ? memory.supersedes_keys : [])
          .filter((key): key is string => typeof key === 'string' && activeKeys.has(key))
          .slice(0, 5);
        const proposedMemoryKey = firstString(memory.memory_key);
        const matchingActiveMemory = input.activeMemories.find(active => active.memoryKey === proposedMemoryKey);
        const memoryKey = matchingActiveMemory?.category === category
          ? proposedMemoryKey
          : normalizeMemoryKey(category, value);
        return [{
          memoryKey,
          category,
          kind,
          value,
          contextScopes,
          strength,
          confidence,
          supersedesKeys,
        }];
      })
      .slice(0, 4);

    const rawFingerprint = asRecord(parsed.recommendation_fingerprint);
    const hasFingerprint = Object.keys(rawFingerprint).length > 0;
    const strings = (value: unknown, limit = 8) => (Array.isArray(value) ? value : [])
      .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
      .map(item => item.trim().slice(0, 80))
      .slice(0, limit);
    const nullableString = (value: unknown) => typeof value === 'string' && value.trim()
      ? value.trim().slice(0, 80)
      : null;
    const memoryKeysUsed = strings(rawFingerprint.memory_keys_used)
      .filter(key => selectedKeys.has(key));
    const recommendationFingerprint = hasFingerprint ? {
      primaryColours: strings(rawFingerprint.primary_colours),
      primaryGarments: strings(rawFingerprint.primary_garments),
      layerType: nullableString(rawFingerprint.layer_type),
      bottomSilhouette: nullableString(rawFingerprint.bottom_silhouette),
      footwear: nullableString(rawFingerprint.footwear),
      archetype: nullableString(rawFingerprint.archetype),
      memoryKeysUsed,
    } : null;

    return { memoryUpdates, recommendationFingerprint };
  } catch (error) {
    console.warn('[man whatsapp pilot] interaction analysis skipped:', error instanceof Error ? error.message : error);
    return empty;
  }
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
