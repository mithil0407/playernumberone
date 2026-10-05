// Pure rules for ICONIK's free tier: usage limits, invite codes and links, and
// what each model call costs. Persistence is in agentCredits.ts / agentInvites.ts.

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
  /** Friends who must join with someone's link to unlock their Face Analysis. */
  faceUnlockFriends: envNumber('ICONIK_AGENT_FACE_UNLOCK_FRIENDS', 3),
  /** Photo checks (outfit ratings, "is this my colour?") a free user gets each month after their Colour Card. */
  monthlyPhotoChecks: envNumber('ICONIK_AGENT_FREE_PHOTO_CHECKS', 5),
  /** Extra photo checks each month for every friend who joined with their link. */
  photoChecksPerFriend: envNumber('ICONIK_AGENT_PHOTO_CHECKS_PER_FRIEND', 5),
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
export function inviteLink(code: string, businessNumber: string | null, purpose: 'invite' | 'colour_analysis' = 'invite') {
  const digits = (businessNumber ?? '').replace(/\D+/g, '');
  if (!digits) return null;
  const message = purpose === 'colour_analysis'
    ? `Hi ICONIK! I want my free colour analysis 🎨 ${code}`
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
    ? `I just found out I'm a ${input.season} 🎨 ICONIK read my colours from one selfie on WhatsApp — and told me exactly what to wear.`
    : `${input.inviterName ? `${input.inviterName} invited you to ICONIK` : "You're invited to ICONIK"} — a personal stylist on WhatsApp ✨`;
  return [
    opener,
    'Send a selfie and get your free colour analysis in a minute, then clothes that actually suit you, checked in your size.',
    input.link ? `Get yours: ${input.link}` : `Message ICONIK with the code ${input.code}`,
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
 * The instant first reply on the free colour flow: one bubble, no model call.
 * Most people arrive from a reel late at night, so any decent light is fine.
 */
export function selfieAskMessage(firstName: string | null) {
  return `Hey${firstName ? ` ${firstName}` : ''} 👋 I'm ICONIK, your stylist on WhatsApp. Send me a close selfie — face to the camera, no sunglasses or filter. Daylight is best, but any good light works right now. Your Colour Card will be ready in under a minute 🎨 (your photo stays private 🔒)`;
}

/** One nudge for people who got the selfie ask but never sent a photo. */
export const SELFIE_REMINDER_MESSAGE = "Your Colour Card is still waiting for you 🎨 Just send one close selfie — face to the camera, no sunglasses — and I'll have it ready in under a minute.";

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

// ── The invite unlock: friends who join unlock the Face Analysis ──

export function faceAnalysisUnlocked(friendsJoined: number, limits = FREE_LIMITS) {
  return friendsJoined >= limits.faceUnlockFriends;
}

/** Sent right before their forwardable invite: what each friend unlocks and how far they are. */
export function inviteUnlockIntro(friendsJoined: number, limits = FREE_LIMITS) {
  const needed = limits.faceUnlockFriends;
  const perFriend = `Every friend who gets their free Colour Card with your link gives you ${limits.photoChecksPerFriend} more photo checks a month, and you both get +${limits.referralBonus} product hunts.`;
  const face = faceAnalysisUnlocked(friendsJoined, limits)
    ? ''
    : ` ${needed} friends also unlock your Face Analysis${friendsJoined > 0 ? ` (${friendsJoined}/${needed} so far)` : ''}.`;
  return `${perFriend}${face}\n\nForward the message below 👇 the link is for them, not you.`;
}

// ── Photo checks: the free allowance, and sharing when it runs out ──

/** Photo checks a free client gets this month, given the friends who joined with their link. */
export function photoCheckAllowance(friendsJoined: number, limits = FREE_LIMITS) {
  return limits.monthlyPhotoChecks + friendsJoined * limits.photoChecksPerFriend;
}

/** Checks count from their Colour Card, and start again each calendar month in India. */
export function photoChecksCountFrom(colourCardAt: string | null | undefined, now = new Date()) {
  const monthStart = new Date(`${indiaMonthKey(now)}-01T00:00:00+05:30`);
  const cardAt = colourCardAt ? new Date(colourCardAt) : null;
  return cardAt && Number.isFinite(cardAt.getTime()) && cardAt > monthStart ? cardAt : monthStart;
}

/**
 * When their free photo checks are used up: thank them, then the one moment we
 * ask them to share — after they've had the value, not before.
 */
export function outOfPhotoChecksMessage(allowance: number, canInvite: boolean, friendsJoined: number, limits = FREE_LIMITS) {
  const used = `That's your ${allowance} free photo checks for this month used up 🙌 I loved doing them.`;
  if (!canInvite) return `${used} They reset on the 1st — and questions in chat are always free, so ask me anything meanwhile.`;
  return `${used}\n\nWant more right now? ${inviteUnlockIntro(friendsJoined, limits)}`;
}

/** If they send another photo soon after the share message, a short reminder instead of the invite again. */
export function stillOutOfPhotoChecksMessage(limits = FREE_LIMITS) {
  return `You're out of free photo checks for now — each friend who joins with your link adds ${limits.photoChecksPerFriend} more (the invite is just above 👆). Questions in chat are always free.`;
}

/** Told to the inviter when a friend joins with their link. */
export function friendJoinedMessage(friendsJoined: number, limits = FREE_LIMITS) {
  const needed = limits.faceUnlockFriends;
  if (friendsJoined === needed) {
    return `🔓 ${needed} friends joined with your link — your Face Analysis is unlocked! Send me a front-facing selfie with your hair off your face and I'll read your face shape and what suits it.`;
  }
  if (friendsJoined < needed) {
    const left = needed - friendsJoined;
    return `🎉 A friend just joined with your link — +${limits.photoChecksPerFriend} photo checks for you, and you both get +${limits.referralBonus} product hunts. ${friendsJoined}/${needed}: ${left} more and your Face Analysis unlocks.`;
  }
  return `🎉 Another friend joined with your link — +${limits.photoChecksPerFriend} photo checks for you, and you both get +${limits.referralBonus} product hunts.`;
}

/** When someone taps their own invite link and sends us their own code. */
export function ownInviteReply(friendsJoined: number, limits = FREE_LIMITS) {
  const needed = limits.faceUnlockFriends;
  const progress = faceAnalysisUnlocked(friendsJoined, limits)
    ? 'Your Face Analysis is already unlocked — ask me for it anytime.'
    : `${friendsJoined}/${needed} friends have joined so far; at ${needed} your Face Analysis unlocks 🔓`;
  return `That's your own invite link 😄 It's for your friends — forward the invite message to them and they'll get their free Colour Card. ${progress}`;
}

/** Sent the moment the selfie lands, so the wait for the Colour Card feels like work happening. */
export const SELFIE_RECEIVED_MESSAGE = 'Got it 📸 Reading your undertone and contrast now — your Colour Card is coming up in a few seconds.';

/**
 * Dates that change what people want to wear. Fixed dates repeat yearly;
 * lunar festivals need their date each year (check before adding one).
 */
const MOMENTS: Array<{ name: string; date: string; note: string }> = [
  { name: 'Diwali', date: '2026-11-08', note: 'festive ethnic looks, family photos, office parties' },
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
