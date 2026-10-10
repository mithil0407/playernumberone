// Style Membership: every price, bump, date and promise the funnel shows lives
// here, so the owner changes one file and the quiz, paywall, sales page,
// checkout API and webhook all follow. Amounts are in paise and include GST.
//
// Nothing here is live until the owner confirms it (see
// docs/style-membership/OWNER-CHECKLIST.md). Isomorphic: no server imports.

export type MembershipPlanId = 'subscribe' | 'one_time' | 'founding';
export type MembershipBumpId = 'festive_pack' | 'style_him' | 'blueprint';

export interface MembershipPlan {
  id: MembershipPlanId;
  name: string;
  /** What she pays today. */
  pricePaise: number;
  /** What each renewal costs; null when the plan never renews. */
  renewalPaise: number | null;
  periodDays: number;
  badge: string | null;
  /** Shown under the price. */
  summary: string;
  /** Only shown to people we can verify as past Blueprint buyers. */
  pastBuyersOnly?: boolean;
}

export const MEMBERSHIP_PERIOD_DAYS = 90;

export const MEMBERSHIP_PLANS: Record<MembershipPlanId, MembershipPlan> = {
  subscribe: {
    id: 'subscribe',
    name: 'Membership, subscribe and save',
    pricePaise: 179_900,
    renewalPaise: 179_900,
    periodDays: MEMBERSHIP_PERIOD_DAYS,
    badge: 'Save 40%',
    summary: 'Every 3 months. Cancel anytime on WhatsApp.',
  },
  one_time: {
    id: 'one_time',
    name: '3 months, one-time',
    pricePaise: 299_900,
    renewalPaise: null,
    periodDays: MEMBERSHIP_PERIOD_DAYS,
    badge: null,
    summary: 'One quarter. No renewal.',
  },
  founding: {
    id: 'founding',
    name: 'Founding quarter',
    pricePaise: 149_900,
    renewalPaise: 179_900,
    periodDays: MEMBERSHIP_PERIOD_DAYS,
    badge: 'Past clients',
    summary: 'Your first quarter at ₹1,499, then ₹1,799 every 3 months.',
    pastBuyersOnly: true,
  },
};

/** Pre-selected on the paywall (the subscription is the default, per the blueprint). */
export const DEFAULT_PLAN: MembershipPlanId = 'subscribe';

export interface MembershipBump {
  id: MembershipBumpId;
  name: string;
  description: string;
  pricePaise: number;
  /** The price outside the membership, shown struck through when set. */
  regularPaise?: number;
}

// Ticked before payment, never one-click after it (per-payment authentication
// in India makes post-payment upsells impractical). All start unticked.
export const MEMBERSHIP_BUMPS: Record<MembershipBumpId, MembershipBump> = {
  festive_pack: {
    id: 'festive_pack',
    name: 'Wedding and festive look pack',
    description: '10 extra looks for Diwali and wedding functions, with jewellery and dupatta pairings.',
    pricePaise: 49_900,
  },
  style_him: {
    id: 'style_him',
    name: 'Style him too',
    description: 'Your partner, brother or father gets his own colours and 10 looks on WhatsApp.',
    pricePaise: 99_900,
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint by a human stylist',
    description: 'A 30-minute video call with an ICONIK stylist and your full 20-outfit Blueprint.',
    pricePaise: 199_900,
    regularPaise: 269_900,
  },
};

export const MEMBERSHIP_BUMP_ORDER: MembershipBumpId[] = ['festive_pack', 'style_him', 'blueprint'];

/**
 * The real founding-cohort close date. No timer counts down to it; the paywall
 * shows the date. After it passes the cohort line disappears on its own.
 */
export const FOUNDING_COHORT = {
  name: 'Founding cohort',
  closesAt: '2026-10-31T23:59:59+05:30',
  closesLabel: '31 October',
  seats: null as number | null,
};

export const GUARANTEE = {
  days: 7,
  headline: 'Love your first 3 looks, or get a full refund',
  body: 'If your first 3 looks don’t feel like you, message us on WhatsApp within 7 days of joining and we refund every rupee. No forms.',
};

/** Real numbers only. 1,200+ is the count of past Blueprint buyers (blueprint, 9 Oct 2026). */
export const PROOF = {
  womenStyled: 1200,
  womenStyledLabel: '1,200+',
};

/** The funnel speaks as ICONIK, never as a named persona (owner, 10 Oct). */
export const BRAND = {
  name: 'ICONIK',
  tagline: 'Your stylist on WhatsApp',
};

/** Razorpay quarterly plan used for the autopay mandate (created by the owner). */
export const RAZORPAY_PLAN_ENV = 'STYLE_MEMBERSHIP_PLAN_QUARTERLY';
/** Number of quarterly renewals the mandate allows (two years). */
export const MANDATE_TOTAL_COUNT = 8;

/** A personal stylist session, for the price comparison on the paywall. */
export const STYLIST_SESSION_RANGE = '₹5,000–15,000';

export const MEMBERSHIP_PRODUCT_ID = 'iconik_style_membership';
export const MEMBERSHIP_CONTENT_NAME = 'ICONIK Style Membership';
export const MEMBERSHIP_FUNNEL_CATEGORY = 'Style Membership';
/** Razorpay notes.product on every order and subscription the funnel creates. */
export const MEMBERSHIP_NOTES_PRODUCT = 'style_membership';

export function rupees(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

export function perDay(paise: number, days = MEMBERSHIP_PERIOD_DAYS) {
  return `₹${Math.round(paise / 100 / days)}`;
}

/** Savings of the subscription against the one-time price, as a whole percentage. */
export function subscriptionSavingPercent() {
  const sub = MEMBERSHIP_PLANS.subscribe.pricePaise;
  const one = MEMBERSHIP_PLANS.one_time.pricePaise;
  return Math.round((1 - sub / one) * 100);
}

export function cohortOpen(now = new Date()) {
  return now.getTime() <= new Date(FOUNDING_COHORT.closesAt).getTime();
}

/** The plain renewal sentence shown next to every pay button. */
export function renewalTerms(plan: MembershipPlan) {
  if (plan.renewalPaise === null) {
    return `You pay ${rupees(plan.pricePaise)} once for 3 months. It does not renew.`;
  }
  const first = plan.pricePaise === plan.renewalPaise
    ? `The membership is ${rupees(plan.pricePaise)} today for 3 months.`
    : `The membership is ${rupees(plan.pricePaise)} today for your first 3 months.`;
  return `${first} Then it renews at ${rupees(plan.renewalPaise)} every 3 months, by autopay if you choose to set it up after paying, or by a payment link we send on WhatsApp. You get a WhatsApp reminder 3 days before every renewal. Cancel anytime by messaging us on WhatsApp. Prices include GST.`;
}

export interface MembershipOrder {
  plan: MembershipPlan;
  bumps: MembershipBump[];
  totalPaise: number;
}

/** The one place a total is worked out; the checkout API recomputes it from the ids. */
export function priceMembershipOrder(planId: MembershipPlanId, bumpIds: readonly string[]): MembershipOrder {
  const plan = MEMBERSHIP_PLANS[planId];
  if (!plan) throw new Error(`Unknown plan: ${planId}`);
  const bumps = MEMBERSHIP_BUMP_ORDER
    .filter(id => bumpIds.includes(id))
    .map(id => MEMBERSHIP_BUMPS[id]);
  const totalPaise = plan.pricePaise + bumps.reduce((sum, bump) => sum + bump.pricePaise, 0);
  return { plan, bumps, totalPaise };
}

/** Meta content_ids for a membership order; the browser pixel and the Conversions API both use this. */
export function membershipContentIds(planId: MembershipPlanId, bumpIds: readonly string[]) {
  return [`${MEMBERSHIP_PRODUCT_ID}_${planId}`, ...bumpIds.map(bump => `${MEMBERSHIP_PRODUCT_ID}_bump_${bump}`)];
}

export function isMembershipPlanId(value: unknown): value is MembershipPlanId {
  return typeof value === 'string' && value in MEMBERSHIP_PLANS;
}
