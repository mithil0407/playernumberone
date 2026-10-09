import 'server-only';

// Style Membership server actions: the WhatsApp gate, the selfie reading, the
// one personalised look, checkout and activation, the autopay mandate and the
// renewal payment link. Nothing here sends a WhatsApp message: messages are
// queued (styleMembershipStore.queueMessages) for whoever is cleared to send.

import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';
import { attributionToColumns } from '@/lib/attribution';
import { normalizeIndianWhatsappNumber } from '@/lib/indiaPhone';
import { sendMetaPurchaseEvent, sendMetaServerEvent } from '@/lib/metaConversionsApi';
import { parseColourObservations, readingsFrom, seasonFor, READING_GUIDE } from '@/lib/agentColourSeason';
import {
  MANDATE_TOTAL_COUNT,
  MEMBERSHIP_CONTENT_NAME,
  MEMBERSHIP_FUNNEL_CATEGORY,
  MEMBERSHIP_NOTES_PRODUCT,
  MEMBERSHIP_PERIOD_DAYS,
  RAZORPAY_PLAN_ENV,
  isMembershipPlanId,
  membershipContentIds,
  priceMembershipOrder,
  type MembershipPlanId,
} from './styleMembershipConfig';
import {
  SHAPES,
  SKIN_TONES,
  SWIPE_LOOKS,
  likelySeason,
  paletteFor,
  resolveShape,
  type QuizAnswers,
} from './styleMembershipLogic';
import { membershipSchedule } from './styleMembershipSchedule';
import { createLeadToken, createMemberCode, hashToken } from './styleMembershipTokens';
import {
  activateMembershipOnce,
  claimLookGeneration,
  deleteObject,
  findMembership,
  getLead,
  getLeadByTokenHash,
  insertLead,
  insertMembership,
  isPastBuyer,
  looksGeneratedSince,
  putObject,
  queueMessages,
  updateLead,
  updateMembership,
  type Membership,
  type MembershipLead,
} from './styleMembershipStore';

export const CONSENT_VERSION = 'style-membership-v1-2026-10-09';
export const SELFIE_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const IMAGE_MODEL = process.env.ICONIK_AGENT_IMAGE_MODEL?.trim() || 'gemini-nano-banana-2.1';
const VISION_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';
const DAILY_LOOK_CAP = Number(process.env.STYLE_MEMBERSHIP_DAILY_LOOKS) || 200;

let ai: GoogleGenAI | null = null;
function gemini() {
  if (!process.env.GOOGLE_AI_API_KEY) throw new Error('GOOGLE_AI_API_KEY is not configured');
  ai ??= new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  return ai;
}

function razorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) throw new Error('Razorpay is not configured');
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

export class MembershipError extends Error {
  constructor(message: string, readonly status = 400, readonly code = 'bad_request') {
    super(message);
  }
}

function cleanText(value: unknown, max = 80) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

function cleanEmail(value: unknown) {
  const email = cleanText(value, 200)?.toLowerCase() ?? null;
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** Answers come from the browser: keep only known keys with sane shapes. */
export function sanitizeAnswers(raw: unknown): QuizAnswers {
  const source = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const text = (key: string) => cleanText(source[key], 40) ?? undefined;
  const list = (key: string) => Array.isArray(source[key])
    ? (source[key] as unknown[]).filter((item): item is string => typeof item === 'string').map(item => item.slice(0, 40)).slice(0, 12)
    : undefined;
  const swipes: Record<string, 'love' | 'skip'> = {};
  const rawSwipes = source.swipes && typeof source.swipes === 'object' ? source.swipes as Record<string, unknown> : {};
  for (const look of SWIPE_LOOKS) {
    if (rawSwipes[look.id] === 'love' || rawSwipes[look.id] === 'skip') swipes[look.id] = rawSwipes[look.id] as 'love' | 'skip';
  }
  const height = Number(source.heightCm);
  return {
    age: text('age') as QuizAnswers['age'],
    dressFor: list('dressFor'),
    climate: text('climate'),
    goal: text('goal'),
    gettingReady: text('gettingReady'),
    heightCm: Number.isFinite(height) && height >= 120 && height <= 200 ? Math.round(height) : undefined,
    shape: text('shape') as QuizAnswers['shape'],
    shapeShoulders: text('shapeShoulders') as QuizAnswers['shapeShoulders'],
    shapeGain: text('shapeGain') as QuizAnswers['shapeGain'],
    showOff: list('showOff'),
    playDown: list('playDown'),
    bodyChanged: text('bodyChanged'),
    skinTone: SKIN_TONES.some(tone => tone.id === source.skinTone) ? source.skinTone as QuizAnswers['skinTone'] : undefined,
    metal: text('metal') as QuizAnswers['metal'],
    veins: text('veins') as QuizAnswers['veins'],
    compliments: list('compliments'),
    swipes,
    stores: list('stores'),
    budgetEveryday: text('budgetEveryday'),
    budgetOccasion: text('budgetOccasion'),
    size: text('size'),
    comingUp: list('comingUp'),
    weddingFunctions: text('weddingFunctions'),
    extras: source.extras === 'yes' || source.extras === 'no' ? source.extras : undefined,
  };
}

// ── The WhatsApp gate ────────────────────────────────────────────────────────

export interface GateInput {
  phone: unknown;
  email?: unknown;
  firstName?: unknown;
  consent: unknown;
  answers: unknown;
  sessionId?: unknown;
  attribution?: unknown;
  eventId?: unknown;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export async function createLeadFromGate(input: GateInput) {
  const phone = normalizeIndianWhatsappNumber(typeof input.phone === 'string' ? input.phone : '');
  if (!phone) throw new MembershipError('Please enter a 10-digit Indian WhatsApp number.', 400, 'invalid_phone');
  if (input.consent !== true) throw new MembershipError('Please tick the box so your stylist can message you on WhatsApp.', 400, 'no_consent');
  const email = cleanEmail(input.email);
  if (input.email && typeof input.email === 'string' && input.email.trim() && !email) {
    throw new MembershipError('That email doesn’t look right. You can leave it empty.', 400, 'invalid_email');
  }
  const answers = sanitizeAnswers(input.answers);
  const token = createLeadToken();
  const attribution = attributionToColumns(input.attribution);
  const lead = await insertLead({
    token_hash: hashToken(token),
    session_id: cleanText(input.sessionId, 64),
    phone,
    email,
    first_name: cleanText(input.firstName, 40),
    whatsapp_consent_at: new Date().toISOString(),
    consent_version: CONSENT_VERSION,
    answers,
    selfie_path: null,
    selfie_delete_after: null,
    selfie_season: null,
    selfie_reading: null,
    look_path: null,
    look_status: 'none',
    source: 'quiz',
    ...attribution,
  });

  // Her Style DNA card goes out on WhatsApp once a template is approved; it is
  // queued here, never sent from the funnel.
  await queueMessages([{
    membership_id: null,
    lead_id: lead.id,
    kind: 'lead_dna_card',
    step_id: null,
    due_at: new Date().toISOString(),
    status: 'queued',
    title: 'Her Style DNA card',
    brief: 'Send her Style DNA card (chips, likely season, look 1) and a link back to her result.',
    needs_template: true,
    pay_link_url: null,
    razorpay_payment_link_id: null,
    payload: { first_name: lead.first_name },
  }]);

  const eventId = cleanText(input.eventId, 100);
  if (eventId) {
    void sendMetaServerEvent({
      eventName: 'Lead',
      eventId,
      externalId: lead.id,
      customerEmail: email,
      customerPhone: phone,
      customerName: lead.first_name,
      countryCode: 'in',
      phoneCountryCode: '91',
      attribution,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      customData: { content_name: MEMBERSHIP_CONTENT_NAME, content_category: MEMBERSHIP_FUNNEL_CATEGORY },
    });
  }
  return { lead, token };
}

export async function leadFromToken(token: unknown): Promise<MembershipLead> {
  if (typeof token !== 'string' || token.length < 20) throw new MembershipError('Your session has expired. Please retake the quiz.', 401, 'no_lead');
  const lead = await getLeadByTokenHash(hashToken(token));
  if (!lead) throw new MembershipError('Your session has expired. Please retake the quiz.', 401, 'no_lead');
  return lead;
}

/** What the browser may see about her lead. */
export function publicLead(lead: MembershipLead) {
  const season = paletteFor(lead.selfie_season);
  return {
    id: lead.id,
    firstName: lead.first_name,
    answers: lead.answers,
    selfieSeason: season ? { name: season.name, best: season.best, avoid: season.avoid, metal: season.metal, line: season.line, family: season.family } : null,
    selfieDone: Boolean(lead.selfie_season),
    lookStatus: lead.look_status,
    lookUrl: lead.look_status === 'ready' ? `/api/style-membership/look?lead=${lead.id}&v=${encodeURIComponent(lead.updated_at)}` : null,
  };
}

// ── Optional selfie: her real colour season ─────────────────────────────────

const SELFIE_PROMPT = `You are an expert colour analyst for Indian women. Read this selfie and return ONLY JSON:
{"usable": boolean, "reason": string, "undertone": "warm"|"cool"|"neutral"|"olive", "skin_depth": 1-10, "hair_depth": 1-10, "eye_depth": 1-10, "chroma": "muted"|"clear"}
"usable" is false when there is no clear face, heavy filters, very dark or coloured light, or sunglasses; then "reason" says what to change in a few friendly words.
${READING_GUIDE}`;

export async function readSelfie(lead: MembershipLead, bytes: Buffer) {
  if (bytes.length > 8 * 1024 * 1024) throw new MembershipError('That photo is too large. Please use one under 8 MB.', 413, 'too_large');
  // Re-encode: strips location and camera metadata, and keeps the file small.
  const clean = await sharp(bytes).rotate().resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer()
    .catch(() => { throw new MembershipError('We couldn’t open that photo. Please try a JPG or PNG.', 400, 'bad_image'); });

  const response = await gemini().models.generateContent({
    model: VISION_MODEL,
    contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: clean.toString('base64') } }, { text: SELFIE_PROMPT }] }],
    config: { responseMimeType: 'application/json', httpOptions: { timeout: 45_000 } },
  });
  let raw: Record<string, unknown> = {};
  try {
    raw = JSON.parse(response.text ?? '{}');
  } catch {
    throw new MembershipError('We couldn’t read that photo. Please try again in daylight.', 422, 'unreadable');
  }
  if (raw.usable === false) {
    throw new MembershipError(typeof raw.reason === 'string' && raw.reason ? raw.reason : 'Please try a clear selfie in daylight, no filter.', 422, 'unusable');
  }
  const observations = parseColourObservations(raw);
  if (!observations) throw new MembershipError('We couldn’t read that photo. Please try again in daylight.', 422, 'unreadable');
  const season = seasonFor(readingsFrom(observations));

  const selfiePath = await putObject(`selfies/${lead.id}.jpg`, clean, 'image/jpeg');
  const updated = await updateLead(lead.id, {
    selfie_path: selfiePath,
    selfie_delete_after: new Date(Date.now() + SELFIE_RETENTION_DAYS * DAY_MS).toISOString(),
    selfie_season: season,
    selfie_reading: { ...observations, read_at: new Date().toISOString(), model: VISION_MODEL },
  });
  return updated ?? lead;
}

// ── The one personalised look, made only when she reaches her result ───────

function lookPrompt(answers: QuizAnswers, seasonName: string | null) {
  const tone = SKIN_TONES.find(item => item.id === answers.skinTone)?.label.toLowerCase() ?? 'wheatish';
  const shape = resolveShape(answers);
  const season = paletteFor(seasonName) ?? likelySeason(answers);
  const loved = SWIPE_LOOKS.find(look => answers.swipes?.[look.id] === 'love') ?? SWIPE_LOOKS[0];
  const colours = season ? season.best.slice(0, 3).map(swatch => swatch.name.toLowerCase()).join(', ') : 'rust, ivory and camel';
  const ageHint = answers.age === '45+' ? 'about 48' : answers.age === '35-44' ? 'about 38' : answers.age === '18-24' ? 'about 23' : 'about 30';
  return [
    'Editorial fashion photograph for a premium, calm style-coaching app. Warm cream seamless studio backdrop (#F3EEE6), soft diffused natural window light, gentle realistic shadows, generous negative space.',
    `Full-length. An Indian woman ${ageHint} years old with ${tone} skin${shape ? ` and a ${SHAPES[shape].label.toLowerCase()}-shaped figure` : ''}, natural Indian features, relaxed confident smile.`,
    `She wears a ${loved.label.toLowerCase()} in the spirit of "${loved.detail}", recoloured in ${colours}, cut to flatter her shape: ${shape ? SHAPES[shape].rule : 'clean, balanced lines.'}`,
    'Photorealistic, natural skin texture, anatomically correct hands. No text, no logos, no watermarks, no extra people.',
  ].join(' ');
}

/** Generates her look 1 once (per lead, under a daily cap); returns the lead as it stands. */
export async function ensurePersonalLook(lead: MembershipLead): Promise<MembershipLead> {
  if (lead.look_status === 'ready' || lead.look_status === 'generating') return lead;
  const startOfDay = new Date(new Date().toISOString().slice(0, 10)).toISOString();
  if (await looksGeneratedSince(startOfDay) >= DAILY_LOOK_CAP) return lead;
  if (!await claimLookGeneration(lead.id)) return (await getLead(lead.id)) ?? lead;

  try {
    const response = await gemini().models.generateContent({
      model: IMAGE_MODEL,
      contents: [{ role: 'user', parts: [{ text: lookPrompt(lead.answers, lead.selfie_season) }] }],
      config: { responseModalities: ['IMAGE'], imageConfig: { imageSize: '1K', aspectRatio: '4:5' }, httpOptions: { timeout: 90_000 } },
    });
    const image = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.data);
    if (!image?.inlineData?.data) throw new Error(`no image (${response.candidates?.[0]?.finishReason ?? 'unknown'})`);
    const webp = await sharp(Buffer.from(image.inlineData.data, 'base64')).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    const lookPath = await putObject(`looks/${lead.id}.webp`, webp, 'image/webp');
    return (await updateLead(lead.id, { look_path: lookPath, look_status: 'ready' })) ?? lead;
  } catch (error) {
    console.error('[style-membership] look generation failed:', error);
    return (await updateLead(lead.id, { look_status: 'failed' })) ?? lead;
  }
}

/** Deletes selfies past their retention date (run by the renewals cron). */
export async function purgeExpiredSelfie(lead: MembershipLead) {
  if (!lead.selfie_path || !lead.selfie_delete_after || new Date(lead.selfie_delete_after).getTime() > Date.now()) return false;
  await deleteObject(lead.selfie_path);
  await updateLead(lead.id, { selfie_path: null });
  return true;
}

// ── Checkout: the first quarter is a normal payment ─────────────────────────

export interface CheckoutInput {
  plan: unknown;
  bumps: unknown;
  leadToken?: unknown;
  /** Sales-page buyers have no lead yet: they give these at checkout. */
  phone?: unknown;
  email?: unknown;
  firstName?: unknown;
  consent?: unknown;
  attribution?: unknown;
  expectedTotalPaise?: unknown;
  eventId?: unknown;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export async function createCheckout(input: CheckoutInput) {
  if (!isMembershipPlanId(input.plan)) throw new MembershipError('Please pick a plan.', 400, 'invalid_plan');
  const bumps = Array.isArray(input.bumps) ? input.bumps.filter((item): item is string => typeof item === 'string') : [];
  const order = priceMembershipOrder(input.plan, bumps);
  if (input.expectedTotalPaise !== undefined && Number(input.expectedTotalPaise) !== order.totalPaise) {
    throw new MembershipError('The price changed. Please refresh and try again.', 409, 'price_changed');
  }

  let lead: MembershipLead;
  let source: Membership['source'] = 'quiz';
  let newLeadToken: string | null = null;
  if (input.leadToken) {
    lead = await leadFromToken(input.leadToken);
  } else {
    // Check the founding price before creating anything, so a refused attempt leaves no lead behind.
    const phone = normalizeIndianWhatsappNumber(typeof input.phone === 'string' ? input.phone : '');
    if (order.plan.pastBuyersOnly && phone && !await isPastBuyer(phone, cleanEmail(input.email))) {
      throw new MembershipError('The founding price is for past ICONIK clients. We couldn’t find an order on this number or email.', 403, 'not_eligible');
    }
    const created = await createLeadFromGate({
      phone: input.phone,
      email: input.email,
      firstName: input.firstName,
      consent: input.consent,
      answers: {},
      attribution: input.attribution,
    });
    lead = (await updateLead(created.lead.id, { source: 'sales_page' })) ?? created.lead;
    source = 'sales_page';
    newLeadToken = created.token;
  }

  if (order.plan.pastBuyersOnly && !await isPastBuyer(lead.phone, lead.email)) {
    throw new MembershipError('The founding price is for past ICONIK clients. We couldn’t find an order on this number or email.', 403, 'not_eligible');
  }

  const memberCode = createMemberCode();
  const attribution = attributionToColumns({ ...lead, attribution_payload: lead.attribution_payload });
  const membership = await insertMembership({
    lead_id: lead.id,
    phone: lead.phone,
    email: lead.email,
    first_name: lead.first_name,
    plan: order.plan.id,
    bumps: order.bumps.map(bump => bump.id),
    amount_paise: order.totalPaise,
    renewal_paise: order.plan.renewalPaise,
    currency: 'INR',
    status: 'pending',
    razorpay_order_id: null,
    razorpay_payment_id: null,
    paid_at: null,
    current_period_end: null,
    autopay_status: order.plan.renewalPaise === null ? 'not_offered' : 'not_set_up',
    razorpay_subscription_id: null,
    member_code_hash: hashToken(memberCode),
    agent_client_id: null,
    claimed_at: null,
    source,
    ...attribution,
  });

  const razorpayOrder = await razorpay().orders.create({
    amount: order.totalPaise,
    currency: 'INR',
    receipt: `sm_${membership.id.slice(0, 8)}_${Date.now()}`,
    notes: {
      product: MEMBERSHIP_NOTES_PRODUCT,
      membership_id: membership.id,
      lead_id: lead.id,
      plan: order.plan.id,
      bumps: order.bumps.map(bump => bump.id).join(','),
      customer_phone: lead.phone,
      customer_email: lead.email ?? '',
      utm_source: attribution.utm_source ?? '',
      utm_campaign: attribution.utm_campaign ?? '',
      utm_content: attribution.utm_content ?? '',
    },
  });
  await updateMembership(membership.id, { razorpay_order_id: razorpayOrder.id });

  const eventId = cleanText(input.eventId, 100);
  if (eventId) {
    void sendMetaServerEvent({
      eventName: 'InitiateCheckout',
      eventId,
      externalId: membership.id,
      customerEmail: lead.email,
      customerPhone: lead.phone,
      customerName: lead.first_name,
      countryCode: 'in',
      phoneCountryCode: '91',
      attribution,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
      customData: membershipCustomData(order.plan.id, order.bumps.map(bump => bump.id), order.totalPaise),
    });
  }

  return {
    key: process.env.RAZORPAY_KEY_ID,
    razorpayOrderId: razorpayOrder.id,
    amountPaise: order.totalPaise,
    membershipId: membership.id,
    memberCode,
    /** Sales-page buyers take the quiz after paying; this lets it save to their lead. */
    leadToken: newLeadToken,
    prefill: { name: lead.first_name ?? '', email: lead.email ?? '', contact: lead.phone },
  };
}

export function membershipCustomData(plan: MembershipPlanId, bumps: string[], totalPaise: number) {
  return {
    currency: 'INR',
    value: totalPaise / 100,
    content_name: MEMBERSHIP_CONTENT_NAME,
    content_ids: membershipContentIds(plan, bumps),
    content_type: 'product',
    num_items: 1 + bumps.length,
    content_category: MEMBERSHIP_FUNNEL_CATEGORY,
  };
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '').update(`${orderId}|${paymentId}`).digest('hex');
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * Turns a paid order into an active membership, once. Called by the browser
 * after Razorpay's handler and by the order.paid webhook; whichever is first
 * queues her 90 days and sends the server Purchase.
 */
export async function activatePaidMembership(input: {
  membershipId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise?: number;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const existing = await findMembership('id', input.membershipId);
  if (!existing || existing.razorpay_order_id !== input.razorpayOrderId) {
    throw new MembershipError('We couldn’t match this payment to a membership. Please contact us on WhatsApp.', 404, 'no_membership');
  }
  if (input.amountPaise !== undefined && input.amountPaise !== existing.amount_paise) {
    console.error('[style-membership] amount mismatch', input.membershipId, input.amountPaise, existing.amount_paise);
  }
  const paidAt = new Date();
  const activated = await activateMembershipOnce(existing.id, {
    razorpay_payment_id: input.razorpayPaymentId,
    paid_at: paidAt.toISOString(),
    current_period_end: new Date(paidAt.getTime() + MEMBERSHIP_PERIOD_DAYS * DAY_MS).toISOString(),
  });
  if (!activated) return { membership: (await findMembership('id', existing.id)) ?? existing, firstActivation: false };

  const lead = activated.lead_id ? await getLead(activated.lead_id) : null;
  const schedule = membershipSchedule(paidAt, {
    plan: activated.plan,
    answers: lead?.answers ?? {},
    hasSelfie: Boolean(lead?.selfie_season),
  });
  await queueMessages(schedule.map(step => ({
    membership_id: activated.id,
    lead_id: activated.lead_id,
    kind: 'schedule' as const,
    step_id: step.stepId,
    due_at: step.dueAt,
    status: 'queued' as const,
    title: step.title,
    brief: step.brief,
    needs_template: step.needsTemplate,
    pay_link_url: null,
    razorpay_payment_link_id: null,
    payload: {},
  })));

  void sendMetaPurchaseEvent({
    eventId: input.razorpayPaymentId,
    externalId: activated.id,
    customerEmail: activated.email,
    customerPhone: activated.phone,
    customerName: activated.first_name,
    countryCode: 'in',
    phoneCountryCode: '91',
    amount: activated.amount_paise / 100,
    currency: 'INR',
    contentName: MEMBERSHIP_CONTENT_NAME,
    contentIds: membershipCustomData(activated.plan, activated.bumps, activated.amount_paise).content_ids,
    numItems: 1 + activated.bumps.length,
    contentCategory: MEMBERSHIP_FUNNEL_CATEGORY,
    attribution: attributionToColumns(activated),
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });
  return { membership: activated, firstActivation: true };
}

export async function membershipForMember(membershipId: unknown, code: unknown): Promise<Membership> {
  if (typeof membershipId !== 'string' || typeof code !== 'string') throw new MembershipError('Missing membership details.', 400, 'missing');
  const membership = await findMembership('id', membershipId);
  if (!membership || membership.member_code_hash !== hashToken(code.toUpperCase())) {
    throw new MembershipError('We couldn’t find that membership.', 404, 'no_membership');
  }
  return membership;
}

// ── Autopay mandate, asked for after the first payment ──────────────────────

export async function createMandate(membership: Membership) {
  if (membership.status !== 'active') throw new MembershipError('Your membership isn’t active yet.', 409, 'not_active');
  if (membership.renewal_paise === null) throw new MembershipError('This plan doesn’t renew.', 409, 'no_renewal');
  if (membership.autopay_status === 'active') throw new MembershipError('Autopay is already set up.', 409, 'already_active');
  const planId = process.env[RAZORPAY_PLAN_ENV]?.trim();
  if (!planId) {
    throw new MembershipError('Autopay isn’t switched on yet. We’ll send a payment link on WhatsApp before your renewal instead.', 503, 'plan_not_configured');
  }
  const startAt = Math.floor(new Date(membership.current_period_end ?? Date.now() + MEMBERSHIP_PERIOD_DAYS * DAY_MS).getTime() / 1000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscription = await (razorpay().subscriptions.create as any)({
    plan_id: planId,
    total_count: MANDATE_TOTAL_COUNT,
    quantity: 1,
    start_at: startAt,
    customer_notify: 1,
    notes: { product: MEMBERSHIP_NOTES_PRODUCT, membership_id: membership.id, customer_phone: membership.phone },
  }) as { id: string; short_url?: string };
  await updateMembership(membership.id, { razorpay_subscription_id: subscription.id, autopay_status: 'pending' });
  return { key: process.env.RAZORPAY_KEY_ID, subscriptionId: subscription.id };
}

export function verifySubscriptionSignature(subscriptionId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET ?? '').update(`${paymentId}|${subscriptionId}`).digest('hex');
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ── Renewal fallback: a payment link, prepared and queued, never sent ───────

export async function prepareRenewalPayLink(membership: Membership, reason: string) {
  if (membership.renewal_paise === null) return null;
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iconik.pro';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const link = await (razorpay().paymentLink.create as any)({
    amount: membership.renewal_paise,
    currency: 'INR',
    accept_partial: false,
    description: 'ICONIK Style Membership: next 3 months',
    customer: { name: membership.first_name ?? undefined, contact: `+${membership.phone}`, email: membership.email ?? undefined },
    // We send the link ourselves on WhatsApp, after a human or the agent is cleared to.
    notify: { sms: false, email: false },
    reminder_enable: false,
    expire_by: Math.floor((Date.now() + 10 * DAY_MS) / 1000),
    reference_id: `smr_${membership.id.slice(0, 8)}_${Date.now()}`,
    callback_url: `${site}/style-membership/welcome?renewed=1`,
    callback_method: 'get',
    notes: { product: MEMBERSHIP_NOTES_PRODUCT, membership_id: membership.id, kind: 'renewal' },
  }) as { id: string; short_url: string };
  await queueMessages([{
    membership_id: membership.id,
    lead_id: membership.lead_id,
    kind: 'renewal_pay_link',
    step_id: 'renewal',
    due_at: new Date().toISOString(),
    status: 'queued',
    title: 'Renewal payment link',
    brief: `Send her the payment link for the next 3 months (${reason}). Say what she gets, the amount, and that she can reply to cancel.`,
    needs_template: true,
    pay_link_url: link.short_url,
    razorpay_payment_link_id: link.id,
    payload: { reason },
  }]);
  return link;
}

/** A renewal was paid (autopay charge or payment link): extend her by one period. */
export async function extendMembership(membership: Membership, paymentId: string) {
  const from = Math.max(Date.now(), new Date(membership.current_period_end ?? Date.now()).getTime());
  return updateMembership(membership.id, {
    status: 'active',
    razorpay_payment_id: paymentId,
    current_period_end: new Date(from + MEMBERSHIP_PERIOD_DAYS * DAY_MS).toISOString(),
  });
}
