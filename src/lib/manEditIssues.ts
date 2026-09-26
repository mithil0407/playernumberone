import 'server-only';

// Monthly ICONIK Man Edit issues.
//
// An Edit issue is a man_reports row (report_kind = 'edit') that points at the
// client's Blueprint. Its six outfits are written into sections.s4_outfits in
// the Blueprint's own block format, so image generation, shopping links,
// per-outfit regenerate/swap/manual-image and the send flow all run unchanged.
//
// Lifecycle: createEditIssueDraft() claims the next issue number (unique per
// subscription, so the webhook, the cron sweep and the admin button can race
// safely) → runEditIssuePipeline() writes the text, then renders the outfit
// images → draft_ready → the stylist reviews and sends from the admin page.
// Nothing reaches the client without that review.

import { readFileSync } from 'fs';
import { join } from 'path';
import { GoogleGenAI } from '@google/genai';
import { supabaseAdmin } from '@/lib/supabase';
import type { ClassificationResult, ReportData } from '@/lib/manReportGenerator';
import type { ManIntakeSubmission } from '@/lib/supabaseMan';
import { getManOutfitPrimaryColourFamily, getManReportClimateProfile, selectManEditBoardSources, type ManOutfitLibraryEntry } from '@/lib/manOutfitLibrary';
import { parseManOutfitsFromSection } from '@/lib/manOutfitSection';
import { validateManReportSection4, type ManReportQaIssue } from '@/lib/manReportQa';
import { generateAllOutfitImages, type ManReportImagePaths } from '@/lib/manImageGenerator';
import { revalidateManReportCache } from '@/lib/manReportCache';
import {
  MAN_EDIT_ISSUE_VERSION,
  MAN_EDIT_OUTFITS_PER_ISSUE,
  type ManEditIssueContent,
} from '@/lib/manEditIssueTypes';

const TEXT_MODEL = process.env.GEMINI_MAN_TEXT_MODEL || process.env.GEMINI_TEXT_MODEL || 'gemini-3-flash-preview';
const STALE_MS = 10 * 60 * 1000;
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! });

let outfitRulebook: string | null = null;
function getOutfitRulebook() {
  outfitRulebook ??= readFileSync(join(process.cwd(), 'src/lib/outfitrecommendationskill.md'), 'utf-8');
  return outfitRulebook;
}

type AnyRecord = Record<string, unknown>;

const OUTFIT_CONTEXTS = ['OFFICE / FORMAL', 'SMART CASUAL', 'EVENING WEAR', 'RELAXED CASUAL'] as const;
type OutfitContext = typeof OUTFIT_CONTEXTS[number];

export interface EditSubscriptionRow {
  id: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string;
  report_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
}

export interface BlueprintRow {
  id: string;
  submission_id: string;
  share_token: string | null;
  status: string;
  sent_at: string | null;
  report_data: ReportData | null;
}

export interface EditIssueRow {
  id: string;
  status: string;
  progress_stage: string | null;
  error_message: string | null;
  share_token: string | null;
  edit_issue_number: number;
  edit_period_start: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EditEntitlement {
  blueprint: BlueprintRow | null;
  paidCharges: number;
  issues: EditIssueRow[];
  owed: number;
  nextIssueNumber: number;
  /** Why no draft can be created right now, or null when one can. */
  blockedReason: string | null;
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

const GENERIC_HANDLE_WORDS = new Set(['signup', 'info', 'contact', 'mail', 'email', 'hello', 'hi', 'me', 'the', 'mr', 'official', 'work', 'admin', 'user', 'its', 'iam', 'real']);

/**
 * A first name only when we're confident of one. Nothing at checkout or intake
 * asks for a name, so subscriptions carry the email handle ("signup.pawan",
 * "ifbnaresh"); greeting a client as "Signup" is worse than no name at all.
 * Trust "first.last" handles only; the stylist can set the name on review.
 */
function confidentFirstName(sub: Pick<EditSubscriptionRow, 'customer_name' | 'customer_email'>): string {
  const handle = sub.customer_email.split('@')[0].toLowerCase();
  const stored = str(sub.customer_name);
  // Checkout stores the handle as the name when none was given; only a name
  // that differs from the handle was actually typed by a person.
  if (stored && stored.toLowerCase() !== handle) {
    const typed = stored.split(/\s+/)[0] ?? '';
    return /^[a-z]{2,}$/i.test(typed) ? titleCaseName(typed) : '';
  }
  const tokens = handle.split(/[._-]+/).filter(Boolean);
  if (tokens.length < 2) return '';
  const candidate = GENERIC_HANDLE_WORDS.has(tokens[0]) ? tokens[1] : tokens[0];
  return /^[a-z]{3,}$/.test(candidate) && !GENERIC_HANDLE_WORDS.has(candidate) ? titleCaseName(candidate) : '';
}

function titleCaseName(value: string) {
  return value[0].toUpperCase() + value.slice(1).toLowerCase();
}

/** Case-insensitive exact match for ilike: emails can contain "_" which ilike treats as a wildcard. */
function exactLike(value: string): string {
  return value.trim().replace(/[\\%_]/g, char => `\\${char}`);
}

const BLUEPRINT_COLUMNS = 'id, submission_id, share_token, status, sent_at, report_data';
const ISSUE_COLUMNS = 'id, status, progress_stage, error_message, share_token, edit_issue_number, edit_period_start, sent_at, created_at, updated_at';

// ── Blueprint linking ────────────────────────────────────────────────────────

/**
 * The subscriber's sent Blueprint. Links it onto the subscription the first
 * time it's found, so every later lookup is a direct id read. Only sent
 * Blueprints count: an Edit built on an unreviewed draft would contradict the
 * report the client eventually receives.
 */
export async function findBlueprintForSubscription(sub: EditSubscriptionRow): Promise<BlueprintRow | null> {
  if (sub.report_id) {
    const { data } = await supabaseAdmin
      .from('man_reports')
      .select(BLUEPRINT_COLUMNS)
      .eq('id', sub.report_id)
      .eq('report_kind', 'blueprint')
      .maybeSingle();
    if (data?.status === 'sent') return data as BlueprintRow;
  }

  const { data: submissions } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('id')
    .ilike('customer_email', exactLike(sub.customer_email));
  const submissionIds = (submissions ?? []).map(row => row.id as string);
  if (!submissionIds.length) return null;

  const { data: reports } = await supabaseAdmin
    .from('man_reports')
    .select(BLUEPRINT_COLUMNS)
    .in('submission_id', submissionIds)
    .eq('report_kind', 'blueprint')
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1);
  const blueprint = (reports?.[0] as BlueprintRow | undefined) ?? null;

  if (blueprint && sub.report_id !== blueprint.id) {
    await supabaseAdmin
      .from('man_edit_subscriptions')
      .update({ report_id: blueprint.id, updated_at: new Date().toISOString() })
      .eq('id', sub.id);
    sub.report_id = blueprint.id;
  }
  return blueprint;
}

/** Called when a Blueprint is first sent: attach it to any Edit subscription for that email. */
export async function linkEditSubscriptionsToBlueprint(customerEmail: string, reportId: string) {
  const { error } = await supabaseAdmin
    .from('man_edit_subscriptions')
    .update({ report_id: reportId, updated_at: new Date().toISOString() })
    .ilike('customer_email', exactLike(customerEmail))
    .is('report_id', null);
  if (error) console.warn('[man-edit] Could not link subscription to Blueprint:', error.message);
}

// ── Entitlement ──────────────────────────────────────────────────────────────

async function countPaidCharges(sub: EditSubscriptionRow): Promise<number> {
  const { count } = await supabaseAdmin
    .from('revenue_events')
    .select('id', { count: 'exact', head: true })
    .eq('source_table', 'man_edit_subscriptions')
    .eq('source_id', sub.id)
    .eq('status', 'paid');
  // An active subscription has been charged at least once even if the revenue
  // ledger missed the event.
  return Math.max(count ?? 0, sub.status === 'active' && sub.razorpay_payment_id ? 1 : 0);
}

export async function listEditIssues(subscriptionId: string): Promise<EditIssueRow[]> {
  const { data } = await supabaseAdmin
    .from('man_reports')
    .select(ISSUE_COLUMNS)
    .eq('report_kind', 'edit')
    .eq('edit_subscription_id', subscriptionId)
    .order('edit_issue_number', { ascending: true });
  return (data ?? []) as EditIssueRow[];
}

/** One issue per successful monthly charge. */
export async function getEditEntitlement(sub: EditSubscriptionRow): Promise<EditEntitlement> {
  const [blueprint, paidCharges, issues] = await Promise.all([
    findBlueprintForSubscription(sub),
    countPaidCharges(sub),
    listEditIssues(sub.id),
  ]);
  const owed = Math.max(0, paidCharges - issues.length);
  const nextIssueNumber = issues.reduce((max, issue) => Math.max(max, issue.edit_issue_number), 0) + 1;

  let blockedReason: string | null = null;
  if (sub.status !== 'active') blockedReason = `Subscription is ${sub.status}`;
  else if (!blueprint) blockedReason = 'No sent Blueprint for this email yet';

  return { blueprint, paidCharges, issues, owed, nextIssueNumber, blockedReason };
}

export async function getEditSubscription(subscriptionId: string): Promise<EditSubscriptionRow | null> {
  const { data } = await supabaseAdmin
    .from('man_edit_subscriptions')
    .select('id, customer_email, customer_name, customer_phone, status, report_id, razorpay_payment_id, created_at')
    .eq('id', subscriptionId)
    .maybeSingle();
  return (data as EditSubscriptionRow | null) ?? null;
}

// ── Draft creation ───────────────────────────────────────────────────────────

export type CreateEditDraftResult =
  | { ok: true; reportId: string; issueNumber: number; created: boolean }
  | { ok: false; reason: string };

/**
 * Claims the next issue for a subscription. `allowAhead` lets the stylist make
 * an issue the client hasn't been charged for yet (a goodwill or catch-up
 * issue); automatic triggers never pass it.
 */
export async function createEditIssueDraft(
  subscriptionId: string,
  opts: { allowAhead?: boolean } = {},
): Promise<CreateEditDraftResult> {
  const sub = await getEditSubscription(subscriptionId);
  if (!sub) return { ok: false, reason: 'Subscription not found' };

  const entitlement = await getEditEntitlement(sub);
  if (entitlement.blockedReason) return { ok: false, reason: entitlement.blockedReason };

  const unfinished = entitlement.issues.find(issue => issue.status !== 'sent');
  if (unfinished) {
    // Finish and send the open issue before starting another, so two drafts
    // never compete for the same month's moments.
    return { ok: true, reportId: unfinished.id, issueNumber: unfinished.edit_issue_number, created: false };
  }
  if (entitlement.owed <= 0 && !opts.allowAhead) {
    return { ok: false, reason: 'Every paid month already has an issue' };
  }

  const blueprint = entitlement.blueprint!;
  const { data: inserted, error } = await supabaseAdmin
    .from('man_reports')
    .insert({
      submission_id: blueprint.submission_id,
      report_kind: 'edit',
      parent_report_id: blueprint.id,
      edit_subscription_id: sub.id,
      edit_issue_number: entitlement.nextIssueNumber,
      edit_period_start: new Date().toISOString().slice(0, 10),
      status: 'generating',
      progress_stage: 'writing_edit',
      section_approvals: { s4: false },
    })
    .select('id')
    .single();

  if (error || !inserted) {
    // Lost a race with another trigger for the same issue number: hand back theirs.
    const { data: existing } = await supabaseAdmin
      .from('man_reports')
      .select('id')
      .eq('report_kind', 'edit')
      .eq('edit_subscription_id', sub.id)
      .eq('edit_issue_number', entitlement.nextIssueNumber)
      .maybeSingle();
    if (existing) return { ok: true, reportId: existing.id as string, issueNumber: entitlement.nextIssueNumber, created: false };
    return { ok: false, reason: error?.message ?? 'Could not create the Edit draft' };
  }

  return { ok: true, reportId: inserted.id as string, issueNumber: entitlement.nextIssueNumber, created: true };
}

// ── The month ────────────────────────────────────────────────────────────────

const INDIA_MONTH_MOMENTS: Record<number, string[]> = {
  1: ['Makar Sankranti, Pongal and Lohri', 'the tail of wedding season', 'winter evenings in the north'],
  2: ['wedding season', "Valentine's dinners", 'the last cool weeks before summer'],
  3: ['Holi', 'financial year-end reviews and client meetings', 'heat returning'],
  4: ['the new financial year', 'Baisakhi, Vishu and regional new years', 'summer heat setting in'],
  5: ['peak summer', 'summer holidays and travel', 'daytime heat, warm evenings'],
  6: ['monsoon arriving in the south and west', 'humid days', 'summer travel ending'],
  7: ['full monsoon', 'rain-day commutes', 'humid office days'],
  8: ['monsoon', 'Independence Day', 'Raksha Bandhan and family visits'],
  9: ['late monsoon', 'Ganesh Chaturthi and Onam', 'humid afternoons'],
  10: ['Navratri and Dussehra', 'the build-up to Diwali', 'post-monsoon heat'],
  11: ['Diwali parties and family gatherings', 'the start of wedding season', 'cooler evenings'],
  12: ['wedding season', 'Christmas and New Year parties', 'winter in the north'],
};

export function describeEditMonth(target: Date, classification: ClassificationResult) {
  const month = target.getUTCMonth() + 1;
  const location = str(classification.client?.location_region).toLowerCase();
  const isIndia = !location || /india|mumbai|delhi|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|ahmedabad|gurgaon|gurugram|noida/.test(location);
  return {
    date: target,
    label: target.toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    moments: isIndia ? INDIA_MONTH_MOMENTS[month] : [],
    climate: getManReportClimateProfile(classification, target),
  };
}

/** The month an issue dresses the client for: the next few weeks from today, never a month an earlier issue already covered. */
function targetMonthFor(previousLabels: string[], now = new Date()): Date {
  const target = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  target.setUTCDate(15);
  for (let guard = 0; guard < 24; guard++) {
    const label = target.toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    if (!previousLabels.includes(label)) break;
    target.setUTCMonth(target.getUTCMonth() + 1);
  }
  return target;
}

// ── Writing the issue ────────────────────────────────────────────────────────

interface EditDraftJson {
  title?: unknown;
  dek?: unknown;
  stylistNote?: unknown;
  monthMoments?: unknown;
  outfits?: unknown;
  pieceOfTheMonth?: unknown;
  closingNote?: unknown;
}

interface DraftOutfit {
  context: OutfitContext;
  occasion: string;
  top: string;
  bottom: string;
  layer: string;
  footwear: string;
  accessories: string;
  occasionAnchor: string;
  reuses: string;
  /** The board look (library id) this outfit was built from, when the writer names one. */
  boardLook: number | null;
}

export interface WriterInput {
  sub: EditSubscriptionRow;
  issueNumber: number;
  blueprint: BlueprintRow;
  submission: ManIntakeSubmission;
  feedback: Array<{ vote: string; outfit_label: string | null; outfit_key: string }>;
  previousIssues: Array<{ label: string; s4: string; piece: string }>;
  month: ReturnType<typeof describeEditMonth>;
  isLate: boolean;
  /** Iconik board looks to build this issue from. */
  boardSources: ManOutfitLibraryEntry[];
}

function formatBoardSources(sources: ManOutfitLibraryEntry[]): string {
  return sources.map(entry => [
    `B${entry.id} — ${entry.context.toUpperCase()}`,
    `  TOP: ${entry.top}`,
    `  LAYER: ${entry.layer}`,
    `  BOTTOM: ${entry.bottom}`,
    `  FOOTWEAR: ${entry.footwear}`,
    `  ACCESSORIES: ${entry.accessories}`,
    entry.styling ? `  STYLING: ${entry.styling}` : null,
  ].filter(Boolean).join('\n')).join('\n\n');
}

function clip(text: unknown, max: number): string {
  const value = str(text);
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function summariseIntake(submission: ManIntakeSubmission): string {
  const s = submission as unknown as AnyRecord;
  return [
    ['Primary goal', s.primary_goal ?? s.primary_style_goal],
    ['Where he dresses for', s.dressing_context],
    ['Location', s.location_tier],
    ['Wardrobe today', s.wardrobe_composition],
    ['Fit preference', s.fit_preference],
    ['Style tribes', s.style_tribes],
    ['What holds him back', s.style_blocker],
    ['Will not wear', s.style_anti_pref ?? s.style_anti_pref_note],
    ['His own note', s.free_text_note],
  ]
    .map(([label, value]) => [label, Array.isArray(value) ? value.join(', ') : str(value)] as const)
    .filter(([, value]) => value)
    .map(([label, value]) => `- ${label}: ${value}`)
    .join('\n');
}

function buildWriterPrompt(input: WriterInput, repair?: { previous: string; issues: string[] }): string {
  const data = input.blueprint.report_data!;
  const sections = data.sections;
  const classification = data.classification;
  const likes = input.feedback.filter(item => item.vote === 'like').map(item => item.outfit_label || item.outfit_key);
  const dislikes = input.feedback.filter(item => item.vote === 'dislike').map(item => item.outfit_label || item.outfit_key);

  const previous = input.previousIssues.length
    ? input.previousIssues.map(issue => `### ${issue.label} (piece of the month: ${issue.piece || 'none'})\n${issue.s4}`).join('\n\n')
    : 'None — this is his first Edit.';

  const repairBlock = repair ? `

YOUR PREVIOUS DRAFT FAILED THESE CHECKS. Return the full JSON again with every listed problem fixed and everything else kept:
${repair.issues.map(item => `- ${item}`).join('\n')}

Previous draft:
${repair.previous}` : '';

  return `ICONIK OUTFIT RULEBOOK — follow its garment reality, colour, fit, fabric and climate rules exactly. IGNORE its instructions about outfit counts, section structure, headings and output format: you are not writing a Blueprint section.

${getOutfitRulebook()}

---

You are ICONIK's senior men's stylist writing Issue ${input.issueNumber} of "The Iconik Edit" for ${confidentFirstName(input.sub) || 'a client'}, a paying monthly subscriber. He already has his Blueprint: the analysis below is what we have told him about his body, face, colouring and style. The Edit must be consistent with it — it is the next chapter of the same advice, applied to the coming month, never a contradiction of it.

THE MONTH: ${input.month.label}
What is happening: ${input.month.moments.length ? input.month.moments.join('; ') : 'use the season and his own calendar'}
Climate: ${input.month.climate.label}. ${input.month.climate.promptGuidance}
Do not state specific festival dates.

HIS BLUEPRINT CLASSIFICATION (source of truth — do not re-derive):
${JSON.stringify({
    body: classification.body,
    face: { face_shape: classification.face?.face_shape },
    colour: classification.colour,
    style_brief: classification.style_brief,
    client: classification.client,
  }, null, 2)}

WHAT HIS BLUEPRINT TOLD HIM
Fit rules: ${clip(sections.s2_body, 3500)}

Colour map: ${clip(sections.s3_colour, 3500)}

Shopping rules: ${clip(sections.s5_shopping ?? sections.s5_rules, 2500)}

Style identity: ${clip(sections.s6_identity, 1200)}

HIS 20 BLUEPRINT OUTFITS (he has these formulas; many of these pieces are already in his wardrobe):
${sections.s4_outfits}

WHAT HE TOLD US AT INTAKE
${summariseIntake(input.submission) || '- (no extra intake detail)'}

HIS REACTIONS SO FAR
Liked: ${likes.length ? likes.join('; ') : 'nothing recorded yet'}
Disliked: ${dislikes.length ? dislikes.join('; ') : 'nothing recorded yet'}

PREVIOUS EDIT ISSUES (never repeat an outfit or a piece of the month from these):
${previous}

${input.boardSources.length ? `SOURCE LOOKS FROM THE ICONIK BOARD
Real looks our stylists curated. Build this issue from them.
${formatBoardSources(input.boardSources)}

` : ''}WRITE THIS ISSUE
- Exactly ${MAN_EDIT_OUTFITS_PER_ISSUE} outfits.${input.boardSources.length ? `
- Build every outfit from a different board look above and put its number in "boardLook" (e.g. "B218"). Keep that look's garments, layer or no-layer decision, silhouette and styling (tuck, sleeves, collar) recognisable. Change colours only to fit his palette and fabrics only for the climate; never swap in a different garment type.` : ''}
- Two for this month's moments (festive, family, weddings or travel — whatever the month really holds for him), two for his working week (match his real dressing context: office, client-facing, startup or work-from-home), two for his weekends.
- Each outfit's context must be one of: ${OUTFIT_CONTEXTS.join(', ')}. Festive and wedding looks are usually EVENING WEAR or SMART CASUAL; Indian wear (kurta sets, bandhgalas, Nehru jackets) is welcome where the moment calls for it and his Blueprint allows it.
- No outfit may repeat one of his 20 Blueprint outfits or an outfit from a previous issue. Where a look allows it, re-wear pieces his Blueprint already told him to own, and say which in "reuses".
- One piece of the month: a single item worth buying now that unlocks at least two of these outfits.
- Stay inside his palette, fit rules and dislikes. Everything must be a real garment he can buy in India this month.
- Garment lines follow the Blueprint style: "[colour] [fabric] [garment] — [fit] — [styling]". Accessories include his eyewear direction where his Blueprint gives one.
- HARD RULES — an automatic checker rejects any look that breaks one:
  • No satin, silk (including silk blends), shiny or high-gloss fabric anywhere.
  • No band or mandarin collars on shirts or jackets. A kurta is fine — don't describe its collar.
  • Per look, at most ONE of suede / leather / corduroy / flannel across top, layer and bottom (footwear doesn't count). A flannel or corduroy suit counts twice, so don't use one.
  • No skinny, cropped or ankle-length trousers. Sneakers are white or black leather only — never brown, tan, coloured or logo-heavy.
  • No multi-colour, colour-blocked or contrast-trim garments, and no invented details (asymmetric, draped, architectural, gathered, cut-out, hybrid garments). One colour per garment.
  • OFFICE / FORMAL looks contain no tee, polo, denim, jeans, sneakers, overshirt, henley, camp collar, cargo or drawstring.
  • RELAXED CASUAL looks contain no blazer.
  • Obey the climate line above for fabrics.
  • Consecutive looks must differ in top colour family and in layer colour family.
- Voice: a stylist who knows him — direct, warm, specific, no hype. British spelling. ${confidentFirstName(input.sub) ? `Address him as ${confidentFirstName(input.sub)} once in the note.` : 'We do not know his name: never address him by name or by his email handle.'}${input.isLate ? `
- This first issue is reaching him later than it should have. Open the stylist note with one plain, unfussy sentence of apology, then move on to the month.` : ''}

Return ONLY valid JSON, no markdown:
{
  "title": "4-7 word issue title about the month",
  "dek": "one sentence under the title",
  "stylistNote": "two short paragraphs separated by a blank line: what this month asks of him and how this issue answers it, tied to his Blueprint",
  "monthMoments": ["2-4 short chips, e.g. Navratri"],
  "outfits": [
    {
      "context": "one of the four contexts",
      "occasion": "the specific moment, 2-6 words, e.g. Diwali dinner at home",
      "top": "...",
      "bottom": "...",
      "layer": "... or No layer",
      "footwear": "...",
      "accessories": "...",
      "occasionAnchor": "one or two sentences: why this works on him and when to wear it",
      "reuses": "which Blueprint pieces this re-wears, or empty string",
      "boardLook": "the board look number it is built from, e.g. B218"
    }
  ],
  "pieceOfTheMonth": { "name": "garment line in the same style", "why": "two sentences", "outfitNumbers": [1, 4] },
  "closingNote": "two sentences: what to notice this month, and to tap like or dislike on each outfit so next month's Edit learns from it"
}${repairBlock}`;
}

function parseDraft(raw: string): { draft: EditDraftJson; outfits: DraftOutfit[] } {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const json = cleaned.match(/\{[\s\S]*\}/)?.[0] ?? cleaned;
  const draft = JSON.parse(json) as EditDraftJson;
  const outfits = (Array.isArray(draft.outfits) ? draft.outfits : []).map(value => {
    const o = asRecord(value);
    const context = str(o.context).toUpperCase();
    return {
      context: (OUTFIT_CONTEXTS as readonly string[]).includes(context) ? context as OutfitContext : 'SMART CASUAL',
      occasion: str(o.occasion),
      top: str(o.top),
      bottom: str(o.bottom),
      layer: str(o.layer) || 'No layer',
      footwear: str(o.footwear),
      accessories: str(o.accessories),
      occasionAnchor: str(o.occasionAnchor),
      reuses: str(o.reuses),
      boardLook: Number(str(o.boardLook).replace(/\D/g, '')) || null,
    };
  });
  return { draft, outfits };
}

/**
 * The checker rejects neighbouring looks that share a top or layer colour
 * family. Order carries no meaning in an Edit, so find an order that has no
 * such neighbours (6! = 720 orders, trivial) instead of paying for a rewrite.
 * Returns the new order as indexes into `outfits`, or the original order.
 */
function orderWithoutColourClashes(outfits: DraftOutfit[]): number[] {
  const hasLayer = (o: DraftOutfit) => !/^\s*(none|no layer|n\/a)\s*$/i.test(o.layer);
  const families = outfits.map(o => ({
    top: getManOutfitPrimaryColourFamily(o.top),
    layer: hasLayer(o) ? getManOutfitPrimaryColourFamily(o.layer) : null,
  }));
  const clashes = (a: number, b: number) =>
    Boolean(families[a].top && families[a].top === families[b].top)
    || Boolean(families[a].layer && families[a].layer === families[b].layer);

  const order: number[] = [];
  const used = new Set<number>();
  const search = (): boolean => {
    if (order.length === outfits.length) return true;
    for (let i = 0; i < outfits.length; i++) {
      if (used.has(i)) continue;
      const previous = order[order.length - 1];
      if (previous !== undefined && clashes(previous, i)) continue;
      order.push(i); used.add(i);
      if (search()) return true;
      order.pop(); used.delete(i);
    }
    return false;
  };
  return search() ? order : outfits.map((_, i) => i);
}

function buildSection4(issueNumber: number, outfits: DraftOutfit[]): string {
  const blocks = outfits.map((outfit, index) => [
    `OUTFIT ${index + 1} — ${outfit.context}`,
    `TOP: ${outfit.top}`,
    `BOTTOM: ${outfit.bottom}`,
    `LAYER: ${outfit.layer}`,
    `FOOTWEAR: ${outfit.footwear}`,
    `ACCESSORIES: ${outfit.accessories}`,
    `OCCASION ANCHOR: ${outfit.occasionAnchor}`,
  ].join('\n'));
  return `## THE ICONIK EDIT — ISSUE ${issueNumber}\n\n${blocks.join('\n\n')}\n`;
}

function structuralProblems(outfits: DraftOutfit[], draft: EditDraftJson): string[] {
  const problems: string[] = [];
  if (outfits.length !== MAN_EDIT_OUTFITS_PER_ISSUE) problems.push(`Return exactly ${MAN_EDIT_OUTFITS_PER_ISSUE} outfits (got ${outfits.length}).`);
  outfits.forEach((outfit, index) => {
    for (const field of ['occasion', 'top', 'bottom', 'footwear', 'accessories', 'occasionAnchor'] as const) {
      if (!outfit[field]) problems.push(`Outfit ${index + 1} is missing "${field}".`);
    }
  });
  if (!str(draft.title)) problems.push('Missing title.');
  if (!str(draft.stylistNote)) problems.push('Missing stylistNote.');
  if (!str(asRecord(draft.pieceOfTheMonth).name)) problems.push('Missing pieceOfTheMonth.name.');
  return problems;
}

async function callWriter(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: 'application/json' },
  });
  return response.text ?? '';
}

export async function writeEditIssue(input: WriterInput): Promise<{ s4: string; content: Omit<ManEditIssueContent, 'blueprintShareToken' | 'periodStart'>; qaIssues: ManReportQaIssue[] }> {
  const classification = input.blueprint.report_data!.classification;
  let repair: { previous: string; issues: string[] } | undefined;
  let lastError = '';

  for (let attempt = 0; attempt < 3; attempt++) {
    let raw = '';
    try {
      raw = await callWriter(buildWriterPrompt(input, repair));
      const parsed = parseDraft(raw);
      const draft = parsed.draft;
      const order = orderWithoutColourClashes(parsed.outfits);
      const outfits = order.map(i => parsed.outfits[i]);
      const renumber = (oldNumber: number) => order.indexOf(oldNumber - 1) + 1;
      const problems = structuralProblems(outfits, draft);
      const s4 = buildSection4(input.issueNumber, outfits);
      const qa = validateManReportSection4(s4, classification, { portfolio: 'edit', climateDate: input.month.date });
      const blocking = qa.issues.filter(item => item.severity === 'error');
      const allProblems = [...problems, ...blocking.map(item => item.message)];

      // Structural problems always get another pass; garment-rule problems get
      // repairs while attempts remain, then go to the stylist as advisory QA.
      if (problems.length === 0 && (blocking.length === 0 || attempt === 2)) {
        const piece = asRecord(draft.pieceOfTheMonth);
        return {
          s4,
          qaIssues: qa.issues,
          content: {
            issueNumber: input.issueNumber,
            periodLabel: input.month.label,
            clientFirstName: confidentFirstName(input.sub),
            title: str(draft.title),
            dek: str(draft.dek),
            stylistNote: str(draft.stylistNote),
            monthMoments: (Array.isArray(draft.monthMoments) ? draft.monthMoments : []).map(str).filter(Boolean).slice(0, 4),
            outfits: outfits.map((outfit, index) => ({ number: index + 1, occasion: outfit.occasion, reuses: outfit.reuses })),
            pieceOfTheMonth: {
              name: str(piece.name),
              why: str(piece.why),
              outfitNumbers: (Array.isArray(piece.outfitNumbers) ? piece.outfitNumbers : [])
                .map(Number)
                .filter(n => Number.isInteger(n) && n >= 1 && n <= outfits.length)
                .map(renumber)
                .sort((a, b) => a - b),
            },
            closingNote: str(draft.closingNote),
            boardSourceIds: outfits.map(outfit => outfit.boardLook).filter((id): id is number => id !== null && input.boardSources.some(entry => entry.id === id)),
          },
        };
      }
      repair = { previous: raw, issues: allProblems };
      lastError = allProblems.join(' ');
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      repair = raw ? { previous: raw, issues: [`The response was not valid JSON in the required shape: ${lastError}`] } : undefined;
    }
  }
  throw new Error(`Edit writer failed after 3 attempts: ${lastError.slice(0, 400)}`);
}

// ── Pipeline ─────────────────────────────────────────────────────────────────

async function setStage(reportId: string, shareToken: string | null, patch: AnyRecord) {
  await supabaseAdmin
    .from('man_reports')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', reportId);
  await revalidateManReportCache(reportId, shareToken);
}

async function loadWriterInput(issue: AnyRecord, sub: EditSubscriptionRow): Promise<WriterInput> {
  const { data: blueprint } = await supabaseAdmin
    .from('man_reports')
    .select(BLUEPRINT_COLUMNS)
    .eq('id', issue.parent_report_id as string)
    .single();
  if (!blueprint?.report_data) throw new Error('Blueprint has no report data');

  const { data: submission } = await supabaseAdmin
    .from('man_intake_submissions')
    .select('*')
    .eq('id', blueprint.submission_id)
    .single();
  if (!submission) throw new Error('Intake submission not found');

  const { data: siblings } = await supabaseAdmin
    .from('man_reports')
    .select('id, report_data, edit_issue_number')
    .eq('report_kind', 'edit')
    .eq('edit_subscription_id', sub.id)
    .lt('edit_issue_number', issue.edit_issue_number as number)
    .order('edit_issue_number', { ascending: true });

  const reportIds = [blueprint.id, ...(siblings ?? []).map(row => row.id as string)];
  const { data: feedback } = await supabaseAdmin
    .from('man_report_outfit_feedback')
    .select('vote, outfit_label, outfit_key')
    .in('report_id', reportIds);

  const previousEditData = (siblings ?? [])
    .map(row => row.report_data as ReportData | null)
    .filter((data): data is ReportData => Boolean(data?.edit));
  const previousIssues = previousEditData
    .map(data => ({
      label: data.edit!.periodLabel,
      s4: data.sections.s4_outfits,
      piece: data.edit!.pieceOfTheMonth?.name ?? '',
    }));

  const classification = (blueprint.report_data as ReportData).classification;
  const month = describeEditMonth(targetMonthFor(previousIssues.map(item => item.label)), classification);

  // Board looks his Blueprint or an earlier issue already used are not offered again.
  const usedLookIds = [
    ...((blueprint.report_data as ReportData).outfit_library?.assignments ?? []).map(item => item.libraryLookId),
    ...previousEditData.flatMap(data => data.edit?.boardSourceIds ?? []),
  ];
  const boardSources = selectManEditBoardSources(classification, { now: month.date, exclude: usedLookIds, salt: sub.id });

  // "Late" = the client paid for this issue more than a fortnight ago.
  const subscribedAt = new Date(sub.created_at).getTime();
  const isLate = issue.edit_issue_number === 1 && Date.now() - subscribedAt > 14 * 24 * 60 * 60 * 1000;

  return {
    sub,
    issueNumber: issue.edit_issue_number as number,
    blueprint: blueprint as BlueprintRow,
    submission: submission as ManIntakeSubmission,
    feedback: (feedback ?? []) as WriterInput['feedback'],
    previousIssues,
    month,
    isLate,
    boardSources,
  };
}

/**
 * Resumable: writes the text if it's missing, then renders any missing outfit
 * images. Safe to call again on a stalled or partly-rendered draft.
 */
export async function runEditIssuePipeline(reportId: string): Promise<void> {
  const { data: issue } = await supabaseAdmin
    .from('man_reports')
    .select('id, status, progress_stage, updated_at, share_token, report_data, image_urls, parent_report_id, edit_subscription_id, edit_issue_number, submission_id')
    .eq('id', reportId)
    .eq('report_kind', 'edit')
    .maybeSingle();
  if (!issue || issue.status === 'sent') return;

  const shareToken = (issue.share_token as string | null) ?? null;
  const sub = await getEditSubscription(issue.edit_subscription_id as string);
  if (!sub) {
    await setStage(reportId, shareToken, { status: 'error', progress_stage: null, error_message: 'Subscription not found' });
    return;
  }

  let reportData = issue.report_data as ReportData | null;
  try {

    if (!reportData?.edit || !reportData.sections?.s4_outfits) {
      await setStage(reportId, shareToken, { status: 'generating', progress_stage: 'writing_edit', error_message: null });
      const input = await loadWriterInput(issue, sub);
      const written = await writeEditIssue(input);
      const parent = input.blueprint.report_data!;
      const contexts = parseManOutfitsFromSection(written.s4).map(outfit => outfit.context);

      reportData = {
        report_version: MAN_EDIT_ISSUE_VERSION,
        classification: {
          ...parent.classification,
          outfit_split: {
            total: MAN_EDIT_OUTFITS_PER_ISSUE,
            categories: [...new Set(contexts)].map(category => ({
              category,
              count: contexts.filter(context => context === category).length,
              rationale: 'Chosen for this month',
            })),
          },
        },
        sections: {
          s1_face: '',
          s2_body: '',
          s3_colour: '',
          s4_outfits: written.s4,
          s6_identity: parent.sections.s6_identity ?? '',
        },
        generated_at: new Date().toISOString(),
        qa: {
          section4: validateManReportSection4(written.s4, parent.classification, { portfolio: 'edit', climateDate: input.month.date }),
        },
        edit: {
          ...written.content,
          periodStart: input.month.date.toISOString().slice(0, 10),
          blueprintShareToken: input.blueprint.share_token,
        },
      };

      await setStage(reportId, shareToken, {
        report_data: reportData,
        generated_at: new Date().toISOString(),
        progress_stage: 'generating_images',
      });
    }

    const { data: submission } = await supabaseAdmin
      .from('man_intake_submissions')
      .select('photo_fullbody_url, photo_headshot_url')
      .eq('id', issue.submission_id as string)
      .single();
    if (!submission?.photo_fullbody_url) throw new Error('The client has no full-body photo on file');

    await setStage(reportId, shareToken, { status: 'generating', progress_stage: 'generating_images', error_message: null });

    const { data: latest } = await supabaseAdmin.from('man_reports').select('image_urls').eq('id', reportId).single();
    const existing = (latest?.image_urls as ManReportImagePaths | null)?.outfitCards ?? [];
    const paths = await generateAllOutfitImages(
      reportId,
      submission.photo_fullbody_url,
      reportData.classification,
      reportData.sections,
      submission.photo_headshot_url,
      [],
      undefined,
      existing,
      Date.now() + 240_000,
    );

    const outfitCount = parseManOutfitsFromSection(reportData.sections.s4_outfits).length;
    const missing = Array.from({ length: outfitCount }, (_, i) => i + 1).filter(n => !paths[n - 1]);
    await setStage(reportId, shareToken, {
      status: 'draft_ready',
      progress_stage: null,
      error_message: missing.length ? `Outfit photos still missing: ${missing.join(', ')}. Use "Render missing photos".` : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[man-edit] Pipeline failed for ${reportId}:`, message);
    const hasText = Boolean(reportData?.edit);
    await setStage(reportId, shareToken, {
      status: hasText ? 'draft_ready' : 'error',
      progress_stage: null,
      error_message: message.slice(0, 500),
    });
  }
}

/** True when a draft's pipeline has died mid-run and can be restarted. */
export function isEditPipelineStalled(issue: Pick<EditIssueRow, 'status' | 'progress_stage' | 'updated_at'>): boolean {
  if (!issue.progress_stage && issue.status !== 'generating') return false;
  const age = issue.updated_at ? Date.now() - new Date(issue.updated_at).getTime() : Infinity;
  return age > STALE_MS;
}
