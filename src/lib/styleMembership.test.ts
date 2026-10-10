import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_PLAN,
  MEMBERSHIP_PLANS,
  cohortOpen,
  membershipContentIds,
  perDay,
  priceMembershipOrder,
  renewalTerms,
  rupees,
  subscriptionSavingPercent,
} from './styleMembershipConfig.ts';
import {
  SEASON_PALETTES,
  SHAPES,
  dnaChips,
  likelySeason,
  mirrorFor,
  readUndertone,
  resolveShape,
  resultLooks,
  SWIPE_LOOKS,
  styleArchetype,
  styleHeadline,
  styleProfile,
  unlockedLook,
  upcomingLabel,
  type QuizAnswers,
} from './styleMembershipLogic.ts';
import {
  CHAPTERS,
  QUIZ_SCREENS,
  chapterProgress,
  nextScreenId,
  previousScreenId,
  screenAnswered,
  screenById,
  screensBeforeGate,
  visibleScreens,
} from './styleMembershipQuiz.ts';
import { dueSteps, membershipSchedule } from './styleMembershipSchedule.ts';
import { createMemberCode, hashToken, memberWhatsappLink, parseMemberCode } from './styleMembershipTokens.ts';
import { isActiveMember, memberLiteProfile } from './styleMembershipAgentProfile.ts';
import { isMembershipWebhookEvent } from './styleMembershipWebhookRouting.ts';
import { SEASONS } from './agentColourSeason.ts';

const SAMPLE: QuizAnswers = {
  age: '35-44',
  dressFor: ['office', 'weddings'],
  shape: 'pear',
  skinTone: 'wheatish',
  metal: 'gold',
  veins: 'green',
  compliments: ['mustard'],
  swipes: { 'blazer-column': 'love', 'kurta-shrug': 'love', 'leopard-magenta': 'skip' },
  budgetOccasion: '3-6k',
  size: 'M',
  comingUp: ['wedding'],
  weddingFunctions: '2-3',
};

// ── Prices (one config file) ────────────────────────────────────────────────

test('the blueprint prices: ₹1,799 a quarter pre-selected, ₹2,999 one-time, ₹1,499 founding', () => {
  assert.equal(DEFAULT_PLAN, 'subscribe');
  assert.equal(MEMBERSHIP_PLANS.subscribe.pricePaise, 179_900);
  assert.equal(MEMBERSHIP_PLANS.one_time.pricePaise, 299_900);
  assert.equal(MEMBERSHIP_PLANS.one_time.renewalPaise, null);
  assert.equal(MEMBERSHIP_PLANS.founding.pricePaise, 149_900);
  assert.equal(MEMBERSHIP_PLANS.founding.renewalPaise, 179_900);
  assert.equal(subscriptionSavingPercent(), 40);
  assert.equal(perDay(179_900), '₹20');
  assert.equal(perDay(299_900), '₹33');
  assert.equal(rupees(179_900), '₹1,799');
});

test('bumps are added in a fixed order and unknown ids are ignored', () => {
  const order = priceMembershipOrder('subscribe', ['blueprint', 'festive_pack', 'nonsense']);
  assert.deepEqual(order.bumps.map(bump => bump.id), ['festive_pack', 'blueprint']);
  assert.equal(order.totalPaise, 179_900 + 49_900 + 199_900);
  assert.deepEqual(membershipContentIds('subscribe', ['festive_pack']), ['iconik_style_membership_subscribe', 'iconik_style_membership_bump_festive_pack']);
  assert.throws(() => priceMembershipOrder('lifetime' as never, []));
});

test('renewal terms say the price, the reminder and how to cancel; one-time says it does not renew', () => {
  const terms = renewalTerms(MEMBERSHIP_PLANS.subscribe);
  assert.match(terms, /₹1,799 every 3 months/);
  assert.match(terms, /reminder 3 days before/);
  assert.match(terms, /Cancel anytime/);
  assert.match(renewalTerms(MEMBERSHIP_PLANS.one_time), /does not renew/);
  assert.match(renewalTerms(MEMBERSHIP_PLANS.founding), /first 3 months.*₹1,799 every 3 months/);
});

test('the founding cohort closes on its real date', () => {
  assert.equal(cohortOpen(new Date('2026-10-20T12:00:00+05:30')), true);
  assert.equal(cohortOpen(new Date('2026-11-01T00:00:01+05:30')), false);
});

// ── Quiz screens ────────────────────────────────────────────────────────────

test('every screen has a unique URL-safe id and the quiz is about 34 screens to the gate', () => {
  const ids = QUIZ_SCREENS.map(screen => screen.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
  const toGate = screensBeforeGate({ answers: {} });
  assert.ok(toGate >= 34 && toGate <= 40, `screens before the gate: ${toGate}`);
  assert.equal(QUIZ_SCREENS.filter(screen => screen.kind === 'swipe').length, 12);
  assert.deepEqual(CHAPTERS.map(chapter => chapter.id), ['life', 'body', 'colours', 'style', 'shopping', 'coming']);
  for (const chapter of CHAPTERS) assert.ok(QUIZ_SCREENS.some(screen => screen.chapter === chapter.id && screen.kind === 'mirror') || chapter.id === 'coming', `${chapter.id} has a mirror`);
});

test('"Not sure" adds the two quick body questions; a wedding adds the functions question', () => {
  const sure = visibleScreens({ answers: { shape: 'pear' } }).map(screen => screen.id);
  assert.ok(!sure.includes('shoulders-or-hips'));
  const unsure = visibleScreens({ answers: { shape: 'not-sure' } }).map(screen => screen.id);
  assert.ok(unsure.includes('shoulders-or-hips') && unsure.includes('weight-first'));
  assert.equal(nextScreenId('body-shape', { answers: { shape: 'pear' } }), 'show-off');
  assert.equal(nextScreenId('body-shape', { answers: { shape: 'not-sure' } }), 'shoulders-or-hips');
  assert.equal(nextScreenId('coming-up', { answers: { comingUp: ['diwali'] } }), 'building-your-plan');
  assert.equal(nextScreenId('coming-up', { answers: { comingUp: ['wedding'] } }), 'wedding-functions');
  assert.equal(previousScreenId('show-off', { answers: { shape: 'pear' } }), 'body-shape');
});

test('members who paid first skip the WhatsApp gate and end after the selfie', () => {
  assert.equal(nextScreenId('building-your-plan', { answers: {} }), 'whatsapp');
  assert.equal(nextScreenId('building-your-plan', { answers: {}, member: true }), 'selfie');
  assert.equal(nextScreenId('selfie', { answers: {} }), null);
});

test('progress fills chapter by chapter', () => {
  const progress = chapterProgress('skin-tone', { answers: { shape: 'pear' } });
  assert.deepEqual(progress.slice(0, 2).map(chapter => chapter.value), [1, 1]);
  assert.ok(progress[2].value > 0 && progress[2].value < 1);
  assert.deepEqual(progress.slice(3).map(chapter => chapter.value), [0, 0, 0]);
  assert.ok(chapterProgress('whatsapp', { answers: {} }).every(chapter => chapter.value === 1));
});

test('screens need an answer unless optional; swipes need a verdict for their look', () => {
  assert.equal(screenAnswered(screenById('dress-for')!, {}), false);
  assert.equal(screenAnswered(screenById('dress-for')!, { dressFor: ['office'] }), true);
  assert.equal(screenAnswered(screenById('body-changed')!, {}), true);
  assert.equal(screenAnswered(screenById('swipe-waistcoat')!, { swipes: { anarkali: 'love' } }), false);
  assert.equal(screenAnswered(screenById('swipe-waistcoat')!, { swipes: { waistcoat: 'skip' } }), true);
});

// ── What the answers mean ───────────────────────────────────────────────────

test('shape from the two quick questions', () => {
  assert.equal(resolveShape({ shape: 'apple' }), 'apple');
  assert.equal(resolveShape({ shape: 'not-sure', shapeShoulders: 'hips', shapeGain: 'hips' }), 'pear');
  assert.equal(resolveShape({ shape: 'not-sure', shapeShoulders: 'shoulders', shapeGain: 'bust' }), 'inverted-triangle');
  assert.equal(resolveShape({ shape: 'not-sure', shapeShoulders: 'same', shapeGain: 'tummy' }), 'apple');
  assert.equal(resolveShape({ shape: 'not-sure', shapeShoulders: 'same', shapeGain: 'hips' }), 'hourglass');
  assert.equal(resolveShape({ shape: 'not-sure', shapeShoulders: 'same', shapeGain: 'evenly' }), 'rectangle');
  assert.equal(resolveShape({ shape: 'not-sure' }), null);
});

test('undertone: gold + green veins is likely warm, silver + blue likely cool, mixed is neutral', () => {
  assert.deepEqual(readUndertone({ metal: 'gold', veins: 'green' }).label, 'Likely Warm');
  assert.deepEqual(readUndertone({ metal: 'gold' }).label, 'Leaning Warm');
  assert.deepEqual(readUndertone({ metal: 'silver', veins: 'blue' }).undertone, 'cool');
  assert.deepEqual(readUndertone({ metal: 'gold', veins: 'blue' }).undertone, 'neutral');
});

test('every likely season is a season the WhatsApp agent knows, with 6 best colours', () => {
  for (const name of Object.keys(SEASON_PALETTES)) {
    assert.ok((SEASONS as readonly string[]).includes(name), name);
    assert.equal(SEASON_PALETTES[name].best.length, 6);
  }
  assert.equal(likelySeason(SAMPLE)?.name, 'Warm Spring');
  assert.equal(likelySeason({ skinTone: 'deep', metal: 'gold', veins: 'green' })?.name, 'Deep Autumn');
  assert.equal(likelySeason({ skinTone: 'dusky', metal: 'silver', veins: 'blue' })?.name, 'Deep Winter');
  assert.equal(likelySeason({}), null);
});

test('the colour mirror repeats her answers back, as in the blueprint', () => {
  const mirror = mirrorFor('colour', SAMPLE);
  assert.equal(mirror.eyebrow, 'Likely Warm');
  assert.equal(mirror.title, 'You’re most likely a warm season.');
  assert.equal(mirror.body, 'Wheatish skin, gold, mustard compliments. A selfie later will confirm it.');
  assert.equal(mirrorFor('life', SAMPLE).title, 'Office and functions? One wardrobe can do both.');
  assert.match(mirrorFor('shopping', SAMPLE).title, /cupboard/);
  const body = mirrorFor('body', SAMPLE);
  assert.equal(body.pair?.after.image, SHAPES.pear.after.image);
});

test('every swipe comes from a pin on the Pinterest board, and the style profile reads her in detail', async () => {
  const { readFileSync } = await import('node:fs');
  const board = readFileSync(new URL('../../outfitlibrarypinterest.md', import.meta.url), 'utf8');
  assert.equal(SWIPE_LOOKS.length, 12);
  for (const look of SWIPE_LOOKS) assert.ok(board.includes(`**${look.pin}.**`), `pin ${look.pin} is on the board`);
  assert.equal(new Set(SWIPE_LOOKS.map(look => look.wear)).size, 3, 'Indian, Indo-western and western are all tested');

  assert.equal(styleArchetype({}).name, 'Open Explorer');
  const classic = styleProfile({ swipes: { 'blazer-column': 'love', 'kurta-shrug': 'love', 'chambray-blazer': 'love', 'leopard-magenta': 'skip', 'kurta-jacket-jeans': 'skip' } });
  assert.equal(classic.archetype.name, 'Modern Classic');
  assert.equal(classic.wearLine, 'Both Indian and western');
  assert.equal(classic.colourLine, 'Neutrals: black, cream, camel, brown');
  assert.equal(classic.avoidLine, 'Not for you: loud prints and bright colour');
  assert.equal(classic.formulas.length, 3);
  assert.match(styleHeadline(classic), /^Modern Classic, with a \w+ side$/);
  const festive = styleProfile({ swipes: { 'festive-sharara': 'love', anarkali: 'love', 'kurta-shrug': 'love' } });
  assert.ok(['Graceful Traditional', 'Soft Romantic'].includes(festive.archetype.name));
  assert.equal(festive.wearLine, 'Mostly Indian wear');
  assert.equal(styleProfile({ swipes: { 'leopard-magenta': 'love', 'cobalt-blouse': 'love', 'kurta-jacket-jeans': 'love' } }).archetype.name, 'Colour Confident');
});

test('the Style DNA card builds up chip by chip', () => {
  const chips = dnaChips(SAMPLE).map(chip => chip.label);
  assert.deepEqual(chips.slice(0, 5), ['35-44', 'Office + Weddings', 'Pear', 'Wheatish', 'Likely Warm']);
  assert.ok(chips.includes('Size M'));
  assert.ok(chips.includes('Wedding · 3 functions'));
  assert.ok(dnaChips(SAMPLE, 'Warm Autumn').some(chip => chip.label === 'Warm Autumn'));
  assert.equal(upcomingLabel({ comingUp: ['diwali'] }), 'Diwali');
});

test('the result has 20 looks; look 1 matches her shape and skips what she swiped away', () => {
  const looks = resultLooks(SAMPLE);
  assert.equal(looks.length, 20);
  assert.equal(new Set(looks.map(look => look.title)).size, 20);
  assert.ok(looks.some(look => look.title === 'Sangeet'));
  assert.equal(unlockedLook(SAMPLE).image, SHAPES.pear.after.image);
  assert.notEqual(unlockedLook({ swipes: { 'linen-kurta': 'skip' }, skinTone: 'dusky' }).image, '/membership/swipe-linen-kurta.webp');
});

// ── 90 days, tokens, agent hand-off, webhook routing ───────────────────────

test('the 90-day schedule follows the blueprint and the plan', () => {
  const start = new Date('2026-10-10T10:00:00Z');
  const renewing = membershipSchedule(start, { plan: 'subscribe', answers: SAMPLE, hasSelfie: false });
  const ids = renewing.map(step => step.stepId);
  assert.deepEqual(ids, ['handoff', 'selfie', 'first-looks', 'style-plan', 'ask-before-you-buy', 'occasion-plan', 'referral', 'drop-1', 'drop-2', 'recap', 'pre-debit', 'renewal']);
  assert.equal(renewing.find(step => step.stepId === 'renewal')?.dueAt, '2027-01-08T10:00:00.000Z');
  assert.match(renewing.find(step => step.stepId === 'occasion-plan')!.brief, /wedding with 3 functions/);
  const oneTime = membershipSchedule(start, { plan: 'one_time', answers: {}, hasSelfie: true }).map(step => step.stepId);
  assert.ok(!oneTime.includes('selfie') && !oneTime.includes('pre-debit') && !oneTime.includes('renewal'));
  const due = dueSteps(renewing, new Set(['handoff']), new Date('2026-10-12T10:00:00Z')).map(step => step.stepId);
  assert.deepEqual(due, ['selfie', 'first-looks', 'style-plan', 'ask-before-you-buy']);
  for (const step of renewing) assert.doesNotMatch(step.forHer, /\b(she|her)\b/i, step.forHer);
});

test('member codes survive WhatsApp text and are only stored hashed', () => {
  const code = createMemberCode(Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]));
  assert.equal(code, 'ICM-ABCDEFGH');
  assert.equal(parseMemberCode(`Hi ICONIK! My code is ${code.toLowerCase()}`), code);
  assert.equal(parseMemberCode('My invite code is ICK-ABCDEF'), null);
  assert.equal(hashToken(code).length, 64);
  assert.equal(
    memberWhatsappLink('+91 96575 64840', code, 'Meera'),
    `https://wa.me/919657564840?text=${encodeURIComponent(`Hi ICONIK! I'm Meera, I just joined the Style Membership. My code is ${code}`)}`,
  );
  assert.equal(memberWhatsappLink(null, code), null);
});

test('the agent profile carries the membership, the quiz and the schedule; quiz guesses are not colours', () => {
  const schedule = membershipSchedule(new Date('2026-10-10T10:00:00Z'), { plan: 'subscribe', answers: SAMPLE, hasSelfie: false });
  const base = { membershipId: 'm1', plan: 'subscribe' as const, status: 'active', paidAt: '2026-10-10T10:00:00Z', currentPeriodEnd: '2027-01-08T10:00:00Z', autopayStatus: 'not_set_up', bumps: [], answers: SAMPLE, schedule };
  const quizOnly = memberLiteProfile({ ...base, selfieSeason: null });
  assert.equal(quizOnly.best_colours, undefined);
  assert.equal((quizOnly.style_quiz as Record<string, unknown>).body_shape_from_quiz, 'Pear');
  assert.equal(((quizOnly.membership as Record<string, unknown>).schedule as unknown[]).length, schedule.length);
  const withSelfie = memberLiteProfile({ ...base, selfieSeason: 'Warm Autumn' });
  assert.equal(withSelfie.season, 'Warm Autumn');
  assert.equal((withSelfie.best_colours as string[]).length, 6);
});

test('members keep paid limits through a short renewal grace, then fall back to free', () => {
  const profile = { membership: { status: 'active', paid_until: '2027-01-08T10:00:00Z' } };
  assert.equal(isActiveMember(profile, new Date('2027-01-01T00:00:00Z')), true);
  assert.equal(isActiveMember(profile, new Date('2027-01-12T00:00:00Z')), true);
  assert.equal(isActiveMember(profile, new Date('2027-01-20T00:00:00Z')), false);
  assert.equal(isActiveMember({ membership: { status: 'cancelled', paid_until: '2027-01-08T10:00:00Z' } }), false);
  assert.equal(isActiveMember({}), false);
});

test('only events marked style_membership are routed away from the Blueprint webhook', () => {
  const ours = { notes: { product: 'style_membership', membership_id: 'm1' } };
  assert.equal(isMembershipWebhookEvent('order.paid', { order: { entity: ours }, payment: { entity: {} } }), true);
  assert.equal(isMembershipWebhookEvent('payment.captured', { payment: { entity: ours } }), true);
  assert.equal(isMembershipWebhookEvent('subscription.halted', { subscription: { entity: ours } }), true);
  assert.equal(isMembershipWebhookEvent('payment_link.paid', { payment_link: { entity: ours } }), true);
  assert.equal(isMembershipWebhookEvent('order.paid', { order: { entity: { notes: { service: 'ICONIK Style Guide' } } } }), false);
  assert.equal(isMembershipWebhookEvent('payment.captured', { payment: { entity: { notes: [] } } }), false);
  assert.equal(isMembershipWebhookEvent('subscription.charged', { subscription: { entity: { notes: { product: 'iconik_man_edit' } } } }), false);
});
