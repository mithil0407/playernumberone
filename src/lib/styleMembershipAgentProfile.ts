// What the WhatsApp agent knows about a Style Membership member, kept in her
// agent_clients.lite_profile (the agent reads that profile as JSON in every
// turn). Pure, so it can be tested; the database side is styleMembershipAgent.ts.

import { MEMBERSHIP_PLANS, type MembershipPlanId } from './styleMembershipConfig';
import { paletteFor, quizSummary, type QuizAnswers } from './styleMembershipLogic';
import type { ScheduledMessage } from './styleMembershipSchedule';

/** Days after the paid period ends that she still counts as a member (renewal grace). */
export const MEMBER_GRACE_DAYS = 7;

export interface MemberProfileInput {
  membershipId: string;
  plan: MembershipPlanId;
  status: string;
  paidAt: string | null;
  currentPeriodEnd: string | null;
  autopayStatus: string;
  bumps: string[];
  answers: QuizAnswers;
  selfieSeason: string | null;
  schedule: ScheduledMessage[];
}

/** The lite-profile keys to merge in when she claims her membership in WhatsApp. */
export function memberLiteProfile(input: MemberProfileInput): Record<string, unknown> {
  const plan = MEMBERSHIP_PLANS[input.plan];
  const profile: Record<string, unknown> = {
    membership: {
      id: input.membershipId,
      product: 'ICONIK Style Membership',
      plan: plan.name,
      status: input.status,
      joined_at: input.paidAt,
      paid_until: input.currentPeriodEnd,
      autopay: input.autopayStatus,
      extras_bought: input.bumps,
      note_for_stylist: [
        'She is a paying Style Membership member: give her the full service (looks, outfit checks, ask-before-you-buy, monthly drops) without free-tier limits or upsells.',
        'Her style quiz answers are in style_quiz: use them instead of asking again.',
        input.selfieSeason
          ? 'Her colour season was read from a selfie at sign-up.'
          : 'Her season is only a guess from the quiz: ask for one daylight selfie to confirm it before leaning on colours.',
        'The first 3 looks are covered by the guarantee: love them or a full refund within 7 days.',
        'Follow schedule for what is due; never mention billing unless she asks or a renewal step is due.',
      ].join(' '),
      schedule: input.schedule.map(step => ({ step: step.stepId, due: step.dueAt, what: step.brief })),
    },
    style_quiz: quizSummary(input.answers, input.selfieSeason),
  };
  // A selfie-read season counts as her colours, so the agent skips redoing the
  // analysis; a quiz guess does not, so the agent still asks for a selfie.
  const palette = input.selfieSeason ? paletteFor(input.selfieSeason) : null;
  if (palette) {
    profile.season = palette.name;
    profile.best_colours = palette.best.map(swatch => swatch.name);
    profile.avoid_colours = palette.avoid.map(swatch => swatch.name);
  }
  return profile;
}

/** Whether a lite profile belongs to a member in good standing (used to lift free-tier limits). */
export function isActiveMember(liteProfile: Record<string, unknown> | null | undefined, now = new Date()) {
  const membership = liteProfile?.membership;
  if (!membership || typeof membership !== 'object') return false;
  const record = membership as Record<string, unknown>;
  if (record.status !== 'active' && record.status !== 'past_due') return false;
  const until = typeof record.paid_until === 'string' ? new Date(record.paid_until).getTime() : NaN;
  if (!Number.isFinite(until)) return false;
  return now.getTime() <= until + MEMBER_GRACE_DAYS * 24 * 60 * 60 * 1000;
}
