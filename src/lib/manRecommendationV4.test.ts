import test from 'node:test';
import assert from 'node:assert/strict';
import { checkManColourLock, findManColourMentions, getLeadingColourPhrase, restoreManSourceColour } from './manOutfitColour';
import {
  buildManOutfitLadder,
  buildManRecommendationProfile,
  computeManContextSplit,
  manPieceMatches,
  MAN_DEFAULT_CONTEXT_SPLIT,
  MAN_TASTE_LOOKS,
  parseManStyleProfileAnswers,
} from './manRecommendationProfile';
import {
  formatManOutfitLibraryForPrompt,
  getManOutfitLibrary,
  getManOutfitLibraryAssignments,
  getManReportClimateProfile,
  manLookPieceText,
  selectManOutfitLibraryPicks,
} from './manOutfitLibrary';
import { findManSection4ColourDrift, restoreManSection4SourceColours } from './manOutfitSourceLock';
import { validateManReportSection4 } from './manReportQa';
import type { ClassificationResult } from './manReportGenerator';

const baseClassification = {
  client: { location_region: 'International — Other', height_category: 'Tall', primary_goal: 'Dress better for my body shape' },
  body: { silhouette_type: 'Rectangle', fat_storage_zone: 'Chest Upper', highlight_zone: 'None', minimise_zone: 'None', fit_directive: 'Fitted', height_adjustment: '', silhouette_rules: [], avoid_cuts: [] },
  face: { face_shape: 'Oval', feature_type: 'Mixed', hairstyle_recommendations: [], facial_hair_recommendations: '', eyewear_shapes: [] },
  colour: {
    season: 'Deep Cool', undertone: 'Cool', skin_tone_depth: 'Dusky',
    primary_palette: [{ name: 'Navy', hex: '#001F5B', usage: '' }, { name: 'Burgundy', hex: '#800020', usage: '' }, { name: 'Pine Green', hex: '#01796F', usage: '' }],
    neutral_base_colours: [{ name: 'Black', hex: '#000000' }, { name: 'Silver Slate', hex: '#708090' }],
    accent_colours: [{ name: 'Emerald', hex: '#50C878' }],
    colours_to_avoid: [{ name: 'Camel', hex: '#C19A6B', reason: '' }, { name: 'Mustard Yellow', hex: '#E1AD01', reason: '' }],
    pattern_guidance: '', fabric_tone_guidance: '',
  },
  style_brief: { primary_brief: '', aesthetic_direction: '', tribes: ['Urban Wear', 'New Boardroom'], register: 'Dressed Down', expression: 'Minimal', structure_level: 'Fluid', anti_preferences: 'Not specified', style_blocker: '', key_aspiration: '' },
  outfit_split: { total: 20, categories: [] },
} as ClassificationResult;

const intake = {
  style_tribes: 'urban_wear,new_boardroom',
  style_pole_structure: 'fluid',
  style_pole_expression: 'minimal',
  style_pole_tone: 'classic',
  style_pole_register: 'dressed_down',
  style_relationship: 'safe_rotation',
  dressing_context: 'business_casual,casual_social',
  white_test: 'bright_white',
};

function withProfile(styleProfile?: unknown, extra: Record<string, string> = {}): ClassificationResult {
  return { ...baseClassification, recommendation_profile: buildManRecommendationProfile({ ...intake, ...extra, style_profile: styleProfile }) };
}

test('colour lock: drifted colours are caught and restored, precise names inside a colour are fine', () => {
  assert.equal(getLeadingColourPhrase('Blue-and-white vertically striped button-front shirt').phrase, 'Blue-and-white');
  assert.equal(checkManColourLock('Red button-front jacket, worn open', 'Burgundy cotton chore jacket — worn open').ok, false);
  assert.equal(checkManColourLock('Cream trousers', 'Ecru high-rise pleated cotton trousers').ok, true);
  assert.equal(checkManColourLock('Blue-and-white striped shirt', 'Slate blue Bengal stripe shirt').ok, false, 'dropping white from a two-colour stripe is drift');
  assert.equal(checkManColourLock('Dark shoes', 'Black leather Derby shoes').ok, true, 'a "dark" source may take any dark colour');
  assert.equal(checkManColourLock('Matching checked suit jacket', 'Navy glen check suit jacket').ok, true, 'a source with no colour locks nothing');
  assert.equal(restoreManSourceColour('Beige bomber jacket, worn open', 'Burgundy matte cotton-twill bomber jacket — worn open'), 'Beige matte cotton-twill bomber jacket — worn open');
  assert.deepEqual(findManColourMentions('Charcoal chalk-stripe suit').map(mention => mention.info.family), ['charcoal'], 'chalk-stripe is a pattern, not white');
});

test('style profile answers are sanitised; unknown values are dropped', () => {
  const answers = parseManStyleProfileAnswers(JSON.stringify({
    experimentation: 14, colour_boldness: '3', dress_code: 'pyjamas', week: { office: 9, evening: 1 },
    taste: { '301': 'love', '999': 'love', '225': 'meh' }, try_pieces: ['kurta', 'jetpack'], never_pieces: ['kurta', 'shorts'],
    city: '  Pune  ', age_range: '35_44',
  }));
  assert.ok(answers);
  assert.equal(answers.experimentation, 10);
  assert.equal(answers.colour_boldness, 3);
  assert.equal(answers.dress_code, undefined);
  assert.deepEqual(answers.week, { office: 3, evening: 1 });
  assert.deepEqual(answers.taste, { '301': 'love' });
  assert.deepEqual(answers.try_pieces, ['kurta']);
  assert.deepEqual(answers.never_pieces, ['shorts'], 'a piece cannot be both try and never');
  assert.equal(answers.city, 'Pune');
  assert.equal(parseManStyleProfileAnswers('not json'), null);
});

test('occasion split follows the week, keeps minimums and always totals 20', () => {
  assert.deepEqual(computeManContextSplit(null), MAN_DEFAULT_CONTEXT_SPLIT);
  for (const week of [
    { office: 3, smart: 0, evening: 0, relaxed: 0 },
    { office: 0, smart: 0, evening: 3, relaxed: 0 },
    { office: 0, smart: 0, evening: 0, relaxed: 0 },
    { office: 1, smart: 3, evening: 2, relaxed: 3 },
  ]) {
    const split = computeManContextSplit(buildManRecommendationProfile({ style_profile: { week } }));
    assert.equal(split.reduce((sum, [, count]) => sum + count, 0), 20, JSON.stringify(week));
    assert.ok(split.every(([context, count]) => count >= (context === 'Smart Casual' ? 2 : 3) && count <= 8), JSON.stringify(split));
  }
  const officeHeavy = computeManContextSplit(buildManRecommendationProfile({ style_profile: { week: { office: 3, smart: 1, evening: 1, relaxed: 1 } } }));
  assert.equal(officeHeavy[0][1], 8);
});

test('the ladder puts most looks at comfort, about a third one step up, and a stretch per bigger occasion', () => {
  const ladder = buildManOutfitLadder([['Office / Formal', 5], ['Smart Casual', 5], ['Evening Wear', 5], ['Relaxed Casual', 5]], 3);
  assert.equal(ladder.length, 20);
  assert.equal(ladder.filter(slot => slot.step === 'stretch').length, 4);
  assert.equal(ladder.filter(slot => slot.step === 'step-up').length, 8);
  assert.ok(ladder.every(slot => slot.targetBoldness >= 3 && slot.targetBoldness <= 5));
});

test('library tags: leather loafers are not streetwear; every taste-test look exists on the board', () => {
  const library = getManOutfitLibrary();
  const loafersOnly = library.find(entry => entry.id === 299);
  assert.ok(loafersOnly && !loafersOnly.tags.includes('urban') && !loafersOnly.tags.includes('statement-jacket'));
  for (const look of MAN_TASTE_LOOKS) {
    const entry = library.find(item => item.id === look.id && item.tier === 'board');
    assert.ok(entry, `taste look ${look.id} is a board look`);
  }
  assert.ok(library.every(entry => entry.boldness >= 1 && entry.boldness <= 5 && entry.tribes.length > 0));
  assert.ok(manPieceMatches('all_black', manLookPieceText(library.find(entry => entry.id === 287)!)));
});

test('v4 picks follow the profile: split, dress code, never pieces, taste test and admin overrides', () => {
  const now = new Date('2026-10-05T12:00:00Z');
  const classification = withProfile({
    version: 1, experimentation: 7, colour_boldness: 7, dress_code: 'business_casual',
    week: { office: 1, smart: 2, evening: 3, relaxed: 3 },
    taste: { '301': 'love', '225': 'never' }, never_pieces: ['shorts'], try_pieces: ['pleated'],
  });
  const picks = selectManOutfitLibraryPicks(classification, undefined, now);
  const split = computeManContextSplit(classification.recommendation_profile);
  assert.equal(picks.length, 20);
  for (const [context, count] of split) assert.equal(picks.filter(pick => pick.entry.context === context).length, count, context);
  assert.ok(!picks.some(pick => /\btie\b/i.test(`${pick.entry.top} ${pick.entry.accessories}`)), 'no ties for business casual');
  assert.ok(!picks.some(pick => /suit jacket/i.test(pick.entry.layer)), 'no suits for business casual');
  assert.ok(!picks.some(pick => pick.entry.id === 225), 'a "not me" taste look is never picked');
  assert.ok(!picks.some(pick => /\bshorts\b/i.test(pick.entry.bottom)), 'never pieces stay out');
  assert.ok(picks.some(pick => pick.entry.id === 301), 'a loved taste look is picked');
  assert.ok(picks.filter(pick => /black/i.test(pick.entry.top.split(' ')[0])).length <= 4, 'black-led looks are capped');
  assert.ok(picks.every(pick => pick.ladder && pick.paletteFit !== undefined));

  const firstEvening = picks.findIndex(pick => pick.entry.context === 'Evening Wear');
  const replaced = picks[firstEvening].entry.id;
  const pinned = Object.fromEntries(picks.map((pick, index) => [String(index + 1), pick.entry.id]).filter(([number]) => Number(number) !== firstEvening + 1));
  const redo = selectManOutfitLibraryPicks(classification, undefined, now, '', { pinned, excluded: [replaced] });
  assert.notEqual(redo[firstEvening].entry.id, replaced, 'the 👎 look is swapped out');
  redo.forEach((pick, index) => { if (index !== firstEvening) assert.equal(pick.entry.id, picks[index].entry.id, `outfit ${index + 1} is kept`); });

  const assignments = getManOutfitLibraryAssignments(classification, undefined, now);
  assert.ok(assignments.every(item => item.ladder && item.boldness));
});

test('v4 prompt locks colours and never asks for the old quotas or recolouring', () => {
  const prompt = formatManOutfitLibraryForPrompt(withProfile({ version: 1, experimentation: 5 }), undefined, new Date('2026-10-05T12:00:00Z'));
  assert.match(prompt, /COLOUR LOCK/);
  assert.match(prompt, /LADDER:/);
  assert.doesNotMatch(prompt, /6\/4\/5\/5|recolour|client's classification always wins/i);
});

test('city answer sets the climate when the region tier says nothing', () => {
  const classification = withProfile({ version: 1, city: 'Singapore' });
  assert.equal(getManReportClimateProfile(classification, new Date('2026-12-10')).mode, 'hot');
  assert.equal(getManReportClimateProfile(withProfile({ version: 1, city: 'Melbourne' }), new Date('2026-07-10')).mode, 'cool');
});

test('QA uses the client split, blocks colour drift during generation and only warns on a stored report', () => {
  const now = new Date('2026-10-05T12:00:00Z');
  const classification = withProfile({ version: 1, week: { office: 1, smart: 1, evening: 3, relaxed: 3 } });
  const assignments = getManOutfitLibraryAssignments(classification, undefined, now);
  const library = getManOutfitLibrary();
  const section = assignments.map(item => {
    const entry = library.find(look => look.id === item.libraryLookId)!;
    return `OUTFIT ${item.outfitNumber} — ${item.context.toUpperCase()}\nTOP: ${entry.top}\nLAYER: ${entry.layer}\nBOTTOM: ${entry.bottom}\nFOOTWEAR: ${entry.footwear}\nACCESSORY: ${entry.accessories}\nOCCASION ANCHOR: Worn where he actually goes, in colours chosen for his deep cool colouring and tall frame.`;
  }).join('\n\n');

  const clean = validateManReportSection4(section, classification, { enforceV2: true, assignments, colourLock: 'block', climateDate: now });
  assert.ok(!clean.issues.some(issue => issue.code === 'context_split'), JSON.stringify(clean.issues.filter(issue => issue.code === 'context_split')));
  assert.ok(!clean.issues.some(issue => issue.code === 'source_colour_drift'));
  assert.ok(!clean.issues.some(issue => issue.code === 'elevated_primary_colour_quota'));
  assert.ok(clean.issues.filter(issue => /consecutive_(top|layer)_colour/.test(issue.code)).every(issue => issue.severity === 'warning'));
  assert.equal(clean.quality?.rubricVersion, 'iconik-men-taste-v4');

  const firstSource = library.find(look => look.id === assignments[0].libraryLookId)!;
  const firstColour = findManColourMentions(firstSource.top)[0];
  assert.ok(firstColour, 'first source top names a colour');
  const recolour = firstColour.info.family === 'wine' ? 'Mustard' : 'Burgundy';
  const drifted = section.replace(`TOP: ${firstSource.top}`, `TOP: ${recolour} cotton poplin shirt — fitted`);
  const sources = new Map(assignments.map(item => [item.outfitNumber, library.find(look => look.id === item.libraryLookId)!]));
  assert.equal(findManSection4ColourDrift(drifted, sources).length, 1);
  const blocked = validateManReportSection4(drifted, classification, { enforceV2: true, assignments, colourLock: 'block', climateDate: now });
  assert.ok(blocked.issues.some(issue => issue.code === 'source_colour_drift' && issue.severity === 'error'));
  const stored = validateManReportSection4(drifted, classification, { enforceV2: true, assignments, colourLock: 'warn', climateDate: now });
  assert.ok(stored.issues.some(issue => issue.code === 'source_colour_drift' && issue.severity === 'warning'));

  const restored = restoreManSection4SourceColours(drifted, sources);
  assert.equal(findManSection4ColourDrift(restored, sources).length, 0, 'the generator puts the colour back');
});

test('a groom gets the wedding functions first and a smaller everyday set; QA accepts Indian wedding wear', () => {
  const groom = buildManRecommendationProfile({ ...intake, dressing_context: 'indian_occasions', free_text_note: 'Tell me which dress suit on my body in my wedding' });
  assert.equal(groom.occasion_mode, 'groom');
  const split = computeManContextSplit(groom);
  assert.equal(split.reduce((sum, [, count]) => sum + count, 0), 20);
  assert.deepEqual(split.slice(0, 5).map(([context]) => context), ['Haldi', 'Mehendi', 'Sangeet', 'Wedding Ceremony', 'Reception']);
  assert.equal(buildManRecommendationProfile({ style_profile: { version: 1, occasion: 'attending_wedding' } }).occasion_mode, 'wedding_guest');
  assert.equal(buildManRecommendationProfile({ ...intake }).occasion_mode, 'everyday');

  const now = new Date('2026-10-06T12:00:00Z');
  const classification = { ...baseClassification, recommendation_profile: groom } as ClassificationResult;
  const picks = selectManOutfitLibraryPicks(classification, undefined, now);
  const wedding = picks.filter(pick => pick.entry.context === 'Wedding Ceremony');
  assert.equal(wedding.length, 3);
  assert.ok(wedding.every(pick => /sherwani|achkan|bandhgala/i.test(`${pick.entry.top} ${pick.entry.layer}`)), 'the wedding looks are groom wear');

  const assignments = getManOutfitLibraryAssignments(classification, undefined, now);
  const library = getManOutfitLibrary();
  const section = assignments.map(item => {
    const entry = library.find(look => look.id === item.libraryLookId)!;
    const top = item.context === 'Wedding Ceremony' ? `${entry.top} in matte raw silk with a mandarin collar` : entry.top;
    return `OUTFIT ${item.outfitNumber} — ${item.context.toUpperCase()}\nTOP: ${top}\nLAYER: ${entry.layer}\nBOTTOM: ${entry.bottom}\nFOOTWEAR: ${entry.footwear}\nACCESSORY: ${entry.accessories}\nOCCASION ANCHOR: Worn at the ${item.context.toLowerCase()}; the long line keeps his midsection smooth and the colour suits him.`;
  }).join('\n\n');
  const qa = validateManReportSection4(section, classification, { enforceV2: true, assignments, colourLock: 'block', climateDate: now });
  const errors = qa.issues.filter(issue => issue.severity === 'error');
  assert.deepEqual(errors, [], 'raw silk and band collars are fine in wedding looks');
});
