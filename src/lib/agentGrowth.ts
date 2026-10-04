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
  invitesPerUser: envNumber('ICONIK_AGENT_INVITES_PER_USER', 3),
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
