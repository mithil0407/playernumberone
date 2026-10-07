// Pure rules for ICONIK's free tier: usage limits, invite codes and links, what
// each model call costs, and the few messages sent without a model call. Persistence is in agentCredits.ts / agentInvites.ts.

import { randomBytes } from 'node:crypto';

function envNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export const FREE_LIMITS = {
  /** Shopping runs granted each month. */
  monthlyRuns: envNumber('ICONIK_AGENT_FREE_MONTHLY_RUNS', 3),
  /** Unused runs carry over, up to this many. */
  maxBalance: envNumber('ICONIK_AGENT_FREE_MAX_RUNS', 10),
  /** Extra runs for both people when an invite is redeemed. */
  referralBonus: envNumber('ICONIK_AGENT_REFERRAL_BONUS', 2),
  /** Friends each person can invite. */
  invitesPerUser: envNumber('ICONIK_AGENT_INVITES_PER_USER', 5),
  /** Pictures (outfit fixes, try-ons, looks) a free user can get per day. Blueprint clients get dailyImagesBlueprint. */
  dailyImages: envNumber('ICONIK_AGENT_FREE_DAILY_IMAGES', 3),
  dailyImagesBlueprint: envNumber('ICONIK_AGENT_BLUEPRINT_DAILY_IMAGES', 10),
  /** Pictures across everyone per day: the spend safety net. */
  dailyImagesGlobal: envNumber('ICONIK_AGENT_DAILY_IMAGES_GLOBAL', 400),
  /** Messages a free user can send per day (chat is cheap; this stops abuse). */
  dailyMessages: envNumber('ICONIK_AGENT_FREE_DAILY_MESSAGES', 30),
  /** Shopping runs across all free users per day: the spend safety net. */
  dailyRunsGlobal: envNumber('ICONIK_AGENT_FREE_DAILY_RUNS', 150),
};

/** Calendar month in India, e.g. "2026-10": the key for the monthly grant. */
export function indiaMonthKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).format(now);
}

/** The monthly grant tops the balance up by the monthly allowance, never past the cap. */
export function monthlyGrantAmount(balance: number, limits = FREE_LIMITS) {
  return Math.max(0, Math.min(limits.monthlyRuns, limits.maxBalance - balance));
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const INVITE_CODE = /\bICK-([A-HJ-NP-Z2-9]{6})\b/i;

export function createInviteCode(bytes: Buffer = randomBytes(6)) {
  let code = 'ICK-';
  for (let index = 0; index < 6; index += 1) code += CODE_ALPHABET[bytes[index] % CODE_ALPHABET.length];
  return code;
}

export function parseInviteCode(text: string) {
  const match = text.match(INVITE_CODE);
  return match ? `ICK-${match[1].toUpperCase()}` : null;
}

/**
 * A link that opens WhatsApp with ICONIK and a message already typed: the
 * friend only taps send. Their message opens the conversation, so no template
 * is needed. Campaign links (reels, ads) ask for the free colour analysis.
 */
export function inviteLink(code: string, businessNumber: string | null, purpose: 'invite' | 'colour_analysis' | 'body_analysis' = 'invite') {
  const digits = (businessNumber ?? '').replace(/\D+/g, '');
  if (!digits) return null;
  const message = purpose === 'colour_analysis'
    ? `Hi ICONIK! I want my free colour analysis 🎨 ${code}`
    : purpose === 'body_analysis'
      ? `Hi ICONIK! I want my free body shape analysis 👗 ${code}`
      : `Hi ICONIK! My invite code is ${code}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * The message a client forwards to friends. When we know their colour season it
 * leads with it — "I just found out I'm a Deep Autumn" travels much further
 * than "try this app".
 */
export function forwardableInvite(input: { code: string; link: string | null; inviterName: string | null; season?: string | null }) {
  const opener = input.season
    ? `Okay I just found out I'm a ${input.season} 🎨 ICONIK worked out my colours from one selfie on WhatsApp, and honestly it's spot on.`
    : `${input.inviterName ? `${input.inviterName} thinks you'll love this` : 'You have to try this'}: ICONIK, a personal stylist on WhatsApp ✨`;
  return [
    opener,
    "Send a selfie and you get your colours in a minute, then help with outfits, shades and shopping. It's free.",
    input.link ? `Try it: ${input.link}` : `Message ICONIK with the code ${input.code}`,
  ].join('\n\n');
}

/** Team codes made for a campaign (a reel, an ad) start with this note. */
export const CAMPAIGN_NOTE_PREFIX = 'campaign:';

export function isCampaignNote(note: string | null | undefined) {
  return Boolean(note?.startsWith(CAMPAIGN_NOTE_PREFIX));
}

/** Someone messaging the number asking for their colours (e.g. from a reel), with or without a link. */
export function asksForColourAnalysis(text: string) {
  return /\bcolou?r\s*(?:analysis|season|test|palette|type)\b|\b(?:my|best)\s+colou?rs\b|\bwhat colou?rs suit\b/i.test(text);
}

/** Someone asking for their body shape (the campaign link's text, or in their own words). */
export function asksForBodyShapeAnalysis(text: string) {
  return /\bbody\s*(?:shape|type|analysis|card|scan)\b/i.test(text);
}

export const DIRECT_CAMPAIGN_NAME = 'Direct messages (colour analysis)';

/** Product hunts for people who join through a campaign link, in their first month. */
export const CAMPAIGN_FIRST_MONTH_RUNS = envNumber('ICONIK_AGENT_CAMPAIGN_RUNS', 1);

export function isOverDailyMessageCap(messagesToday: number, limits = FREE_LIMITS) {
  return messagesToday > limits.dailyMessages;
}

/** USD per 1M tokens [input, cached input, output]; web search is per call. */
export const MODEL_PRICES_USD: Record<string, [number, number, number]> = {
  'gpt-5.6-luna': [0.2, 0.02, 1.2],
  'gpt-5.6-sol': [4, 0.4, 20],
  'gpt-6-luna': [0.1, 0.01, 0.5],
  'gpt-6-sol': [2, 0.2, 10],
  'gpt-6.1-sol': [2, 0.1, 10],
  'gpt-6-astra': [10, 1, 50],
};
export const WEB_SEARCH_USD_PER_CALL = 0.01;

export function modelCallCostUsd(input: {
  model: string;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  webSearches: number;
}) {
  const [inputRate, cachedRate, outputRate] = MODEL_PRICES_USD[input.model] ?? [0, 0, 0];
  const uncached = Math.max(0, input.inputTokens - input.cachedTokens);
  return (uncached * inputRate + input.cachedTokens * cachedRate + input.outputTokens * outputRate) / 1e6
    + input.webSearches * WEB_SEARCH_USD_PER_CALL;
}

const GREETING_ONLY = /^(?:hi+|hey+|hello+|hii+|hlo|helo|yo|namaste|good (?:morning|afternoon|evening))\b[\s!.,🙂😊👋]*(?:iconik)?[\s!.,🙂😊👋]*$/i;

/**
 * A first message that only opens the conversation — the campaign link's
 * prefilled text, an invite code, or a bare hello. These get the selfie ask
 * instantly instead of waiting for the model; a real question still goes to it.
 */
export function isOpenerMessage(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (GREETING_ONLY.test(trimmed)) return true;
  if (trimmed.length > 160 || trimmed.includes('?')) return false;
  return asksForColourAnalysis(trimmed) || Boolean(parseInviteCode(trimmed));
}

/**
 * Picks one of a few wordings, the same one for the same seed, so the canned
 * messages don't read like a form letter to people who compare notes.
 */
export function pickVariant<T>(variants: readonly T[], seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return variants[hash % variants.length];
}

/**
 * The instant first reply on the free colour flow: one bubble, no model call.
 * Most people arrive from a reel late at night, so any decent light is fine.
 */
export function selfieAskMessage(firstName: string | null, seed = firstName ?? '') {
  const name = firstName ? ` ${firstName}` : '';
  return pickVariant([
    `Hey${name}! 👋 Send me a selfie, just your face, no filter or sunglasses. Near a window is perfect but any decent light works. I'll have your colours in a minute 🎨`,
    `Hii${name} 😊 Okay, let's find your colours! Send me a close selfie with no filter. Daylight's best, but don't stress about it.`,
    `Hey${name}! So glad you're here 🎨 Send me a clear selfie (no filter, no sunglasses) and I'll tell you exactly which colours are yours. It stays between us 🔒`,
  ], seed);
}

/** A body shape request that only opens the conversation (the campaign link's text): no model call needed. */
export function isBodyOpenerMessage(text: string) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 160 || trimmed.includes('?') || !asksForBodyShapeAnalysis(trimmed)) return false;
  // "Hi ICONIK! I want my free body shape analysis 👗 ICK-XXXXXX" is a request to start; a sentence with details is not.
  const words = trimmed.replace(INVITE_CODE, '').split(/\s+/).filter(word => /[a-z0-9]/i.test(word));
  return words.length <= 12;
}

/**
 * The instant first reply on the Body Card flow: one bubble, no model call. A
 * full-length photo is the whole ask, so it says what makes it readable.
 */
export function bodyPhotoAskMessage(firstName: string | null, firstConversation: boolean) {
  const name = firstName ? ` ${firstName}` : '';
  const ask = "send me one full-length photo, head to toe, standing straight, in something that isn't too loose. A mirror selfie is perfect 👗";
  return firstConversation
    ? `Hey${name}! 👋 Love this. For your body shape, ${ask} (it stays between us 🔒)`
    : `Let's do it${firstName ? `, ${firstName}` : ''}! ${ask.charAt(0).toUpperCase()}${ask.slice(1)}`;
}

/** Sent the moment the body photo lands. */
export function bodyPhotoReceivedMessage(seed: string) {
  return pickVariant([
    'Got it! Looking at your proportions now 👀',
    'Perfect, give me a minute with this ✨',
    'Ooh okay, one sec 👀',
  ], seed);
}

/** When the photo can't be read, the ask that says what to change. */
export const BETTER_BODY_PHOTO_ASK = "I can't quite read your shape from this one. Could you send a full-length photo, head to toe, standing straight, in something a bit fitted (not a coat or anything very loose)? 📸";

/** One nudge for people who asked for their Body Card but never sent a photo. */
export const BODY_PHOTO_REMINDER_MESSAGE = "Hey, still want your body shape done? One full-length mirror photo is all I need and I'll do it right away 👗";

/** One nudge for people who got the selfie ask but never sent a photo. */
export const SELFIE_REMINDER_MESSAGE = "Hey! Still want to know your colours? 🎨 Just send a quick selfie and I'll do it right away.";

/** Nudges go out during the day in India, never at 2am. */
export function isDaytimeInIndia(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }).format(now));
  return hour >= 9 && hour < 21;
}

function indiaHour(now: Date) {
  const [hour, minute] = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false })
    .format(now).split(':').map(Number);
  return hour + minute / 60;
}

/**
 * When the next-day follow-up goes: late in the 24h window (19h+ after their
 * last message), but only in the Indian daytime. If the window closes before
 * the next morning, it goes in the last evening slot (from 8:30pm IST) instead.
 */
export function followUpDue(lastInboundAt: Date, now = new Date()) {
  const hoursSince = (now.getTime() - lastInboundAt.getTime()) / 3_600_000;
  if (hoursSince < 6 || hoursSince > 23 || !isDaytimeInIndia(now)) return false;
  if (hoursSince >= 19) return true;
  const hour = indiaHour(now);
  const hoursUntilNextMorning = 24 - hour + 9;
  // Half an hour of margin: a window closing at 9:05am leaves the scheduler no real chance.
  return hour >= 20.5 && 23 - hoursSince < hoursUntilNextMorning + 0.5;
}

// ── Invites: a perk for both people, never a wall ──

/** Sent right before their forwardable invite. */
export function inviteIntro(limits = FREE_LIMITS) {
  return `Here's one you can forward 👇 (the link's for them, not you). Every friend who joins gets you both +${limits.referralBonus} shopping hunts.`;
}

/** Told to the inviter when a friend joins with their link. */
export function friendJoinedMessage(friendsJoined: number, limits = FREE_LIMITS) {
  return friendsJoined <= 1
    ? `Your friend just joined with your link 🥳 You both got ${limits.referralBonus} extra shopping hunts.`
    : `Another friend joined with your link 🥳 That's ${friendsJoined} now, and another +${limits.referralBonus} shopping hunts for you both.`;
}

/** When someone taps their own invite link and sends us their own code. */
export function ownInviteReply() {
  return "Haha that's your own link 😄 It's for your friends. Forward it and they'll get their colours too.";
}

/** Sent the moment the selfie lands, so the wait for the Colour Card feels like work happening. */
export function selfieReceivedMessage(seed: string) {
  return pickVariant([
    'Got it! Looking at your colouring now 👀',
    'Ooh okay, give me a minute with this ✨',
    'Perfect, one sec while I read your colours 🎨',
  ], seed);
}

/**
 * Dates that change what people want to wear. Fixed dates repeat yearly;
 * lunar festivals need their date each year (check before adding one).
 */
const MOMENTS: Array<{ name: string; date: string; note: string }> = [
  { name: 'Navratri', date: '2026-10-11', note: 'nine nights of garba and dandiya, a colour for each day; chaniya cholis, kurtas' },
  { name: 'Dussehra', date: '2026-10-20', note: 'festive ethnic, family visits' },
  { name: 'Karwa Chauth', date: '2026-10-29', note: 'married women dress up for the evening puja; sarees, suits, red and festive colours' },
  { name: 'Dhanteras', date: '2026-11-06', note: 'jewellery and shopping day before Diwali' },
  { name: 'Diwali', date: '2026-11-08', note: 'festive ethnic looks, family photos, office parties' },
  { name: 'Bhai Dooj', date: '2026-11-11', note: 'family lunch, easy festive' },
  { name: 'Christmas', date: '--12-25', note: 'parties, red-and-green done tastefully' },
  { name: "New Year's Eve", date: '--12-31', note: 'party looks' },
  { name: "Valentine's Day", date: '--02-14', note: 'date-night looks' },
];

/** Moments in the next `withinDays` days, soonest first, e.g. "Diwali (8 Nov, in 34 days)". */
export function upcomingMoments(today: string, withinDays = 45) {
  const start = new Date(`${today}T00:00:00Z`).getTime();
  if (!Number.isFinite(start)) return [];
  const year = Number(today.slice(0, 4));
  const found: Array<{ name: string; note: string; days: number; date: string }> = [];
  for (const moment of MOMENTS) {
    const candidates = moment.date.startsWith('--')
      ? [`${year}${moment.date.slice(1)}`, `${year + 1}${moment.date.slice(1)}`]
      : [moment.date];
    for (const date of candidates) {
      const days = Math.round((new Date(`${date}T00:00:00Z`).getTime() - start) / 86_400_000);
      if (days >= 0 && days <= withinDays) found.push({ name: moment.name, note: moment.note, days, date });
    }
  }
  const month = Number(today.slice(5, 7));
  const lines = found.sort((a, b) => a.days - b.days).map(moment => {
    const label = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${moment.date}T00:00:00Z`));
    return `${moment.name} (${label}, ${moment.days === 0 ? 'today' : `in ${moment.days} day${moment.days === 1 ? '' : 's'}`}): ${moment.note}`;
  });
  if (month >= 10 || month <= 2) lines.push('Wedding season (Nov–Feb, planning starts in October): sangeet, mehendi, reception and guest looks');
  return lines;
}

/**
 * The next-day message to someone who went quiet: written like their stylist
 * texting them, about THEIR clothes and plans, so it's worth replying to (a
 * reply reopens the 24h window — we have no other way to reach them).
 */
export function followUpPrompt(input: {
  firstName: string | null;
  profileLine: string;
  memoryText: string;
  thread: string;
  textingStyle: string;
  comingUp: string[];
}) {
  return `You are ICONIK, ${input.firstName ?? 'this person'}'s personal stylist on WhatsApp. You chatted yesterday and they went quiet. Write ONE message (max 35 words) that a real stylist friend would send the next day — something they'll actually want to reply to.

Make it about THEM, built from the chat and memory below:
- follow up on something real: a piece they showed you, an occasion they mentioned, a shade they were deciding on, an outfit you fixed ("did you try the espresso trousers with that tie-neck top?", "what did you end up wearing to the puja?");
- or a timely idea for something coming up that fits what you know ("Navratri starts Sunday, want me to plan 9 looks from what you've already shown me?").
Ask for one easy thing in return (a photo, a yes, a choice).

Rules: sound like a person texting, mirror how they text (below), no greeting like "Hi there" or "Dear", no "just checking in", never generic ("send me a photo of tomorrow's outfit" on its own is not allowed), no season names, at most one emoji, never salesy.
HOW THEY TEXT: ${input.textingStyle}
${input.comingUp.length ? `COMING UP: ${input.comingUp.join('; ')}\n` : ''}
Return ONLY JSON: {"message": "…"}

THEM: ${input.profileLine}
MEMORY:
${input.memoryText || 'Nothing saved yet.'}
RECENT CHAT (oldest first):
${input.thread}`;
}
