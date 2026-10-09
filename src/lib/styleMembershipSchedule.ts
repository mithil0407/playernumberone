// The first 90 days of a Style Membership on WhatsApp, as data the agent and a
// scheduler can read. Nothing here sends a message: rows are queued with a due
// time and a brief, and whoever sends them decides how (in the 24-hour window
// as a normal reply, outside it with an approved template). Pure; tested.

import type { MembershipPlanId } from './styleMembershipConfig';
import { upcomingLabel, weddingFunctionCount, type QuizAnswers } from './styleMembershipLogic';

export type ScheduleKind =
  | 'handoff'
  | 'selfie'
  | 'first_looks'
  | 'style_plan'
  | 'ask_before_you_buy'
  | 'occasion_plan'
  | 'referral'
  | 'monthly_drop'
  | 'recap'
  | 'pre_debit_reminder'
  | 'renewal';

export interface ScheduleStep {
  id: string;
  kind: ScheduleKind;
  /** Days after purchase; fractional days are minutes/hours. */
  day: number;
  title: string;
  /** The same step as she reads it on the welcome page. */
  forHer: string;
  /** What the stylist (agent) should do, in plain words. */
  brief: string;
  /** Outside WhatsApp's 24-hour window, so it needs an approved template. */
  needsTemplate: boolean;
  /** Only for plans that renew. */
  renewingOnly?: boolean;
  /** Only when this is true of her. */
  when?: (context: ScheduleContext) => boolean;
}

export interface ScheduleContext {
  plan: MembershipPlanId;
  answers: QuizAnswers;
  hasSelfie: boolean;
}

export const NINETY_DAY_SCHEDULE: ScheduleStep[] = [
  {
    id: 'handoff',
    kind: 'handoff',
    day: 0,
    title: 'Minute 0: she opens WhatsApp',
    forHer: 'Now: say hello to your stylist on WhatsApp',
    brief: 'She tapped "Open WhatsApp" with her member code. Greet her by name, say you already have her quiz, and ask for the one thing missing next.',
    needsTemplate: false,
  },
  {
    id: 'selfie',
    kind: 'selfie',
    day: 0.004,
    title: 'Minutes 1–15: selfie if she skipped it',
    forHer: 'Minutes later: one selfie to confirm your colours',
    brief: 'Ask for one selfie in daylight, no filter, to confirm her colour season. Then offer an optional full-length photo for her body shape.',
    needsTemplate: false,
    when: context => !context.hasSelfie,
  },
  {
    id: 'first-looks',
    kind: 'first_looks',
    day: 0.01,
    title: 'Minutes 1–15: her first 3 looks',
    forHer: 'Within minutes: your first 3 looks',
    brief: 'Send her first 3 looks for her real week, shown on her once you have a photo. These are the 3 looks the guarantee is about.',
    needsTemplate: false,
  },
  {
    id: 'style-plan',
    kind: 'style_plan',
    day: 1,
    title: 'Within 24 hours: the full Style Plan, checked by a stylist',
    forHer: 'Within 24 hours: your full Style Plan, checked by an ICONIK stylist',
    brief: 'Send her full Style Plan after an ICONIK stylist has checked it: colours, body shape rules and about 20 outfits for her calendar.',
    needsTemplate: false,
  },
  {
    id: 'ask-before-you-buy',
    kind: 'ask_before_you_buy',
    day: 2,
    title: 'Day 2: "Send me anything before you buy it"',
    forHer: 'From day 2: send anything before you buy it',
    brief: 'Tell her she can send any link or screenshot before buying and you’ll say yes, or show a better option in her size and budget.',
    needsTemplate: true,
  },
  {
    id: 'occasion-plan',
    kind: 'occasion_plan',
    day: 7,
    title: 'Day 7: an outfit plan for her next occasion',
    forHer: 'Day 7: an outfit plan for your next occasion',
    brief: 'Plan her next occasion from the quiz, starting from what she already owns.',
    needsTemplate: true,
  },
  {
    id: 'referral',
    kind: 'referral',
    day: 10,
    title: 'Day 10: her sister or a friend gets the quiz free',
    forHer: 'Day 10: a free quiz for your sister or a friend',
    brief: 'Offer a forwardable invite: her sister or a friend gets the quiz free, and they both get a month free when the friend joins.',
    needsTemplate: true,
  },
  {
    id: 'drop-1',
    kind: 'monthly_drop',
    day: 30,
    title: 'Day 30: the monthly drop of 8 looks',
    forHer: 'Day 30: your monthly drop of 8 looks',
    brief: 'Send this month’s 8 looks for what’s coming up for her (festivals, weddings, office, weather).',
    needsTemplate: true,
  },
  {
    id: 'drop-2',
    kind: 'monthly_drop',
    day: 60,
    title: 'Day 60: the monthly drop of 8 looks',
    forHer: 'Day 60: your next drop of 8 looks',
    brief: 'Send this month’s 8 looks for what’s coming up for her.',
    needsTemplate: true,
  },
  {
    id: 'recap',
    kind: 'recap',
    day: 80,
    title: 'Day 80: her recap and the renewal date',
    forHer: 'Day 80: your recap, and your renewal date',
    brief: 'Send a recap of what she got (looks, outfit checks, sale picks) and the renewal date and amount. One-time members: ask if she wants to continue.',
    needsTemplate: true,
  },
  {
    id: 'pre-debit',
    kind: 'pre_debit_reminder',
    day: 87,
    title: 'Day 87: reminder 3 days before the renewal',
    forHer: '3 days before renewal: a WhatsApp reminder',
    brief: 'Remind her of the amount and date of the renewal, and that she can cancel by replying. This is the promised reminder before every charge.',
    needsTemplate: true,
    renewingOnly: true,
  },
  {
    id: 'renewal',
    kind: 'renewal',
    day: 90,
    title: 'Day 90: renewal, or a payment link if autopay fails',
    forHer: 'Day 90: your next quarter begins',
    brief: 'The renewal is charged by autopay. If the charge fails or she has no autopay, send the prepared payment link (queued by the webhook).',
    needsTemplate: true,
    renewingOnly: true,
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function occasionBrief(answers: QuizAnswers) {
  const label = upcomingLabel(answers);
  if (!label) return 'Plan her next occasion from the quiz, starting from what she already owns.';
  const functions = weddingFunctionCount(answers);
  if (answers.comingUp?.includes('wedding') && functions > 1) {
    return `She has a wedding with ${functions === 4 ? '4 or more' : functions} functions: plan every function with no repeats, starting from what she already owns.`;
  }
  return `Plan her ${label.toLowerCase()} look, starting from what she already owns.`;
}

export interface ScheduledMessage {
  stepId: string;
  kind: ScheduleKind;
  dueAt: string;
  title: string;
  forHer: string;
  brief: string;
  needsTemplate: boolean;
}

/** Her 90 days, with due times, for the plan she bought. */
export function membershipSchedule(startedAt: Date, context: ScheduleContext): ScheduledMessage[] {
  const renews = context.plan !== 'one_time';
  return NINETY_DAY_SCHEDULE
    .filter(step => (!step.renewingOnly || renews) && (!step.when || step.when(context)))
    .map(step => ({
      stepId: step.id,
      kind: step.kind,
      dueAt: new Date(startedAt.getTime() + step.day * DAY_MS).toISOString(),
      title: step.title,
      forHer: step.forHer,
      brief: step.kind === 'occasion_plan' ? occasionBrief(context.answers) : step.brief,
      needsTemplate: step.needsTemplate,
    }));
}

/** Steps due now and not yet done, oldest first: what the agent should do next. */
export function dueSteps(schedule: ScheduledMessage[], done: ReadonlySet<string>, now = new Date()) {
  return schedule
    .filter(step => !done.has(step.stepId) && new Date(step.dueAt).getTime() <= now.getTime())
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}
