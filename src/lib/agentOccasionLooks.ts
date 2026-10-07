// Occasion looks: before Diwali (and later occasions) each Man client with a
// delivered Blueprint is told a look is ready for him — by email, and later a
// WhatsApp nudge if he hasn't replied. Nothing is drawn until he asks to see it:
// then the agent designs the look from his report, draws him in it, and sends it
// with "Love it" / "Show me another". When he likes it, the agent asks for his
// pincode and size and finds the pieces at stores that deliver in time.
//
// Pure, so the exact messages, payloads and prompt text can be tested.

import { daysUntil } from './agentEvents.ts';

export interface OccasionCampaign {
  key: string;
  occasion: string;
  /** The day itself, IST (YYYY-MM-DD). */
  date: string;
  /** What the look is for, for the designer. */
  brief: string;
  /**
   * The WhatsApp nudge, exactly as submitted to Meta as the template body.
   * {{1}} is the first name. Also sent as-is (free) when his chat is open.
   */
  inviteBody: string;
  /** Meta template name; WHATSAPP_OCCASION_LOOK_TEMPLATE overrides it. */
  template: string;
  emailSubject: (firstName: string | null) => string;
  /** The email's paragraphs; {{1}} is the first name. */
  emailBody: string;
  /** What the email's button types into WhatsApp. */
  showText: string;
  /** While the picture is being drawn. */
  revealWait: string;
}

export const OCCASION_CAMPAIGNS: Record<string, OccasionCampaign> = {
  diwali_2026: {
    key: 'diwali_2026',
    occasion: 'Diwali',
    date: '2026-11-08',
    brief: 'Festive Indian menswear for Diwali: the pooja, family photos and card parties. Kurta sets, a bandhgala, or a Nehru jacket over a kurta, in festive fabrics (silk blend, raw silk, chanderi, jacquard, linen-silk). Rich but wearable, nothing costume-like, and every piece easy to buy online in India.',
    inviteBody: "Hi {{1}}, Diwali's on the 8th 🪔 I've put together a look for you, built on your Blueprint: your colours, your fit.\n\nWant to see it?",
    template: 'iconik_diwali_look_invite_v1',
    emailSubject: firstName => `${firstName ? `${firstName}, your` : 'Your'} Diwali look is ready 🪔`,
    emailBody: "Hi {{1}},\n\nDiwali's on the 8th, and I've put together a look for you, built on your Blueprint: your colours, your fit.\n\nTap below and I'll show you on WhatsApp. If you like it, I'll find every piece in your size, at stores that deliver to you before Diwali.",
    showText: 'Show me my Diwali look 🪔',
    revealWait: 'Give me a minute, dressing you up for Diwali 🪔',
  },
};

export function occasionCampaign(key: string | null | undefined) {
  return key ? OCCASION_CAMPAIGNS[key] ?? null : null;
}

export const LOOK_BUTTONS = { show: 'Show me my look', love: 'Love it 😍', another: 'Show me another' } as const;
export type LookAction = keyof typeof LOOK_BUTTONS;
export type LookResponse = LookAction | 'reply';

export function lookButtonPayload(lookId: string, action: LookAction) {
  return `look:${lookId}:${action}`;
}

export function parseLookButtonPayload(payload: string | null | undefined): { lookId: string; action: LookAction } | null {
  const match = /^look:([0-9a-f-]{36}):(show|love|another)$/i.exec(payload?.trim() ?? '');
  return match ? { lookId: match[1].toLowerCase(), action: match[2].toLowerCase() as LookAction } : null;
}

/** Reads a reply to the look: a button tap, the email's typed text, or anything else. */
export function lookResponseFromText(text: string, campaign: OccasionCampaign | null): LookResponse {
  const clean = text.trim().toLowerCase();
  if (clean === LOOK_BUTTONS.show.toLowerCase() || (campaign && clean === campaign.showText.toLowerCase())) return 'show';
  if (clean === LOOK_BUTTONS.love.toLowerCase()) return 'love';
  if (clean === LOOK_BUTTONS.another.toLowerCase()) return 'another';
  return 'reply';
}

/**
 * Meta rejects template parameters with new lines, tabs or more than four
 * spaces in a row.
 */
export function templateParam(value: string, max = 160) {
  const flat = value.replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

/** The hook has to read on after "I put this together for you,". */
export function cleanHook(hook: string) {
  let clean = templateParam(hook, 140).replace(/^[,;:–—-]\s*/, '').replace(/[.!…\s]+$/, '');
  // "The rust…" → "the rust…", but leave "I" and names alone.
  if (/^[A-Z][a-z]/.test(clean) && !/^I\b/.test(clean)) clean = clean.charAt(0).toLowerCase() + clean.slice(1);
  return clean;
}

export function greetingName(firstName: string | null | undefined) {
  return templateParam(firstName?.trim() || 'there', 40);
}

export function renderInviteMessage(campaign: OccasionCampaign, firstName: string | null) {
  return campaign.inviteBody.replace('{{1}}', greetingName(firstName));
}

export function renderInviteEmail(campaign: OccasionCampaign, firstName: string | null) {
  return campaign.emailBody.replace('{{1}}', greetingName(firstName));
}

/** The caption on his picture once it's drawn. */
export function renderRevealMessage(hook: string) {
  return `I put this together for you, ${cleanHook(hook)}.\n\nLike it?`;
}

interface InviteSendInput {
  to: string;
  campaign: OccasionCampaign;
  lookId: string;
  firstName: string | null;
  templateName?: string;
  language?: string;
}

/** Outside the 24h window: the approved template, text only (nothing is drawn yet). */
export function buildOccasionTemplatePayload(input: InviteSendInput) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: input.to,
    type: 'template',
    template: {
      name: input.templateName || input.campaign.template,
      language: { code: input.language || 'en' },
      components: [
        { type: 'body', parameters: [{ type: 'text', text: greetingName(input.firstName) }] },
        {
          type: 'button',
          sub_type: 'quick_reply',
          index: '0',
          parameters: [{ type: 'payload', payload: lookButtonPayload(input.lookId, 'show') }],
        },
      ],
    },
    biz_opaque_callback_data: `look:${input.lookId}`,
  };
}

/** Reply buttons, free inside the 24h window; with an image header for the reveal. */
export function buildLookButtonsPayload(input: {
  to: string;
  lookId: string;
  body: string;
  actions: LookAction[];
  imageUrl?: string;
}) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: input.to,
    type: 'interactive',
    interactive: {
      type: 'button',
      ...(input.imageUrl ? { header: { type: 'image', image: { link: input.imageUrl } } } : {}),
      body: { text: input.body },
      action: {
        buttons: input.actions.map(action => ({
          type: 'reply',
          reply: { id: lookButtonPayload(input.lookId, action), title: LOOK_BUTTONS[action] },
        })),
      },
    },
  };
}

export function whatsappLink(businessNumber: string, text: string) {
  return `https://wa.me/${businessNumber.replace(/\D+/g, '')}?text=${encodeURIComponent(text)}`;
}

/** Replies only reach the agent when it serves every Blueprint client (see agentAccessFor / freeTierEnabled). */
export function agentServesBlueprintClients(env: Record<string, string | undefined> = process.env) {
  if (env.ICONIK_AGENT_ENABLED !== '1') return false;
  const allowed = (env.ICONIK_AGENT_ALLOWED_PHONES ?? '').split(',').map(value => value.trim());
  return allowed.includes('*') || env.ICONIK_AGENT_FREE_ENABLED === '1';
}

/** What a Blueprint man forwards to his wife or family so their outfits go together. */
export function forwardableOccasionInvite(input: { inviterName: string | null; occasion: string; link: string | null; code: string }) {
  return [
    `${input.inviterName ? `${input.inviterName}'s` : 'My'} ${input.occasion} outfit is sorted 🪔 ICONIK can plan yours so you two go together, free.`,
    'Send a selfie on WhatsApp and get your colours in a minute.',
    input.link ? input.link : `Message ICONIK with the code ${input.code}`,
  ].join('\n\n');
}

export interface ActiveLookForPrompt {
  campaign: string;
  outfit: string;
  hook: string;
  /** When we told him about it (email or WhatsApp). */
  sentAt: string;
  response: string | null;
}

/** How long after the invite a look still steers the conversation. */
export const ACTIVE_LOOK_DAYS = 21;

export function isLookActive(look: { sentAt: string; campaign: string }, now = new Date()) {
  const campaign = occasionCampaign(look.campaign);
  if (!campaign) return false;
  const age = now.getTime() - new Date(look.sentAt).getTime();
  return age >= 0 && age < ACTIVE_LOOK_DAYS * 86_400_000 && daysUntil(campaign.date, now) >= -1;
}

/** The prompt section that tells the agent what it showed him and how to follow through. */
export function occasionLookSection(look: ActiveLookForPrompt | null, now = new Date()) {
  if (!look || !isLookActive(look, now)) return '';
  const campaign = occasionCampaign(look.campaign)!;
  const days = daysUntil(campaign.date, now);
  const when = days > 1 ? `in ${days} days` : days === 1 ? 'tomorrow' : days === 0 ? 'today' : 'just gone';
  const reaction = look.response === 'love' ? 'He tapped "Love it".'
    : look.response === 'another' ? 'He asked for another option.'
      : look.response === 'reply' ? 'He has replied.'
        : 'He has just seen it.';
  return `
${campaign.occasion.toUpperCase()} LOOK YOU MADE HIM (${campaign.occasion} is ${when})
You sent him a photo of himself in: ${look.outfit}
With the line: "${look.hook}". ${reaction}
This is why he's here, so follow through, lightly and like a friend:
- He likes it ("Love it", 😍, "where do I get this"): if you know his size and delivery pincode, go straight to the pieces: search_products for each, then present_products with his size, pincode and the deadline (before ${campaign.occasion}). If not, ask for both in ONE short line and nothing else, e.g. "Glad you like it 🙌 Send me your pincode and shirt size, and I'll find these at stores that deliver to you before ${campaign.occasion}." When he sends them, remember both, then search and present. No questions about budget or brands unless he raises them; let the real prices speak.
- He wants another: call show_outfit_image straight away with a clearly different look for ${campaign.occasion} in his colours (another hero colour or another shape, e.g. a bandhgala instead of a kurta), then one line on why it works and "This one or the first?" No questions before the picture.
- He's not interested or not celebrating: take it lightly and move on. Never push.
- Once the pieces are on their way to him, and only if he has mentioned a wife, partner or family dressing up with him, you may offer once, in passing: "If she's still planning her outfit, send her this, I'll make sure you two go together" and call share_invite. This is the one time an invite is welcome unprompted.
`;
}
