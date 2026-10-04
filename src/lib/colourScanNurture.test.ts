import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPausedForCheckoutRecovery,
  isWithinNurtureSendingHours,
  nextNurtureStep,
  nurtureOfferUrl,
  nurtureResultUrl,
  shouldRestartNurture,
  type NurtureScheduleState,
} from './colourScanNurtureModel.ts';
import { buildColourScanNurtureEmail } from './colourScanNurtureEmails.ts';
import {
  approximateColourHex,
  buildAvoidSwatches,
  buildColourProfile,
  colourOutfitIdeas,
  colourSelfReport,
  contrastRule,
  metalsAdvice,
  pickFreeBestShades,
  swapSuggestions,
} from './styleScanColour.ts';

const HOUR = 60 * 60 * 1000;
const NOW = new Date('2026-10-04T08:30:00.000Z'); // 14:00 IST

function row(overrides: Partial<NurtureScheduleState> = {}): NurtureScheduleState {
  return {
    emails_sent: 0,
    enrolled_at: NOW.toISOString(),
    last_email_sent_at: null,
    converted_at: null,
    unsubscribed_at: null,
    ...overrides,
  };
}

const ago = (hours: number) => new Date(NOW.getTime() - hours * HOUR).toISOString();

const classified = {
  undertone_direction: 'warm',
  depth: 'medium-deep',
  contrast: 'soft',
  palette_name: 'warm muted earth',
  base_palette: [
    { name: 'Warm Ivory', hex: '#F3EBDD' },
    { name: 'Camel', hex: '#C19A6B' },
    { name: 'Ink', hex: '#1E1E24' },
    { name: 'Deep Teal', hex: '#1F6F6B' },
    { name: 'Rust', hex: '#A4492A' },
    { name: 'Olive', hex: '#6B6B35' },
    { name: 'Mustard', hex: '#C9A227' },
    { name: 'Wine', hex: '#6A2433' },
    { name: 'Taupe', hex: '#8F7E6E' },
    { name: 'Broken', hex: 'not-a-hex' },
  ],
  accent_palette: [
    { name: 'Marigold', hex: '#E0A030' },
    { name: 'Emerald', hex: '#0F7B55' },
    { name: 'Coral', hex: '#E0735A' },
  ],
  avoid_colours: ['icy lavender near the face', 'stark optic white', 'silver grey'],
};

test('email 1 is due as soon as she enrols, at any hour', () => {
  assert.equal(nextNurtureStep(row(), NOW), 1);
  assert.equal(nextNurtureStep(row(), new Date('2026-10-04T20:00:00.000Z')), 1); // 01:30 IST
});

test('later emails wait for their delay and the minimum gap', () => {
  assert.equal(nextNurtureStep(row({ emails_sent: 1, enrolled_at: ago(23), last_email_sent_at: ago(23) }), NOW), null);
  assert.equal(nextNurtureStep(row({ emails_sent: 1, enrolled_at: ago(25), last_email_sent_at: ago(25) }), NOW), 2);
  // A late email 2 pushes email 3 out by the minimum gap.
  assert.equal(nextNurtureStep(row({ emails_sent: 2, enrolled_at: ago(80), last_email_sent_at: ago(5) }), NOW), null);
  assert.equal(nextNurtureStep(row({ emails_sent: 2, enrolled_at: ago(80), last_email_sent_at: ago(20) }), NOW), 3);
  assert.equal(nextNurtureStep(row({ emails_sent: 5, enrolled_at: ago(241), last_email_sent_at: ago(70) }), NOW), 6);
});

test('the sequence stops when finished, unsubscribed, converted or stale', () => {
  assert.equal(nextNurtureStep(row({ emails_sent: 6, enrolled_at: ago(300) }), NOW), null);
  assert.equal(nextNurtureStep(row({ unsubscribed_at: ago(1) }), NOW), null);
  assert.equal(nextNurtureStep(row({ converted_at: ago(1) }), NOW), null);
  assert.equal(nextNurtureStep(row({ emails_sent: 1, enrolled_at: ago(22 * 24) }), NOW), null);
});

test('emails 2–6 only go out between 8am and 9pm IST', () => {
  assert.equal(isWithinNurtureSendingHours(NOW), true);
  assert.equal(isWithinNurtureSendingHours(new Date('2026-10-04T02:00:00.000Z')), false); // 07:30 IST
  assert.equal(isWithinNurtureSendingHours(new Date('2026-10-04T15:45:00.000Z')), false); // 21:15 IST
});

test('nurture pauses while the checkout-recovery emails are running', () => {
  const recovery = { emails_sent: 1, last_activity_at: ago(30), converted_at: null, unsubscribed_at: null };
  assert.equal(isPausedForCheckoutRecovery(recovery, NOW), true);
  assert.equal(isPausedForCheckoutRecovery({ ...recovery, emails_sent: 3 }, NOW), false);
  assert.equal(isPausedForCheckoutRecovery({ ...recovery, last_activity_at: ago(8 * 24) }, NOW), false);
  assert.equal(isPausedForCheckoutRecovery({ ...recovery, unsubscribed_at: ago(1) }, NOW), false);
  assert.equal(isPausedForCheckoutRecovery(null, NOW), false);
});

test('a returning scanner restarts only after the restart window', () => {
  assert.equal(shouldRestartNurture({ emails_sent: 6, enrolled_at: ago(10 * 24), converted_at: null }, NOW), false);
  assert.equal(shouldRestartNurture({ emails_sent: 6, enrolled_at: ago(46 * 24), converted_at: null }, NOW), true);
  assert.equal(shouldRestartNurture({ emails_sent: 2, enrolled_at: ago(60 * 24), converted_at: ago(5 * 24) }, NOW), false);
});

test('links carry the scan token and email UTMs', () => {
  const result = new URL(nurtureResultUrl('abc.def', 2));
  assert.equal(result.pathname, '/style-scan/result/abc.def');
  assert.equal(result.searchParams.get('utm_content'), 'email_2');
  const offer = new URL(nurtureOfferUrl('abc.def', 5));
  assert.equal(offer.pathname, '/offer-2699');
  assert.equal(offer.searchParams.get('scan'), 'abc.def');
  assert.equal(offer.searchParams.get('utm_medium'), 'colour_scan_nurture');
});

test('the free result leads with real colours, not six neutrals', () => {
  const profile = buildColourProfile({ colour: classified, jewelleryDirection: 'Warm yellow gold in medium scale', makeupColours: ['Terracotta lip', 'Peach cheek', 'Bronze eye'] });
  assert.equal(profile.best.length, 6);
  assert.ok(profile.best.slice(0, 4).every(swatch => !['Warm Ivory', 'Camel', 'Ink', 'Taupe'].includes(swatch.name)));
  assert.equal(profile.accents.length, 2);
  assert.equal(profile.lockedCount, (9 - 6) + (3 - 2)); // nine valid base shades, three accents
  assert.equal(profile.paletteName, 'Warm Muted Earth');
  assert.equal(profile.depth, 'Medium-Deep');
  assert.equal(profile.metals, 'Yellow gold, rose gold and brass');
  assert.deepEqual(profile.lips, ['Terracotta lip', 'Peach cheek']);
  assert.equal(profile.rules.length, 3);
  assert.equal(profile.avoid.length, 3);
});

test('skip colours get a hex even when the model gave none', () => {
  assert.equal(approximateColourHex('icy lavender near the face'), '#C9C0E3');
  assert.equal(approximateColourHex('something unknowable'), null);
  const avoid = buildAvoidSwatches(['neon green', 'stark white'], [{ name: 'Icy lilac', hex: '#cfc6e8' }]);
  assert.deepEqual(avoid.map(swatch => swatch.hex), ['#CFC6E8', '#C6F21B', '#FFFFFF']);
  assert.equal(avoid[2].name, 'Stark white');
});

test('pickFreeBestShades fills with neutrals when colours run short', () => {
  const picked = pickFreeBestShades([{ name: 'Ivory', hex: '#F5F0E8' }, { name: 'Ink', hex: '#111111' }, { name: 'Rust', hex: '#A4492A' }]);
  assert.equal(picked.length, 3);
  assert.equal(picked[0].name, 'Rust');
});

test('contrast and metal rules read the classifier words', () => {
  assert.match(contrastRule('High contrast').title, /bold/);
  assert.match(contrastRule('soft, blended').title, /tonal/);
  assert.match(contrastRule('medium').title, /one light/);
  assert.equal(metalsAdvice('cool'), 'Silver, white gold and platinum');
  assert.equal(metalsAdvice('warm', 'White gold and platinum, delicate'), 'Silver, white gold and platinum');
  assert.equal(metalsAdvice('olive'), 'Both work: soft gold and brushed silver');
});

test('swaps pair each skip colour with a different best shade', () => {
  const profile = buildColourProfile({ colour: classified });
  const swaps = swapSuggestions(profile);
  assert.equal(swaps.length, 3);
  assert.equal(new Set(swaps.map(swap => swap.wear.hex)).size, 3);
});

test('outfit ideas follow her dress code', () => {
  const profile = buildColourProfile({ colour: classified });
  assert.match(colourOutfitIdeas(profile, 'ethnic_leaning')[0].formula, /kurta/);
  assert.match(colourOutfitIdeas(profile, 'western_office')[0].formula, /trousers/);
  assert.equal(colourOutfitIdeas({ best: [], accents: [], metals: '' }, 'mixed').length, 0);
});

test('the self-report is a weak hint and empty when she is unsure', () => {
  assert.equal(colourSelfReport({ jewellery: 'unsure', compliments: 'unsure' }), '');
  assert.match(colourSelfReport({ jewellery: 'gold', sun: 'tans_easily', compliments: 'earthy' }), /weak hint.*gold.*tans easily.*earthy/);
});

test('every nurture email renders with her colours and an unsubscribe link', () => {
  const colour = buildColourProfile({ colour: classified });
  for (const step of [1, 2, 3, 4, 5, 6] as const) {
    const email = buildColourScanNurtureEmail({
      step,
      firstName: 'Priya',
      colour,
      upcoming: 'wedding',
      dressCode: 'mixed',
      resultUrl: 'https://www.iconik.pro/style-scan/result/t',
      offerUrl: 'https://www.iconik.pro/offer-2699?scan=t',
      unsubscribeUrl: 'https://www.iconik.pro/colour-scan/unsubscribe?t=u',
    });
    assert.ok(email.subject.length > 5, `step ${step} subject`);
    assert.ok(email.html.includes('colour-scan/unsubscribe?t=u'), `step ${step} unsubscribe`);
    assert.ok(email.text.includes('Unsubscribe: '), `step ${step} text unsubscribe`);
    assert.ok(!/undefined|NaN|\[object/.test(email.html), `step ${step} has no broken values`);
  }
  const first = buildColourScanNurtureEmail({ step: 1, firstName: 'Priya', colour, upcoming: null, dressCode: null, resultUrl: 'r', offerUrl: 'o', unsubscribeUrl: 'u' });
  assert.match(first.subject, /^Priya, your colours are ready$/);
  assert.ok(first.html.includes(colour.best[0].hex));
  const wedding = buildColourScanNurtureEmail({ step: 5, firstName: null, colour, upcoming: 'wedding', dressCode: null, resultUrl: 'r', offerUrl: 'o', unsubscribeUrl: 'u' });
  assert.match(wedding.subject, /wedding/i);
});

test('nurture emails still render without a colour profile', () => {
  for (const step of [1, 2, 3, 4, 5, 6] as const) {
    const email = buildColourScanNurtureEmail({ step, firstName: null, colour: null, upcoming: null, dressCode: null, resultUrl: 'r', offerUrl: 'o', unsubscribeUrl: 'u' });
    assert.ok(!/undefined|NaN|\[object/.test(email.html), `step ${step}`);
  }
});
