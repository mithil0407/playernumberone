import assert from 'node:assert/strict';
import test from 'node:test';
import { computeAgentAnalytics, istDay, maskPhone, type AnalyticsRows } from './agentAnalytics.ts';
import { colourCardHtml, parseColourAnalysis, readableOn } from './agentColourCard.ts';
import {
  FREE_LIMITS,
  asksForColourAnalysis,
  createInviteCode,
  forwardableInvite,
  indiaMonthKey,
  inviteLink,
  isOverDailyMessageCap,
  modelCallCostUsd,
  monthlyGrantAmount,
  parseInviteCode,
  isOpenerMessage,
  selfieAskMessage,
  upcomingMoments,
  faceAnalysisUnlocked,
  friendJoinedMessage,
  inviteUnlockIntro,
  followUpDue,
  isDaytimeInIndia,
  ownInviteReply,
  SELFIE_REMINDER_MESSAGE,
  outOfPhotoChecksMessage,
  photoCheckAllowance,
  photoChecksCountFrom,
  stillOutOfPhotoChecksMessage,
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
  assert.match(inviteLink('ICK-REEL01', '919876543210', 'colour_analysis') ?? '', /free%20colour%20analysis%20%F0%9F%8E%A8%20ICK-REEL01$/);
  assert.equal(inviteLink('ICK-ABCDEF', null), null);
  const seasonal = forwardableInvite({ code: 'ICK-ABCDEF', link: 'https://wa.me/1?text=x', inviterName: 'Riya', season: 'Deep Autumn' });
  assert.match(seasonal, /^I just found out I'm a Deep Autumn/);
  assert.match(seasonal, /Get yours: https:\/\/wa\.me\/1/);
  assert.match(forwardableInvite({ code: 'ICK-ABCDEF', link: null, inviterName: 'Riya' }), /^Riya invited you to ICONIK[\s\S]*Message ICONIK with the code ICK-ABCDEF/);
});

test('colour analysis requests are recognised without a code', () => {
  assert.equal(asksForColourAnalysis('Hi! I want my free colour analysis'), true);
  assert.equal(asksForColourAnalysis('can you do my color analysis?'), true);
  assert.equal(asksForColourAnalysis('what colours suit me'), true);
  assert.equal(asksForColourAnalysis('hi'), false);
  assert.equal(asksForColourAnalysis('I need a shirt'), false);
});

test('colour card: only a complete analysis renders, text is escaped, swatch text stays readable', () => {
  const best = ['#8B4513', '#556B2F', '#C19A6B', '#800020', '#D2691E', '#F5DEB3', '#2F4F4F', '#B8860B']
    .map((hex, index) => ({ name: `Colour ${index}`, hex }));
  const analysis = parseColourAnalysis({
    season: 'Deep Autumn', undertone: 'warm', depth: 'deep', contrast: 'high', metal: 'gold',
    best_colours: [...best, { name: 'Bad', hex: 'red' }],
    neutrals: [{ name: 'Chocolate', hex: '#3E2723' }],
    avoid_colours: [{ name: '<b>Icy pink</b>', hex: '#F8BBD0' }],
  }, 'Riya');
  assert.ok(analysis);
  assert.equal(analysis.best.length, 8, 'invalid hex values are dropped, max 8');
  const html = colourCardHtml(analysis, '5 Oct 2026');
  assert.match(html, /Riya, you're a/);
  assert.match(html, /Deep Autumn/);
  assert.match(html, /Warm undertone/);
  assert.match(html, /&lt;b&gt;Icy pink&lt;\/b&gt;/);
  assert.match(html, /Gold/);
  assert.equal(parseColourAnalysis({ season: 'Deep Autumn', undertone: 'warm', best_colours: best.slice(0, 3) }, null), null);
  assert.equal(readableOn('#F5DEB3'), '#1E1A16');
  assert.equal(readableOn('#2F4F4F'), '#FFFFFF');
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
  assert.match(instructions, /THE FREE COLOUR ANALYSIS/);
  assert.match(instructions, /close selfie/);
  assert.match(instructions, /send_colour_card/);
  assert.match(instructions, /Shopping runs left this month: 1/);
  assert.match(instructions, /nearly out/);
  assert.match(instructions, /Invites left: 3/);
  assert.doesNotMatch(instructions, /FIRST CONVERSATION/);
  const onboarded = buildAgentInstructions({
    line: 'woman', firstName: 'Riya', today: '2026-10-05', profile: { best_colours: ['rust'], season: 'Deep Autumn' }, reportUrl: null, memoryText: '',
    events: [], lookActivity: '', firstConversation: false, canShowOutfitImages: false, tier: 'free', runsLeft: 3, invitesLeft: 3,
  });
  assert.match(onboarded, /already have their Colour Card/);
  assert.doesNotMatch(onboarded, /close selfie/);
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
      { code: 'ICK-TEAM01', owner_client_id: null, uses: 1, max_uses: 50, note: 'campaign: Colour reel', created_at: daysAgo(20) },
    ],
    redemptions: [
      { code: 'ICK-TEAM01', client_id: 'a', created_at: daysAgo(15) },
      { code: 'ICK-AAAAAA', client_id: 'b', created_at: daysAgo(14) },
    ],
    waitlist: [{ status: 'waiting', created_at: daysAgo(2) }, { status: 'joined', created_at: daysAgo(16) }],
    colourCards: [{ client_id: 'a', created_at: daysAgo(15) }],
    inviteShares: [{ client_id: 'a', created_at: daysAgo(15) }],
    clientsInviteCodes: [{ id: 'a', invite_code_used: 'ICK-TEAM01' }, { id: 'b', invite_code_used: 'ICK-AAAAAA' }],
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
  assert.deepEqual(data.funnel.map(step => step.value), [2, 1, 1, 1, 1, 1]);
  assert.equal(data.totals.colourCardsTotal, 1);
  assert.deepEqual(data.campaigns, [{ name: 'Colour reel', code: 'ICK-TEAM01', joined: 1, colourCards: 1, hunted: 1, friendsBrought: 1 }]);
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

test('opener messages get the instant selfie ask; real questions go to the model', () => {
  assert.equal(isOpenerMessage('Hi ICONIK! I want my free colour analysis 🎨 ICK-6QNVGB'), true);
  assert.equal(isOpenerMessage('Hi ICONIK! I want my free colour analysis \uFFFD ICK-6QNVGB'), true);
  assert.equal(isOpenerMessage('Hi ICONIK! My invite code is ICK-ABCDEF'), true);
  assert.equal(isOpenerMessage('hii'), true);
  assert.equal(isOpenerMessage('Hello iconik 👋'), true);
  assert.equal(isOpenerMessage('colour analysis'), true);
  assert.equal(isOpenerMessage('what colours suit me for my sister\'s sangeet?'), false);
  assert.equal(isOpenerMessage('Hi, I need a lehenga for a wedding next month'), false);
  assert.match(selfieAskMessage('Riya'), /^Hey Riya 👋/);
  assert.doesNotMatch(selfieAskMessage(null), /code|link/i);
});

test('upcoming moments: Diwali, yearly dates and wedding season', () => {
  const october = upcomingMoments('2026-10-05');
  assert.match(october[0], /^Diwali \(8 Nov, in 34 days\)/);
  assert.ok(october.some(line => line.startsWith('Wedding season')));
  const december = upcomingMoments('2026-12-20', 30);
  assert.deepEqual(december.slice(0, 2).map(line => line.split(' (')[0]), ['Christmas', "New Year's Eve"]);
  assert.ok(!december.some(line => line.startsWith('Diwali')));
  assert.ok(upcomingMoments('2027-01-20', 30).some(line => line.startsWith("Valentine's Day")));
  assert.deepEqual(upcomingMoments('2026-06-01'), []);
  assert.deepEqual(upcomingMoments('not a date'), []);
});

test('the invite unlocks the Face Analysis at 3 friends, with progress along the way', () => {
  const limits = { ...FREE_LIMITS, faceUnlockFriends: 3, referralBonus: 2 };
  assert.equal(faceAnalysisUnlocked(2, limits), false);
  assert.equal(faceAnalysisUnlocked(3, limits), true);
  assert.match(inviteUnlockIntro(0, limits), /more photo checks[\s\S]*3 friends also unlock your Face Analysis[\s\S]*the link is for them/);
  assert.doesNotMatch(inviteUnlockIntro(0, limits), /so far/);
  assert.match(inviteUnlockIntro(1, limits), /\(1\/3 so far\)/);
  assert.doesNotMatch(inviteUnlockIntro(3, limits), /Face Analysis/);
  assert.match(friendJoinedMessage(1, limits), /photo checks[\s\S]*1\/3: 2 more/);
  assert.match(friendJoinedMessage(3, limits), /Face Analysis is unlocked/);
  assert.match(friendJoinedMessage(4, limits), /Another friend/);
  assert.match(ownInviteReply(1, limits), /your own invite link[\s\S]*1\/3/);
  assert.match(ownInviteReply(3, limits), /already unlocked/);
});

test('the selfie ask and reminder accept any good light; reminders only in the Indian daytime', () => {
  assert.match(selfieAskMessage(null), /any good light/);
  assert.match(selfieAskMessage(null), /no sunglasses/);
  assert.match(SELFIE_REMINDER_MESSAGE, /selfie/);
  assert.equal(isDaytimeInIndia(new Date('2026-10-05T04:00:00Z')), true); // 9:30 IST
  assert.equal(isDaytimeInIndia(new Date('2026-10-04T20:00:00Z')), false); // 1:30 IST
  assert.equal(isDaytimeInIndia(new Date('2026-10-05T15:20:00Z')), true); // 20:50 IST
  assert.equal(isDaytimeInIndia(new Date('2026-10-05T15:40:00Z')), false); // 21:10 IST
});

test('next-day follow-ups go late in the window, in the daytime, or in the last evening slot', () => {
  const at = (iso: string) => new Date(iso);
  // Last message 10:01 IST: 19h later is 5am, so it goes in the evening slot (20:30-21:00 IST) instead.
  const morning = at('2026-10-05T04:31:00Z');
  assert.equal(followUpDue(morning, at('2026-10-05T14:45:00Z')), false); // 20:15 IST, can still wait
  assert.equal(followUpDue(morning, at('2026-10-05T15:05:00Z')), true); // 20:35 IST, last chance
  assert.equal(followUpDue(morning, at('2026-10-05T23:31:00Z')), false); // 5:01 IST, night
  // Last message 15:00 IST: 19h later is 10am next day — daytime, so then.
  const afternoon = at('2026-10-05T09:30:00Z');
  assert.equal(followUpDue(afternoon, at('2026-10-05T15:05:00Z')), false); // evening, but tomorrow morning is still in the window
  assert.equal(followUpDue(afternoon, at('2026-10-06T04:31:00Z')), true); // 10:01 IST, 19h
  assert.equal(followUpDue(afternoon, at('2026-10-06T09:00:00Z')), false); // 23.5h, window closed
});

test('photo checks: a monthly allowance from the Colour Card, more per friend, and the share ask only when used up', () => {
  const limits = { ...FREE_LIMITS, monthlyPhotoChecks: 5, photoChecksPerFriend: 5, faceUnlockFriends: 3, referralBonus: 2 };
  assert.equal(photoCheckAllowance(0, limits), 5);
  assert.equal(photoCheckAllowance(2, limits), 15);
  const now = new Date('2026-10-20T06:00:00Z');
  // Card this month: count from the card. Card last month: count from 1 Oct (IST).
  assert.equal(photoChecksCountFrom('2026-10-05T10:00:00Z', now).toISOString(), '2026-10-05T10:00:00.000Z');
  assert.equal(photoChecksCountFrom('2026-09-12T10:00:00Z', now).toISOString(), '2026-09-30T18:30:00.000Z');
  assert.equal(photoChecksCountFrom(null, now).toISOString(), '2026-09-30T18:30:00.000Z');
  const ask = outOfPhotoChecksMessage(5, true, 0, limits);
  assert.match(ask, /5 free photo checks for this month used up[\s\S]*5 more photo checks a month[\s\S]*the link is for them/);
  assert.match(outOfPhotoChecksMessage(5, false, 0, limits), /reset on the 1st/);
  assert.doesNotMatch(outOfPhotoChecksMessage(5, false, 0, limits), /link/);
  assert.match(stillOutOfPhotoChecksMessage(limits), /adds 5 more/);
});
