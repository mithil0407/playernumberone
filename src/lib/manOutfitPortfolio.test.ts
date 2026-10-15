import test from 'node:test';
import assert from 'node:assert/strict';
import { getManColourInfo, isManColourAvoided, readManClientColouring, scoreManColourSuitability, findManColourMentions } from './manOutfitColour';
import { buildManRecommendationProfile, computeManContextSplit } from './manRecommendationProfile';
import {
  cleanManAccessories,
  getManOutfitLibrary,
  isManVagueLook,
  manFootwearClash,
  getManOutfitLibraryVersion,
  getManOutfitPrimaryColourFamily,
  getManPortfolioCandidates,
  isManBlackLed,
  manPortfolioLeadCap,
  planManPortfolioRoles,
  selectManOutfitLibraryPicks,
} from './manOutfitLibrary';
import { buildManHeadStylistPrompt, orderManPortfolioChoices, parseManHeadStylistChoices } from './manHeadStylistPrompt';
import { findManPortfolioVarietyIssues } from './manReportQa';
import type { ClassificationResult } from './manReportGenerator';

const now = new Date('2026-10-10T12:00:00Z');

/** A warm-autumn man who carries weight on his hips and thighs, minimal and classic, from the October 2026 intake. */
const classification = {
  client: { location_region: 'Canada / USA', height_category: 'Tall Average', primary_goal: 'Dress better for my body shape' },
  body: { silhouette_type: 'Triangle', fat_storage_zone: 'Hips and thighs', highlight_zone: 'None', minimise_zone: 'Hips and thighs', fit_directive: 'Relaxed through the seat and thigh', height_adjustment: '', silhouette_rules: [], avoid_cuts: ['Skinny trousers'] },
  face: { face_shape: 'Oval', feature_type: 'Angular', hairstyle_recommendations: [], facial_hair_recommendations: '', eyewear_shapes: [] },
  colour: {
    season: 'Warm Autumn', undertone: 'Warm', skin_tone_depth: 'Wheatish',
    primary_palette: [{ name: 'Olive Green', hex: '', usage: '' }, { name: 'Camel', hex: '', usage: '' }, { name: 'Burgundy', hex: '', usage: '' }, { name: 'Rust', hex: '', usage: '' }, { name: 'Forest green', hex: '', usage: '' }],
    neutral_base_colours: [{ name: 'Dark chocolate brown', hex: '' }, { name: 'Charcoal', hex: '' }],
    accent_colours: [{ name: 'Burgundy', hex: '' }, { name: 'Rust', hex: '' }],
    colours_to_avoid: [{ name: 'Icy blue', hex: '', reason: '' }, { name: 'Optic white', hex: '', reason: '' }],
    pattern_guidance: '', fabric_tone_guidance: '',
  },
  style_brief: { primary_brief: '', aesthetic_direction: 'Dark, clean, minimal and polished.', tribes: ['Old Money', 'Off Duty'], register: 'Dressed down', expression: 'Minimal', structure_level: 'Fluid', anti_preferences: 'No vests, white trousers, bandhgalas.', style_blocker: 'Does not know his body', key_aspiration: 'Polished and easy' },
  outfit_split: { total: 20, categories: [] },
} as unknown as ClassificationResult;

const intake = {
  style_tribes: 'old_money,off_duty',
  style_pole_structure: 'fluid',
  style_pole_expression: 'minimal',
  style_pole_tone: 'classic',
  style_pole_register: 'dressed_down',
  white_test: 'both',
  style_profile: {
    version: 1, city: 'Augusta', occasion: 'none', dress_code: 'casual', age_range: '35_44',
    week: { office: 0, smart: 3, evening: 2, relaxed: 3 },
    experimentation: 7, colour_boldness: 5,
    never_pieces: ['vest', 'white_trousers', 'bandhgala', 'caps', 'bags'],
    taste: { 201: 'try', 206: 'never', 209: 'try', 225: 'try', 249: 'never', 251: 'love', 258: 'never', 283: 'love', 299: 'try', 301: 'never', 304: 'try', 343: 'never' },
  },
};

const v5 = { ...classification, recommendation_profile: buildManRecommendationProfile(intake, undefined, now) } as ClassificationResult;

test('new profiles use the v5 portfolio picker; profiles built before it keep v4', () => {
  assert.equal(getManOutfitLibraryVersion(v5), 'v5-portfolio');
  const older = { ...v5.recommendation_profile! };
  delete older.picker;
  assert.equal(getManOutfitLibraryVersion({ recommendation_profile: older }), 'v4-taste-led');
  assert.equal(getManOutfitLibraryVersion({}), 'v3-board-first');
});

test('about one safe look in five; more stretch for a man who likes to experiment; every occasion keeps a signature', () => {
  const split: Array<[ReturnType<typeof computeManContextSplit>[number][0], number]> = [['Office / Formal', 5], ['Smart Casual', 5], ['Evening Wear', 5], ['Relaxed Casual', 5]];
  const count = (slots: ReturnType<typeof planManPortfolioRoles>, role: string) => slots.filter(slot => slot.role === role).length;
  const middle = planManPortfolioRoles(split, 5);
  assert.deepEqual([count(middle, 'anchor'), count(middle, 'signature'), count(middle, 'stretch')], [4, 12, 4]);
  const bold = planManPortfolioRoles(split, 8);
  assert.ok(count(bold, 'anchor') < 4 && count(bold, 'stretch') > 4);
  const careful = planManPortfolioRoles(split, 2);
  assert.ok(count(careful, 'anchor') > 4 && count(careful, 'stretch') >= 1);
  for (const [context] of split) {
    assert.equal(middle.filter(slot => slot.context === context)[0].role, 'signature', `${context} opens on a signature look`);
  }
});

test('colour is judged by depth and brightness: a warm palette does not shut out blues, but icy pastels still fail', () => {
  const warm = readManClientColouring(classification.colour, 'both');
  const score = (name: string) => scoreManColourSuitability(getManColourInfo(name)!, warm);
  assert.ok(score('rust') > score('navy'), 'one of his colours beats a neutral');
  assert.ok(score('navy') >= 0.3 && score('charcoal') >= 0.3, 'neutrals are safe, not best');
  assert.ok(score('navy') < 0.5, 'a neutral never scores as his best colour');
  assert.ok(score('deep teal') >= 0.35 && score('slate blue') >= 0.35, 'deep and muted cool colours stay open to a warm man');
  assert.ok(score('pale pink') < 0.2, 'a pale cool pastel is a poor colour near warm skin');
  assert.equal(score('pale blue'), -1, '"avoid icy blue" still blocks pale blues');
  assert.ok(score('cobalt') > -1 && score('mid-blue') > -1, '…but not every blue');
});

test('avoid list: a qualified colour rules out only those shades', () => {
  const client = readManClientColouring({
    season: 'Warm Autumn',
    colours_to_avoid: [{ name: 'Icy blue' }, { name: 'Neon yellow' }, { name: 'Stark white' }, { name: 'Pastel pink' }, { name: 'Black' }],
  });
  const avoided = (name: string) => isManColourAvoided(getManColourInfo(name)!, client);
  assert.ok(avoided('pale blue') && avoided('powder blue'));
  assert.ok(!avoided('navy') && !avoided('slate blue') && !avoided('cobalt'));
  assert.ok(avoided('bright yellow') && !avoided('mustard') && !avoided('gold'));
  assert.ok(avoided('optic white') && !avoided('off-white') && !avoided('ivory'));
  assert.ok(avoided('pale pink') && !avoided('dusty rose'));
  assert.ok(avoided('black') && avoided('dark charcoal') === false);
});

test('v5 portfolio for a hips-and-thighs man: dark plain bottoms, no shorts, no colour leading more than three looks', () => {
  const picks = selectManOutfitLibraryPicks(v5, undefined, now);
  assert.equal(picks.length, 20);
  assert.deepEqual(picks.map(pick => pick.entry.context), computeManContextSplit(v5.recommendation_profile).flatMap(([context, count]) => Array(count).fill(context)));
  for (const pick of picks) {
    assert.doesNotMatch(pick.entry.bottom, /\bshorts\b/i, `#${pick.entry.id} has shorts`);
    assert.doesNotMatch(pick.entry.bottom, /\b(white|cream|ivory)\b/i, `#${pick.entry.id} puts light colour on his legs`);
    assert.doesNotMatch(pick.entry.footwear, /flip-flop/i);
  }
  const leads = new Map<string, number>();
  for (const pick of picks) {
    const layer = /^(none|no layer)\b/i.test(pick.entry.layer.trim()) ? '' : pick.entry.layer;
    const family = findManColourMentions(layer || pick.entry.top)[0]?.info.family;
    if (family) leads.set(family, (leads.get(family) ?? 0) + 1);
  }
  assert.ok([...leads.values()].every(count => count <= manPortfolioLeadCap(20)), JSON.stringify([...leads]));
  assert.ok(picks.filter(pick => isManBlackLed(pick.entry)).length <= 4);
  assert.deepEqual(
    ['anchor', 'signature', 'stretch'].map(role => picks.filter(pick => pick.role === role).length),
    ['anchor', 'signature', 'stretch'].map(role => planManPortfolioRoles(computeManContextSplit(v5.recommendation_profile), 7).filter(slot => slot.role === role).length),
  );
});

test('minimal does not mean plain: most of a minimal man\'s looks still carry a colour or a texture near the face', () => {
  const picks = selectManOutfitLibraryPicks(v5, undefined, now);
  const interesting = picks.filter(pick => {
    const layer = /^(none|no layer)\b/i.test(pick.entry.layer.trim()) ? '' : pick.entry.layer;
    const nearFace = findManColourMentions(`${layer} ${pick.entry.top}`).map(mention => mention.info);
    return nearFace.some(info => info.loudness >= 1) || /suede|knit|leather|bomber|overshirt|jacket|tweed/i.test(`${layer} ${pick.entry.top}`);
  });
  assert.ok(interesting.length >= 12, `${interesting.length} of 20`);
});

test('head stylist: brief carries his taste and the rules; answers that break a rule are dropped', () => {
  const { slots, candidates } = getManPortfolioCandidates(v5, undefined, now);
  const prompt = buildManHeadStylistPrompt({ classification: v5, slots, candidates, climateLabel: 'temperate', maxPerLeadFamily: 3 });
  assert.match(prompt, /LOVED: Dark and sharp/);
  assert.match(prompt, /REJECTED: Colour on the legs/);
  assert.match(prompt, /"Minimal" means calm and coherent, NOT plain/);
  assert.match(prompt, /hips and thighs/);
  assert.match(prompt, /Slot 20 — /);
  for (const [, list] of candidates) assert.ok(list.every(option => !/\bshorts\b/i.test(option.entry.bottom)));

  const smart = candidates.get('Smart Casual')!;
  const smartSlots = slots.map((slot, index) => ({ slot, number: index + 1 })).filter(item => item.slot.context === 'Smart Casual');
  const office = candidates.get('Office / Formal')!;
  const answer = JSON.stringify({
    outfits: [
      { slot: smartSlots[0].number, id: smart[0].entry.id, why: 'good' },
      { slot: smartSlots[1].number, id: smart[0].entry.id, why: 'used twice' },
      { slot: smartSlots[2].number, id: office.find(option => !smart.some(other => other.entry.id === option.entry.id))!.entry.id, why: 'wrong occasion' },
      { slot: 99, id: smart[1].entry.id, why: 'no such slot' },
    ],
  });
  const { choices, dropped } = parseManHeadStylistChoices(`\`\`\`json\n${answer}\n\`\`\``, slots, candidates, 3);
  assert.deepEqual(choices.map(choice => choice.id), [smart[0].entry.id]);
  assert.equal(dropped.length, 3);
});

test('head stylist pins flow through the picker in their slots', () => {
  const { slots, candidates } = getManPortfolioCandidates(v5, undefined, now);
  const evening = slots.findIndex(slot => slot.context === 'Evening Wear') + 1;
  const choice = candidates.get('Evening Wear')!.at(-1)!.entry.id;
  const picks = selectManOutfitLibraryPicks(v5, getManOutfitLibrary(), now, '', { pinned: { [String(evening)]: choice } });
  assert.equal(picks[evening - 1].entry.id, choice);
});

test('variety check catches a uniform office block, a flat evening and neighbouring tops', () => {
  const shirt = (number: number, top: string, context = 'Office / Formal') => ({ number, context, top, layer: 'None', bottom: 'Grey tailored trousers', footwear: 'Brown loafers' });
  const issues = findManPortfolioVarietyIssues([
    shirt(1, 'Blue striped shirt'), shirt(2, 'White poplin shirt'), shirt(3, 'Pale blue shirt'), shirt(4, 'Navy shirt'),
    shirt(5, 'Black knit polo', 'Evening Wear'), shirt(6, 'Burgundy crewneck', 'Evening Wear'), shirt(7, 'Black shirt', 'Evening Wear'), shirt(8, 'Grey knit', 'Evening Wear'),
  ]);
  const codes = issues.map(issue => issue.code);
  assert.ok(codes.includes('silhouette_context_cap'));
  assert.ok(codes.includes('evening_statement_quota'));
  assert.ok(codes.includes('evening_no_layer_cap'));
  assert.deepEqual(issues.find(issue => issue.code === 'consecutive_top_colour')?.outfits, [3, 4]);
});

test('reordering an occasion separates neighbouring colours and keeps each look with its role and reason', () => {
  const { slots, candidates } = getManPortfolioCandidates(v5, undefined, now);
  const entries = new Map(getManOutfitLibrary().map(entry => [entry.id, entry]));
  const library = getManOutfitLibrary();
  const byTop = (family: string) => library.filter(entry => getManOutfitPrimaryColourFamily(entry.top) === family && /^(none|no layer)$/i.test(entry.layer.trim()));
  const blues = byTop('blue');
  const others = library.filter(entry => !['blue', null].includes(getManOutfitPrimaryColourFamily(entry.top)) && /^(none|no layer)$/i.test(entry.layer.trim()));
  // Fill every slot, with the first occasion's blues bunched together.
  const first = slots.filter(slot => slot.context === slots[0].context).length;
  const used = [...blues.slice(0, 2), ...others.slice(0, slots.length - 2)];
  const choices = slots.map((slot, index) => ({ slot: index + 1, id: used[index].id, why: `look ${used[index].id}`, role: slot.role }));
  assert.ok(first >= 3);
  const ordered = orderManPortfolioChoices(choices, slots, entries);
  const tops = ordered.slice(0, first).map(choice => getManOutfitPrimaryColourFamily(entries.get(choice.id)!.top));
  for (let index = 1; index < tops.length; index += 1) assert.ok(!(tops[index] === 'blue' && tops[index - 1] === 'blue'), tops.join(','));
  for (const choice of ordered) {
    const original = choices.find(item => item.id === choice.id)!;
    assert.equal(choice.why, original.why);
    assert.equal(choice.role, original.role);
  }
  void candidates;
});

test('shoes, vague looks and props: sneakers stay with denim, photo captions never reach the shortlist, totes and caps are opt-in', () => {
  assert.ok(manFootwearClash({ context: 'Smart Casual', bottom: 'Mid-grey high-rise single-pleat tailored trousers', footwear: 'White leather low-top sneakers' }));
  assert.ok(manFootwearClash({ context: 'Evening Wear', bottom: 'Black jeans', footwear: 'White sneakers' }));
  assert.ok(!manFootwearClash({ context: 'Relaxed Casual', bottom: 'Blue straight-leg jeans', footwear: 'White leather low-top sneakers' }));
  assert.ok(isManVagueLook({ top: 'Dark shirt', layer: 'Grey-and-black plaid overshirt, worn open', bottom: 'Loose dark trousers' }));
  assert.ok(isManVagueLook({ top: 'Light blue shirt', layer: 'Blue checked blazer', bottom: 'Blue trousers, partly visible' }));
  assert.ok(!isManVagueLook({ top: 'Navy button-front shirt', layer: 'No layer', bottom: 'Grey tailored trousers' }));
  assert.equal(cleanManAccessories('Dark brown leather belt; tan and black structured tote; sunglasses', v5.recommendation_profile), 'Dark brown leather belt, sunglasses');
  assert.equal(cleanManAccessories('Silver watch and navy cotton cap', { ...v5.recommendation_profile!, try_pieces: ['caps'] }), 'Silver watch, navy cotton cap');
  const { candidates } = getManPortfolioCandidates(v5, undefined, now);
  for (const [, list] of candidates) for (const { entry } of list) {
    assert.ok(!isManVagueLook(entry) && !manFootwearClash(entry), `#${entry.id} should not be shortlisted`);
  }
});
