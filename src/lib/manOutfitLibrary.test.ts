import {
  getManOutfitLibrary,
  getManOutfitLibraryAssignments,
  getManReportClimateProfile,
  getManOutfitPrimaryColourFamily,
  parseManOutfitLibrary,
  selectManOutfitLibraryReferences,
  formatManOutfitLibraryForPrompt,
  selectManEditBoardSources,
} from './manOutfitLibrary';
import type { ClassificationResult } from './manReportGenerator';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const classification = {
  client: { location_region: 'India — Tier 1 city', height_category: 'Average', primary_goal: 'Professional' },
  body: { silhouette_type: 'Athletic', fat_storage_zone: '', highlight_zone: '', minimise_zone: '', fit_directive: 'Straight fits', height_adjustment: '', silhouette_rules: [], avoid_cuts: [] },
  face: { face_shape: 'Oval', feature_type: 'Balanced', hairstyle_recommendations: [], facial_hair_recommendations: '', eyewear_shapes: [] },
  colour: { season: 'Cool Deep', undertone: 'Cool', skin_tone_depth: 'Deep', primary_palette: [], neutral_base_colours: [], accent_colours: [], colours_to_avoid: [], pattern_guidance: '', fabric_tone_guidance: '' },
  style_brief: { primary_brief: 'Quiet authority', aesthetic_direction: '', tribes: [], register: '', expression: '', structure_level: '', anti_preferences: '', style_blocker: '', key_aspiration: '' },
  outfit_split: { total: 20, categories: [] },
} as ClassificationResult;

export function runManOutfitLibraryAssertions() {
  const library = getManOutfitLibrary();
  const board = library.filter(entry => entry.tier === 'board');
  const core = library.filter(entry => entry.tier === 'core');
  invariant(board.length === 155, 'parses all 155 board looks');
  invariant(core.length === 100, 'parses all 100 core library looks');
  invariant(core.filter(entry => entry.context === 'Office / Formal').length === 25, 'keeps 25 core office references');
  invariant(board.every(entry => entry.id > 200 && entry.source?.includes('pinterest.com')), 'board looks carry their board number and pin');
  invariant(new Set(library.map(entry => entry.id)).size === library.length, 'board and core ids never collide');
  invariant(board.filter(entry => entry.archetype === 'indian-casual').length === 2, 'recognises the two board kurtas');
  invariant(parseManOutfitLibrary('').length === 0, 'ignores an empty library');
  invariant(library.every(entry => entry.archetype && entry.climateModes.length && entry.silhouetteFamily && entry.bodyFit.length && entry.patternFamily && entry.tags.length), 'every v2 reference has complete semantic metadata');

  const monsoonDate = new Date('2026-07-10T12:00:00.000Z');
  const selected = selectManOutfitLibraryReferences(classification, library, monsoonDate);
  invariant(selected.length === 20, 'selects the required 20 report references');
  invariant(selected.filter(entry => entry.context === 'Office / Formal').length === 6, 'selects six office references');
  invariant(selected.filter(entry => entry.context === 'Smart Casual').length === 4, 'selects four smart casual references');
  invariant(selected.filter(entry => entry.context === 'Evening Wear').length === 5, 'selects five evening references');
  invariant(selected.filter(entry => entry.context === 'Relaxed Casual').length === 5, 'selects five relaxed casual references');
  // Monsoon rules out most board evening looks, so a few slots fall back to the core library.
  invariant(selected.filter(entry => entry.tier === 'board').length >= 15, 'fills most monsoon slots from the board');
  const aprilSelection = selectManOutfitLibraryReferences(classification, library, new Date('2026-04-10T12:00:00.000Z'));
  invariant(aprilSelection.every(entry => entry.tier === 'board'), 'fills every slot from the board when the board can');
  invariant(!selected.some(entry => entry.archetype === 'indian-casual' || entry.archetype === 'indian-formal'), 'keeps Indian looks for clients who ask for them');
  invariant(selected.filter(entry => entry.patternFamily !== 'solid').length <= 7, 'selects at most 7 patterned references');
  for (const context of ['Office / Formal', 'Smart Casual', 'Evening Wear', 'Relaxed Casual']) {
    const families = selected.filter(entry => entry.context === context).map(entry => entry.silhouetteFamily);
    invariant(families.every(family => families.filter(other => other === family).length <= 2), `${context} repeats no silhouette family more than twice`);
  }
  invariant(selected.filter(entry => entry.context === 'Office / Formal').every(entry => !/\b(tee|t-shirt|polo|jeans|denim|sneakers?)\b/i.test(`${entry.top} ${entry.bottom} ${entry.footwear}`)), 'keeps office looks free of casual pieces');
  const fallback = selectManOutfitLibraryReferences(classification, library.filter(entry => !(entry.tier === 'board' && entry.context === 'Evening Wear')), monsoonDate);
  invariant(fallback.filter(entry => entry.context === 'Evening Wear').every(entry => entry.tier === 'core'), 'falls back to the core library when the board cannot fill an occasion');
  const climate = getManReportClimateProfile(classification, monsoonDate);
  invariant(climate.mode === 'monsoon', 'recognises July in India as monsoon rather than summer');
  invariant(!selected.some(entry => /\b(suede|nubuck|merino|flannel|wool|corduroy|overcoat|puffer|turtleneck)\b/i.test(JSON.stringify(entry))), 'selects rain-safe monsoon references');
  invariant(selected.every((entry, index) => index === 0 || getManOutfitPrimaryColourFamily(entry.top) !== getManOutfitPrimaryColourFamily(selected[index - 1]?.top ?? '')), 'avoids adjacent source looks with the same top-colour family');
  invariant(getManOutfitPrimaryColourFamily('Ecru cotton poplin shirt') === 'light-neutral', 'groups ecru with white-family tops');
  invariant(getManOutfitPrimaryColourFamily('Cream-and-navy striped knitted polo') === 'patterned-light-neutral', 'keeps patterned tops visually distinct from solid neutrals');

  const assignments = getManOutfitLibraryAssignments(classification, library, monsoonDate);
  invariant(assignments.length === 20, 'assigns one exact library source to every report outfit');
  invariant(assignments.map(assignment => assignment.outfitNumber).join(',') === '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20', 'assigns every report slot in order');
  invariant(assignments[0]?.libraryLookId === selected[0]?.id, 'records the selected source for Outfit 1');
  const prompt = formatManOutfitLibraryForPrompt(classification, library, monsoonDate);
  invariant(prompt.includes('REFERENCE LOCK — non-negotiable'), 'makes the reference mapping mandatory in the generation prompt');
  invariant(prompt.includes('Current climate mode: Indian monsoon (MONSOON)'), 'includes the current monsoon mode in the generation prompt');
  invariant(prompt.includes('Library version: v3-board-first'), 'identifies the board-first library in the prompt');
  invariant(!/exactly 2 matched suits|at least 3 ties|Resort\/Riviera \+ 2/.test(prompt), 'no longer demands suit, tie or resort quotas');

  const editSources = selectManEditBoardSources(classification, { now: new Date('2026-10-10T12:00:00.000Z'), salt: 'sub-1' }, library);
  invariant(editSources.length === 14 && editSources.every(entry => entry.tier === 'board'), 'offers the monthly Edit 14 board looks');
  invariant(!editSources.some(entry => entry.archetype === 'indian-casual' || entry.archetype === 'indian-formal'), 'keeps Indian board looks out of a Western client\'s Edit');
  const nextMonth = selectManEditBoardSources(classification, { now: new Date('2026-10-10T12:00:00.000Z'), salt: 'sub-1', exclude: editSources.map(entry => entry.id) }, library);
  invariant(!nextMonth.some(entry => editSources.some(used => used.id === entry.id)), 'never re-offers a board look an earlier issue used');

  const fixtureCases: Array<{ location: string; date: string; body: string; anti?: string; patternGuidance?: string }> = [
    { location: 'India — Tier 1 city', date: '2026-04-10', body: 'Oval' },
    { location: 'India — Tier 1 city', date: '2026-07-10', body: 'Athletic' },
    { location: 'India — Tier 2 city', date: '2026-12-10', body: 'Rectangle' },
    { location: 'Dubai, UAE', date: '2026-07-10', body: 'Slim' },
    { location: 'Dubai, UAE', date: '2026-12-10', body: 'Triangle' },
    { location: 'United Kingdom', date: '2026-01-10', body: 'Oval' },
    { location: 'United Kingdom', date: '2026-07-10', body: 'Athletic' },
    { location: 'Canada', date: '2026-10-10', body: 'Rectangle' },
    { location: 'Europe', date: '2026-04-10', body: 'Slim' },
    { location: 'India — Tier 1 city', date: '2026-07-10', body: 'Triangle', anti: 'I dislike leather jackets' },
    { location: 'Dubai, UAE', date: '2026-07-10', body: 'Oval', anti: 'Avoid shorts' },
    { location: 'India — Tier 1 city', date: '2026-07-10', body: 'Rectangle', anti: 'I dislike patterns and prints', patternGuidance: 'Avoid all patterns' },
    { location: 'India — Tier 1 city', date: '2026-07-10', body: 'Athletic', anti: 'I dislike suits' },
    { location: 'United Kingdom', date: '2026-01-10', body: 'Slim', anti: 'Avoid ties' },
  ];
  for (const fixture of fixtureCases) {
    const profile = {
      ...classification,
      client: { ...classification.client, location_region: fixture.location },
      body: { ...classification.body, silhouette_type: fixture.body },
      colour: { ...classification.colour, pattern_guidance: fixture.patternGuidance ?? classification.colour.pattern_guidance },
      style_brief: { ...classification.style_brief, anti_preferences: fixture.anti ?? '' },
    } as ClassificationResult;
    const fixtureSelection = selectManOutfitLibraryReferences(profile, library, new Date(`${fixture.date}T12:00:00.000Z`));
    invariant(fixtureSelection.length === 20, `selects a complete v2 portfolio for ${fixture.location}/${fixture.body}`);
    invariant(fixtureSelection.filter(entry => entry.context === 'Relaxed Casual').length === 5, 'fills Relaxed Casual across the fixture matrix');
    if (/patterns|prints/i.test(fixture.anti ?? '')) invariant(fixtureSelection.every(entry => entry.patternFamily === 'solid'), 'records and respects a pattern waiver');
    if (/leather/i.test(fixture.anti ?? '')) invariant(!fixtureSelection.some(entry => /leather.*(?:jacket|bomber|racer)/i.test(entry.layer)), 'respects leather-jacket anti-preference');
    if (/shorts/i.test(fixture.anti ?? '')) invariant(!fixtureSelection.some(entry => /shorts/i.test(entry.bottom)), 'respects shorts anti-preference');
    if (/suits/i.test(fixture.anti ?? '')) invariant(!fixtureSelection.some(entry => entry.archetype === 'corporate-suit' || entry.silhouetteFamily === 'suit'), 'leaves out suits when explicitly waived');
    if (/ties/i.test(fixture.anti ?? '')) invariant(!fixtureSelection.some(entry => /\btie\b/i.test(entry.accessories)), 'leaves out ties when explicitly waived');
  }
}
