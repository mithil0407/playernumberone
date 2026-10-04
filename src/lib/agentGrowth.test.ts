import assert from 'node:assert/strict';
import test from 'node:test';
import { computeAgentAnalytics, istDay, maskPhone, type AnalyticsRows } from './agentAnalytics.ts';
import {
  FREE_LIMITS,
  createInviteCode,
  forwardableInvite,
  indiaMonthKey,
  inviteLink,
  isOverDailyMessageCap,
  modelCallCostUsd,
  monthlyGrantAmount,
  parseInviteCode,
} from './agentGrowth.ts';
import { buildAgentInstructions } from './agentPrompt.ts';

test('invite codes are unambiguous and found anywhere in a message', () => {
  const code = createInviteCode(Buffer.from([0, 1, 2, 3, 4, 5]));
  assert.equal(code, 'ICK-ABCDEF');
  assert.equal(parseInviteCode('Hi ICONIK! My invite code is ick-7q2mzp'), 'ICK-7Q2MZP');
  assert.equal(parseInviteCode('my code is ICK-0OI1LL'), null, 'ambiguous characters are never issued');
  assert.equal(parseInviteCode('hello'), null);
});

test('invite links open WhatsApp with the code typed in', () => {
  assert.equal(
    inviteLink('ICK-ABCDEF', '+91 98765 43210'),
    'https://wa.me/919876543210?text=Hi%20ICONIK!%20My%20invite%20code%20is%20ICK-ABCDEF',
  );
  assert.equal(inviteLink('ICK-ABCDEF', ''), null);
  const message = forwardableInvite('ICK-ABCDEF', 'Riya', '919876543210');
  assert.match(message, /^Riya invited you to ICONIK/);
  assert.match(message, /Tap to start: https:\/\/wa\.me\/919876543210/);
  assert.match(forwardableInvite('ICK-ABCDEF', null, ''), /Message ICONIK with the code ICK-ABCDEF/);
});

test('monthly runs top up without passing the cap; daily message cap', () => {
  const limits = { ...FREE_LIMITS, monthlyRuns: 3, maxBalance: 10 };
  assert.equal(monthlyGrantAmount(0, limits), 3);
  assert.equal(monthlyGrantAmount(8, limits), 2);
  assert.equal(monthlyGrantAmount(12, limits), 0);
  assert.equal(isOverDailyMessageCap(30, { ...FREE_LIMITS, dailyMessages: 30 }), false);
  assert.equal(isOverDailyMessageCap(31, { ...FREE_LIMITS, dailyMessages: 30 }), true);
  assert.equal(indiaMonthKey(new Date('2026-10-31T19:00:00Z')), '2026-11', 'month turns over at midnight India time');
});

test('model call cost uses cached rates and per-call search fees', () => {
  const cost = modelCallCostUsd({ model: 'gpt-5.6-luna', inputTokens: 30_000, cachedTokens: 10_000, outputTokens: 1_000, webSearches: 3 });
  // 20k × $0.20 + 10k × $0.02 + 1k × $1.20 per 1M, + 3 × $0.01
  assert.equal(Number(cost.toFixed(6)), Number((0.004 + 0.0002 + 0.0012 + 0.03).toFixed(6)));
  assert.equal(modelCallCostUsd({ model: 'unknown', inputTokens: 5, cachedTokens: 0, outputTokens: 5, webSearches: 0 }), 0);
});

test('free-tier instructions onboard with a selfie and know the limits', () => {
  const instructions = buildAgentInstructions({
    line: null, firstName: null, today: '2026-10-05', profile: {}, reportUrl: null, memoryText: 'PORTRAIT: new',
    events: [], lookActivity: '', firstConversation: true, canShowOutfitImages: false,
    tier: 'free', runsLeft: 1, invitesLeft: 3, blueprintUrl: 'https://www.iconik.pro/',
  });
  assert.match(instructions, /not had an ICONIK Blueprint/);
  assert.match(instructions, /selfie in daylight/);
  assert.match(instructions, /Shopping runs left this month: 1/);
  assert.match(instructions, /nearly out/);
  assert.match(instructions, /Invites left: 3/);
  assert.doesNotMatch(instructions, /FIRST CONVERSATION/);
  const onboarded = buildAgentInstructions({
    line: 'woman', firstName: 'Riya', today: '2026-10-05', profile: { best_colours: ['rust'] }, reportUrl: null, memoryText: '',
    events: [], lookActivity: '', firstConversation: false, canShowOutfitImages: false, tier: 'free', runsLeft: 3, invitesLeft: 3,
  });
  assert.match(onboarded, /colour profile is saved/);
  assert.doesNotMatch(onboarded, /selfie in daylight/);
});

const NOW = new Date('2026-10-20T06:00:00Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

function rows(): AnalyticsRows {
  return {
    now: NOW,
    clients: [
      { id: 'a', tier: 'free', created_at: daysAgo(15), last_inbound_at: daysAgo(0), phone: '919800000001', first_name: 'Riya', line: 'woman', lite_profile: { best_colours: ['rust'] }, invited_by_client_id: null },
      { id: 'b', tier: 'free', created_at: daysAgo(14), last_inbound_at: daysAgo(14), phone: '919800000002', first_name: null, line: null, lite_profile: {}, invited_by_client_id: 'a' },
      { id: 'c', tier: 'blueprint', created_at: daysAgo(3), last_inbound_at: daysAgo(1), phone: '919800000003', first_name: 'Mithil', line: 'man', lite_profile: {}, invited_by_client_id: null },
    ],
    inbound: [
      { client_id: 'a', created_at: daysAgo(15) }, { client_id: 'a', created_at: daysAgo(6) }, { client_id: 'a', created_at: daysAgo(0) },
      { client_id: 'b', created_at: daysAgo(14) }, { client_id: 'c', created_at: daysAgo(1) },
    ],
    outboundCount: [{ created_at: daysAgo(1) }],
    ledger: [
      { client_id: 'a', delta: 3, reason: 'monthly_grant', created_at: daysAgo(15) },
      { client_id: 'a', delta: -1, reason: 'shopping_run', created_at: daysAgo(6) },
      { client_id: 'a', delta: 2, reason: 'referral_bonus', created_at: daysAgo(14) },
    ],
    lookEvents: [
      { type: 'view', client_id: 'a', item_id: null, created_at: daysAgo(6) },
      { type: 'view', client_id: 'a', item_id: null, created_at: daysAgo(5) },
      { type: 'click_out', client_id: 'a', item_id: 'i1', created_at: daysAgo(5) },
      { type: 'vote', client_id: 'a', item_id: 'i1', created_at: daysAgo(5) },
    ],
    lookItems: [
      { id: 'i1', retailer: 'Myntra', verification_status: 'verified', created_at: daysAgo(6) },
      { id: 'i2', retailer: 'Zara', verification_status: 'unavailable', created_at: daysAgo(6) },
    ],
    looksCreated: [{ created_at: daysAgo(6) }],
    usage: [
      { client_id: 'a', kind: 'search', cost_usd: 0.2, created_at: daysAgo(6) },
      { client_id: 'a', kind: 'product_check', cost_usd: 0.05, created_at: daysAgo(6) },
      { client_id: 'c', kind: 'chat', cost_usd: 0.01, created_at: daysAgo(1) },
    ],
    invites: [
      { code: 'ICK-AAAAAA', owner_client_id: 'a', uses: 1, max_uses: 3, note: null, created_at: daysAgo(15) },
      { code: 'ICK-TEAM01', owner_client_id: null, uses: 1, max_uses: 50, note: 'first wave', created_at: daysAgo(20) },
    ],
    redemptions: [
      { code: 'ICK-TEAM01', client_id: 'a', created_at: daysAgo(15) },
      { code: 'ICK-AAAAAA', client_id: 'b', created_at: daysAgo(14) },
    ],
    waitlist: [{ status: 'waiting', created_at: daysAgo(2) }, { status: 'joined', created_at: daysAgo(16) }],
    upgradedClientIds: new Set(['b']),
  };
}

test('analytics: totals, funnel, costs and growth', () => {
  const data = computeAgentAnalytics(rows());
  assert.equal(data.totals.users, 3);
  assert.equal(data.totals.freeUsers, 2);
  assert.equal(data.totals.active7, 2);
  assert.equal(data.totals.active1, 2);
  assert.equal(data.totals.runs7, 1);
  assert.equal(data.totals.clickOuts7, 1);
  assert.equal(Number(data.totals.spend7.toFixed(2)), 0.26);
  assert.equal(Number(data.totals.costPerRun30.toFixed(2)), 0.25);
  assert.deepEqual(data.funnel.map(step => step.value), [2, 1, 1, 1, 1]);
  assert.equal(data.looks.clickThroughRate, 0.5);
  assert.equal(data.looks.verifiedRate, 0.5);
  assert.deepEqual(data.looks.topRetailers, [{ retailer: 'Myntra', clicks: 1 }]);
  assert.equal(data.growth.referralJoins, 1);
  assert.equal(Number(data.growth.kFactor.toFixed(2)), 0.33);
  assert.deepEqual(data.growth.topInviters, [{ name: 'Riya', friends: 1 }]);
  assert.equal(data.growth.waitlistWaiting, 1);
  assert.equal(data.series.activeUsers.length, 30);
  assert.equal(data.series.activeUsers.at(-1)?.value, 1);
  const riya = data.recentUsers.find(user => user.name === 'Riya');
  assert.equal(riya?.credits, 4);
  assert.equal(riya?.phone, '…0001');
});

test('analytics: weekly retention counts only cohorts old enough', () => {
  const data = computeAgentAnalytics(rows());
  const oldest = data.cohorts.at(-1)!;
  assert.equal(oldest.users, 2);
  // Riya messaged on day 9 after joining (week 1); the other free user did not.
  assert.equal(oldest.retention[0], 0.5);
  assert.equal(oldest.retention[2], null, 'week 4 is not over yet');
  assert.equal(istDay('2026-10-19T19:00:00Z'), '2026-10-20');
  assert.equal(maskPhone('919876543210'), '…3210');
});
