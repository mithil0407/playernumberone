import 'server-only';

// Occasion looks, end to end. Every Man client with a delivered Blueprint is
// told a look is ready for him (email first, then a WhatsApp nudge for those who
// haven't replied). Nothing is designed or drawn until he asks to see it: then
// revealOccasionLook designs the look from his report, draws him in it and sends
// it with "Love it" / "Show me another". From there the agent follows through
// (occasionLookSection in its prompt).

import { normalizeIndianWhatsappNumber } from '@/lib/indiaPhone';
import { supabaseAdmin } from '@/lib/supabase';
import { manPassportProfile, nameFromCustomers, resolveAgentClientByPhone, type AgentClient } from '@/lib/agentClients';
import { generateAgentJson, withAgentUsage } from '@/lib/agentLlm';
import { recordOutboundMessage } from '@/lib/agentStore';
import { isWithinCustomerServiceWindow } from '@/lib/agentWhatsapp';
import { isDaytimeInIndia } from '@/lib/agentGrowth';
import {
  agentServesBlueprintClients,
  cleanHook,
  isLookActive,
  lookResponseFromText,
  occasionCampaign,
  parseLookButtonPayload,
  renderInviteEmail,
  renderInviteMessage,
  renderRevealMessage,
  whatsappLink,
  LOOK_BUTTONS,
  type ActiveLookForPrompt,
  type OccasionCampaign,
} from '@/lib/agentOccasionLooks';
import {
  getWhatsAppBusinessNumber,
  sendWhatsAppLookButtons,
  sendWhatsAppLookInvite,
  sendWhatsAppTextMessage,
} from '@/lib/whatsapp';
import { sendOccasionLookEmail } from '@/lib/emailMen';
import { loadOccasionLibrary, occasionOutfitText, shortlistOccasionOutfits } from '@/lib/agentOccasionLibrary';

export interface OccasionLookRow {
  id: string;
  campaign: string;
  report_id: string;
  share_token: string;
  phone: string | null;
  email: string | null;
  first_name: string | null;
  agent_client_id: string | null;
  /** approved: ready to invite · sent: invited · rejected: skipped. */
  status: 'pending' | 'generating' | 'ready' | 'approved' | 'sent' | 'rejected' | 'failed';
  outfit: string | null;
  hook: string | null;
  /** Set once he asked to see it and it was drawn. */
  image_path: string | null;
  image_url: string | null;
  error: string | null;
  attempts: number;
  /** While his picture is being drawn (claims the reveal). */
  generating_since: string | null;
  whatsapp_channel: 'template' | 'in_window' | null;
  whatsapp_message_id: string | null;
  whatsapp_error: string | null;
  whatsapp_sent_at: string | null;
  email_sent_at: string | null;
  email_error: string | null;
  responded_at: string | null;
  response: string | null;
  created_at: string;
  updated_at: string;
}

type AnyRecord = Record<string, unknown>;

/** A reveal stuck this long was dropped by a timed-out request; he can ask again. */
const STALE_REVEAL_MS = 4 * 60_000;
const SEND_BATCH_LIMIT = 40;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function nowIso() {
  return new Date().toISOString();
}

async function updateLook(id: string, fields: Partial<OccasionLookRow>) {
  const { error } = await supabaseAdmin
    .from('agent_occasion_looks')
    .update({ ...fields, updated_at: nowIso() })
    .eq('id', id);
  if (error) throw new Error(`Could not update the look: ${error.message}`);
}

function requireCampaign(key: string) {
  const campaign = occasionCampaign(key);
  if (!campaign) throw new Error(`Unknown campaign ${key}`);
  return campaign;
}

/** When we first told him about it, by either channel. */
function invitedAt(look: Pick<OccasionLookRow, 'email_sent_at' | 'whatsapp_sent_at'>) {
  const times = [look.email_sent_at, look.whatsapp_sent_at].filter((value): value is string => Boolean(value)).sort();
  return times[0] ?? null;
}

// ─── Who gets one ────────────────────────────────────────────────────────────

async function firstNameFor(phone: string | null, email: string | null) {
  if (phone) {
    const { data } = await supabaseAdmin.from('agent_clients').select('first_name').eq('phone', phone).maybeSingle();
    if (data?.first_name) return data.first_name as string;
  }
  return nameFromCustomers(email);
}

/**
 * Lists every Man client with a delivered Blueprint (one per phone number, his
 * latest report), ready to invite. Free: nothing is designed or drawn yet.
 * Safe to run again: people already listed are skipped.
 */
export async function prepareOccasionLooks(campaignKey: string) {
  requireCampaign(campaignKey);
  const { data, error } = await supabaseAdmin
    .from('man_reports')
    .select('id, share_token, created_at, man_intake_submissions(customer_email, customer_phone, photo_headshot_url, photo_fullbody_url)')
    .eq('status', 'sent')
    .eq('report_kind', 'blueprint')
    .not('share_token', 'is', null)
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) throw new Error(`Could not load delivered Blueprints: ${error.message}`);

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('agent_occasion_looks')
    .select('report_id, phone, email')
    .eq('campaign', campaignKey);
  if (existingError) throw new Error(`Could not load the list: ${existingError.message}`);
  const listedReports = new Set((existing ?? []).map(row => row.report_id as string));
  const seenPhones = new Set((existing ?? []).map(row => row.phone as string | null).filter(Boolean));
  const seenEmails = new Set((existing ?? []).map(row => (row.email as string | null)?.toLowerCase()).filter(Boolean));

  const { data: stopped } = await supabaseAdmin
    .from('agent_clients')
    .select('phone')
    .neq('status', 'active');
  const stoppedPhones = new Set((stopped ?? []).map(row => row.phone as string));

  const rows: AnyRecord[] = [];
  let skipped = 0;
  for (const report of (data ?? []) as AnyRecord[]) {
    const rawSubmission = report.man_intake_submissions;
    const submission = asRecord(Array.isArray(rawSubmission) ? rawSubmission[0] : rawSubmission);
    const phone = normalizeIndianWhatsappNumber(String(submission.customer_phone ?? '')) || null;
    const email = typeof submission.customer_email === 'string' ? submission.customer_email.trim().toLowerCase() || null : null;
    // His picture needs both intake photos.
    const hasPhotos = Boolean(submission.photo_headshot_url && submission.photo_fullbody_url);
    if (listedReports.has(report.id as string)) continue;
    // Newest report first, so a man with two Blueprints gets his latest.
    if ((phone && seenPhones.has(phone)) || (!phone && email && seenEmails.has(email))) continue;
    if (!hasPhotos || (!phone && !email) || (phone && stoppedPhones.has(phone))) {
      skipped += 1;
      continue;
    }
    if (phone) seenPhones.add(phone);
    if (email) seenEmails.add(email);
    rows.push({ campaign: campaignKey, report_id: report.id, share_token: report.share_token, phone, email, status: 'approved' });
  }

  for (let start = 0; start < rows.length; start += 200) {
    const batch = rows.slice(start, start + 200);
    const names = await Promise.all(batch.map(row => firstNameFor(row.phone as string | null, row.email as string | null).catch(() => null)));
    const { error: insertError } = await supabaseAdmin
      .from('agent_occasion_looks')
      .upsert(batch.map((row, index) => ({ ...row, first_name: names[index] })), { onConflict: 'campaign,report_id', ignoreDuplicates: true });
    if (insertError) throw new Error(`Could not list clients: ${insertError.message}`);
  }
  return { listed: rows.length, skipped };
}

export async function listOccasionLooks(campaignKey: string) {
  const { data, error } = await supabaseAdmin
    .from('agent_occasion_looks')
    .select('*')
    .eq('campaign', campaignKey)
    .order('created_at', { ascending: true })
    .limit(2000);
  if (error) throw new Error(`Could not load the list: ${error.message}`);
  return (data ?? []) as OccasionLookRow[];
}

/** Leave someone out of the campaign, or bring him back. */
export async function setOccasionLookSkipped(id: string, skipped: boolean) {
  const { data, error } = await supabaseAdmin.from('agent_occasion_looks').select('status').eq('id', id).maybeSingle();
  if (error || !data) throw new Error('Not found');
  if (data.status === 'sent') throw new Error('He has already been invited');
  await updateLook(id, { status: skipped ? 'rejected' : 'approved' });
}

// ─── Inviting ────────────────────────────────────────────────────────────────

export interface SendPlanItem {
  id: string;
  name: string | null;
  whatsapp: 'in_window' | 'template' | 'none';
  email: boolean;
}

export interface SendSummary {
  dryRun: boolean;
  plan: SendPlanItem[];
  whatsappSent: number;
  emailsSent: number;
  failed: Array<{ id: string; error: string }>;
  remaining: number;
}

async function existingAgentClient(phone: string) {
  const { data } = await supabaseAdmin.from('agent_clients').select('*').eq('phone', phone).maybeSingle();
  return (data as AgentClient | null) ?? null;
}

/**
 * Invites a batch. Email first: everyone not yet invited. WhatsApp follow-up:
 * everyone not yet on WhatsApp who hasn't replied. A dry run reports who would
 * get what without sending anything.
 */
export async function sendOccasionInvites(campaignKey: string, options: {
  dryRun: boolean;
  limit?: number;
  channels?: { whatsapp: boolean; email: boolean };
  ignoreDaytime?: boolean;
}): Promise<SendSummary> {
  const campaign = requireCampaign(campaignKey);
  const channels = options.channels ?? { whatsapp: false, email: true };
  if (!options.dryRun && !options.ignoreDaytime && !isDaytimeInIndia()) {
    throw new Error('Invites go out between 9am and 9pm IST, so they arrive while people are awake.');
  }
  // Both channels lead to WhatsApp, so the agent must be answering.
  if (!options.dryRun && !agentServesBlueprintClients()) {
    throw new Error('The agent is not answering Blueprint clients yet: set ICONIK_AGENT_ENABLED=1 and ICONIK_AGENT_ALLOWED_PHONES=* (or turn on the free tier), so replies reach it.');
  }
  const limit = Math.min(SEND_BATCH_LIMIT, Math.max(1, options.limit ?? SEND_BATCH_LIMIT));
  const whatsappFollowUp = channels.whatsapp && !channels.email;
  const query = supabaseAdmin
    .from('agent_occasion_looks')
    .select('*', { count: 'exact' })
    .eq('campaign', campaignKey);
  // The follow-up also reaches men who got the email but haven't replied;
  // anyone who already wrote to us is left alone.
  const { data, error, count } = await (whatsappFollowUp
    ? query
      .not('phone', 'is', null)
      .or('status.eq.approved,and(status.eq.sent,whatsapp_sent_at.is.null,responded_at.is.null)')
    : query.eq('status', 'approved'))
    .order('created_at', { ascending: true })
    .limit(options.dryRun ? 2000 : limit);
  if (error) throw new Error(`Could not load the list: ${error.message}`);
  const looks = (data ?? []) as OccasionLookRow[];

  const businessNumber = channels.email ? await getWhatsAppBusinessNumber() : null;
  if (channels.email && !businessNumber && !options.dryRun) {
    throw new Error('The email button needs the ICONIK WhatsApp number: set WHATSAPP_BUSINESS_NUMBER.');
  }
  const summary: SendSummary = { dryRun: options.dryRun, plan: [], whatsappSent: 0, emailsSent: 0, failed: [], remaining: 0 };

  for (const look of looks) {
    let client: AgentClient | null = null;
    if (look.phone && channels.whatsapp) {
      // A dry run only looks; a real send enrols him so the invite is in his thread.
      client = options.dryRun
        ? await existingAgentClient(look.phone)
        : await resolveAgentClientByPhone(look.phone).catch(() => null);
    }
    const inWindow = Boolean(client && isWithinCustomerServiceWindow(client.last_inbound_at));
    const whatsapp: SendPlanItem['whatsapp'] = !channels.whatsapp || !look.phone || (client && client.status !== 'active')
      ? 'none'
      : inWindow ? 'in_window' : 'template';
    const email = channels.email && Boolean(look.email);
    summary.plan.push({ id: look.id, name: look.first_name, whatsapp, email });
    if (options.dryRun) continue;

    const fields: Partial<OccasionLookRow> = { agent_client_id: client?.id ?? look.agent_client_id };

    if (whatsapp !== 'none' && look.phone) {
      const sent = await sendWhatsAppLookInvite({ to: look.phone, campaign, lookId: look.id, firstName: look.first_name, inWindow });
      if (sent.success) {
        summary.whatsappSent += 1;
        Object.assign(fields, { whatsapp_channel: whatsapp, whatsapp_message_id: sent.messageId ?? null, whatsapp_sent_at: nowIso(), whatsapp_error: null });
        if (client) {
          // In his thread, so the agent knows what he's answering.
          await recordOutboundMessage({
            clientId: client.id,
            content: renderInviteMessage(campaign, look.first_name),
            whatsappMessageId: sent.messageId ?? null,
            metadata: { type: 'occasion_invite', look_id: look.id, campaign: campaign.key, channel: whatsapp },
          });
        }
      } else {
        fields.whatsapp_error = (sent.error ?? 'WhatsApp send failed').slice(0, 500);
      }
    }

    if (email && look.email && businessNumber) {
      const emailed = await sendOccasionLookEmail({
        email: look.email,
        subject: campaign.emailSubject(look.first_name),
        message: renderInviteEmail(campaign, look.first_name),
        buttonLabel: `${LOOK_BUTTONS.show} 🪔`,
        showLink: whatsappLink(businessNumber, campaign.showText),
      });
      if (emailed.success) {
        summary.emailsSent += 1;
        Object.assign(fields, { email_sent_at: nowIso(), email_error: null });
      } else {
        fields.email_error = (emailed.error ?? 'Email failed').slice(0, 500);
      }
    }

    const reached = Boolean(fields.whatsapp_sent_at || fields.email_sent_at);
    if (!reached) summary.failed.push({ id: look.id, error: fields.whatsapp_error ?? fields.email_error ?? 'No way to reach him this way' });
    // Someone reached on neither channel stays on the list for the next send.
    await updateLook(look.id, { ...fields, ...(reached ? { status: 'sent' as const } : {}) });
  }

  summary.remaining = options.dryRun ? looks.length : Math.max(0, (count ?? 0) - looks.length);
  return summary;
}

// ─── The reveal: only when he asks ───────────────────────────────────────────

/**
 * Chooses his look from the hand-picked library: a shortlist ranked for his
 * colours, style and height, then one model call picks the best and writes the
 * line on why it suits him. The pieces are the library's, word for word.
 */
async function designLook(campaign: OccasionCampaign, reportData: unknown, seed: string) {
  const profile = manPassportProfile(reportData);
  const shortlist = shortlistOccasionOutfits(loadOccasionLibrary(campaign.library), profile, { count: 10, seed });
  if (!shortlist.length) throw new Error('No library look fits his colours');
  const raw = await generateAgentJson(`You are ICONIK's menswear stylist. Choose the ONE ${campaign.occasion} look below that suits this client best, from his ICONIK report.

Think about: colours near his face against his palette, cuts against his fit rules, and how traditional or modern his style brief is. Every look is real and buyable; don't change any piece.

THE OCCASION: ${campaign.brief}

THE LOOKS
${shortlist.map(outfit => `${outfit.id}: ${occasionOutfitText(outfit)} (${outfit.styling})`).join('\n')}

THE HOOK: a short clause that finishes the sentence "I put this together for you, …" — it names the hero piece and says, like a friend, why it works on HIM (his colouring, his build). Starts lowercase, no full stop, max 90 characters, plain words (no season names, no jargon like "silhouette"). E.g. "the deep rust brings out the warmth in your skin" or "the olive bandhgala gives your shoulders a sharp line".

Return ONLY JSON: {"id": <the look's number>, "hook": "…"}

HIS REPORT
${JSON.stringify(profile)}`, 'iconik_agent_occasion_look');
  const chosen = shortlist.find(outfit => outfit.id === Number(raw.id)) ?? shortlist[0];
  const hook = typeof raw.hook === 'string' ? cleanHook(raw.hook) : '';
  if (!hook) throw new Error('The look designer returned no hook');
  return { outfit: occasionOutfitText(chosen), styling: chosen.styling, hook };
}

/** He was invited and hasn't seen his look yet. */
async function lookAwaitingReveal(client: AgentClient, lookId?: string) {
  let query = supabaseAdmin
    .from('agent_occasion_looks')
    .select('*')
    .eq('status', 'sent')
    .is('image_path', null)
    .or(`agent_client_id.eq.${client.id},phone.eq.${client.phone}`);
  if (lookId) query = query.eq('id', lookId);
  const { data } = await query.order('updated_at', { ascending: false }).limit(1);
  const look = data?.[0] as OccasionLookRow | undefined;
  const sentAt = look ? invitedAt(look) : null;
  return look && sentAt && isLookActive({ sentAt, campaign: look.campaign }) ? look : null;
}

export type RevealOutcome = 'not_needed' | 'revealed' | 'failed';

/**
 * His first message after the invite: design and draw his look now, and send it
 * with "Love it" / "Show me another". The only point where credits are spent on
 * the campaign. Returns 'not_needed' when he has no look waiting.
 */
export async function revealOccasionLook(
  client: AgentClient,
  message: { text: string; payload?: string },
  onWaitSent?: () => void,
): Promise<RevealOutcome> {
  const tapped = parseLookButtonPayload(message.payload);
  const waiting = await lookAwaitingReveal(client, tapped?.action === 'show' ? tapped.lookId : undefined);
  if (!waiting) return 'not_needed';

  // Claimed first, so messages arriving together can't draw it twice.
  const staleBefore = new Date(Date.now() - STALE_REVEAL_MS).toISOString();
  const { data: claimed } = await supabaseAdmin
    .from('agent_occasion_looks')
    .update({ generating_since: nowIso(), agent_client_id: client.id, attempts: waiting.attempts + 1, updated_at: nowIso() })
    .eq('id', waiting.id)
    .is('image_path', null)
    .or(`generating_since.is.null,generating_since.lt.${staleBefore}`)
    .select('*')
    .maybeSingle();
  // Already being drawn for an earlier message: that reveal will answer.
  if (!claimed) return 'revealed';
  const look = claimed as OccasionLookRow;
  const campaign = requireCampaign(look.campaign);

  const wait = await sendWhatsAppTextMessage(client.phone, campaign.revealWait).catch(() => null);
  if (wait?.success) {
    onWaitSent?.();
    await recordOutboundMessage({ clientId: client.id, content: campaign.revealWait, whatsappMessageId: wait.messageId ?? null, metadata: { type: 'occasion_reveal_wait', look_id: look.id } });
  }

  try {
    const { loadManEditReportContext, generateManEditOutfitImage, uploadManEditChatImageBytes } = await import('@/lib/manEdit');
    const context = await loadManEditReportContext(look.share_token, false);
    if (!context) throw new Error('Could not load his report');
    const design = await withAgentUsage({ clientId: client.id, kind: 'other' }, () => designLook(campaign, context.report.report_data, look.id));
    const generated = await generateManEditOutfitImage({
      context,
      request: `His ${campaign.occasion} look: ${design.outfit}. Styling: ${design.styling}`,
      outfitDirection: design.outfit,
    });
    const uploaded = await uploadManEditChatImageBytes(context.report.id, generated.bytes, generated.mimeType, 'occasion-look.png');
    if (!uploaded.signedUrl) throw new Error('The image could not be stored');

    const caption = renderRevealMessage(design.hook);
    const sent = await sendWhatsAppLookButtons({
      to: client.phone, lookId: look.id, body: caption, actions: ['love', 'another'], imageUrl: uploaded.signedUrl,
    });
    if (!sent.success) throw new Error(sent.error ?? 'Could not send his look');

    await updateLook(look.id, {
      outfit: design.outfit,
      hook: design.hook,
      image_path: uploaded.path,
      image_url: uploaded.signedUrl,
      generating_since: null,
      error: null,
      response: look.response ?? 'show',
      responded_at: look.responded_at ?? nowIso(),
    });
    await recordOutboundMessage({
      clientId: client.id,
      kind: 'image',
      content: caption,
      imageUrl: uploaded.signedUrl,
      whatsappMessageId: sent.messageId ?? null,
      metadata: { type: 'occasion_look', look_id: look.id, campaign: campaign.key, outfit: design.outfit },
    });
    return 'revealed';
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error('[agent] occasion look reveal failed:', reason);
    await updateLook(look.id, { generating_since: null, error: reason.slice(0, 500) }).catch(() => undefined);
    return 'failed';
  }
}

// ─── While he's chatting ─────────────────────────────────────────────────────

/** The look he was shown, while it still matters (see isLookActive). */
export async function activeOccasionLookFor(client: AgentClient, now = new Date()): Promise<ActiveLookForPrompt & { id: string } | null> {
  const { data } = await supabaseAdmin
    .from('agent_occasion_looks')
    .select('id, campaign, outfit, hook, whatsapp_sent_at, email_sent_at, response')
    .eq('status', 'sent')
    .not('image_path', 'is', null)
    .or(`agent_client_id.eq.${client.id},phone.eq.${client.phone}`)
    .order('updated_at', { ascending: false })
    .limit(1);
  const row = data?.[0] as AnyRecord | undefined;
  if (!row || typeof row.outfit !== 'string' || typeof row.hook !== 'string') return null;
  const sentAt = invitedAt(row as Pick<OccasionLookRow, 'email_sent_at' | 'whatsapp_sent_at'>);
  if (!sentAt) return null;
  const look = {
    id: row.id as string,
    campaign: row.campaign as string,
    outfit: row.outfit,
    hook: row.hook,
    sentAt,
    response: (row.response as string | null) ?? null,
  };
  return isLookActive(look, now) ? look : null;
}

/**
 * Records how he answered his look once he has seen it: "Love it" and "Show me
 * another" always count; anything else only as his first reaction.
 */
export async function noteOccasionLookResponse(client: AgentClient, message: { text: string; payload?: string }) {
  const tapped = parseLookButtonPayload(message.payload);
  if (tapped?.action === 'show') return;
  const active = await activeOccasionLookFor(client);
  const lookId = tapped?.lookId ?? active?.id;
  if (!lookId) return;
  const response = tapped?.action ?? lookResponseFromText(message.text, occasionCampaign(active?.campaign));
  if (response === 'show' || (response === 'reply' && active?.response && active.response !== 'show')) return;
  const now = nowIso();
  await supabaseAdmin
    .from('agent_occasion_looks')
    .update({ response, responded_at: now, agent_client_id: client.id, updated_at: now })
    .eq('id', lookId)
    .or(`agent_client_id.eq.${client.id},phone.eq.${client.phone}`);
}
