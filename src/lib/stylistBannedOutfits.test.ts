import test from 'node:test';
import assert from 'node:assert/strict';
import { BANNED_OUTFITS, bannedOutfitFor } from './stylistBannedOutfits.ts';
import { buildVerbatimClientRules, evaluateVerbatimLook, getVerbatimLooks, isHardClientRuleWarning, type VerbatimLook } from './stylistPinterestOutfits.ts';
import { isBannedScienceOutfit } from './stylistOutfitScience.ts';
import type { StylistBlueprintReportData, StylistIntakeSubmission } from './stylistBlueprintGenerator.ts';

// The garments exactly as the old engine wrote them in the reports the deck came from.
const fromReports: Array<[string, string[]]> = [
  ['rust-top-navy-long-vest-stripe-skirt', [
    'Rust-toned matte crepe blouse, boat neckline, elbow-length sleeves, soft front tuck',
    'Navy-and-ivory fine vertical stripe midi skirt, A-line silhouette, high-waisted, falling below the knee',
    'Navy-blue long draped vest, lightweight structured twill, worn fully open',
  ]],
  ['polka-dot-blouse-brown-trousers', [
    'Charcoal-grey silk-blend blouse, small ivory polka-dot print, soft open collar with a safe button stance, bracelet-length sleeves',
    'Soft espresso-brown high-waisted wide-leg trousers, front crease, fluid drape to elongate the leg line',
  ]],
  ['olive-peplum-olive-maxi-skirt', [
    'Olive green matte crepe peplum top, modest scoop neck, short sleeves, peplum starting above the natural waist with a modest V-neckline',
    'Olive green wide-leg maxi skirt, fluid crepe, matching tonal column',
    'Sage green relaxed linen-blend blazer, quiet woven texture, worn open, sleeves pushed to forearm',
  ]],
  ['olive-peplum-olive-maxi-skirt', [
    'Olive green matte crepe peplum top with modest scoop neck and short sleeves',
    'Olive green wide-leg maxi skirt in fluid crepe',
    'Sage green relaxed linen-blend blazer',
  ]],
  ['burgundy-cape-blazer-cream-top-brown-trousers', [
    'Cream matte-silk shell, high scoop neckline, sleeveless (hidden under the layer)',
    'Espresso-brown wide-leg trousers, woven texture, high-rise, full length to ground the look',
    'Burgundy relaxed suede blazer, structured shoulders, worn over the shoulders like a cape',
  ]],
  ['pink-double-breasted-top-pink-trousers', [
    'Blush-pink smooth ponte knit tunic, double-breasted structure with visible gold buttons, elbow-length sleeves, modest square neckline',
    'Matching blush-pink fluid straight-leg pants, high-waisted, falling straight from the hip to skim the thighs',
  ]],
  ['green-waistcoat-teal-trousers', [
    'Deep emerald-green smooth ponte knit waistcoat-style top, sleeveless with deep shoulder coverage, modest V-neck, double-breasted gold button detailing',
    'Deep teal-blue straight-leg tailored trousers, high-waisted, front crease for verticality',
  ]],
  ['camel-blazer-cream-top-brown-midi-skirt', [
    'Cream matte crepe shell, modest jewel neckline, cleanly tucked into the waistband',
    'Espresso brown bias-cut midi skirt, non-cling heavy satin, falling below the knee',
    'Camel-toned relaxed linen-blend blazer, quiet woven texture, single-button, worn open',
  ]],
];

// The deck outfits whose report page was regenerated since: described from the picture.
const fromDeckPictures: Array<[string, string[]]> = [
  ['yellow-stripe-shirt-rust-trousers', ['Mustard-yellow vertical stripe oversized shirt worn open', 'Rust fitted crew-neck top', 'Rust straight-leg trousers']],
  ['olive-shirt-beige-trousers', ['Olive green utility shirt-kurta with flap pockets and a drawstring waist', 'Beige wide-leg trousers']],
  ['stripe-shirt-pink-tee-beige-trousers', ['Grey-and-white stripe shirt worn open', 'Dusty pink fitted tee', 'Beige pleated wide-leg trousers']],
  ['ivory-long-cardigan-rust-top-rust-trousers', ['Ivory boucle longline cardigan worn open', 'Rust round-neck top', 'Rust wide-leg trousers']],
  ['rust-short-kurta-jeans', ['Rust cotton short kurta with a notch neck', 'Dark indigo straight jeans']],
  ['stripe-shirt-over-rust-kurta-white-trousers', ['Black-and-white stripe shirt worn open', 'Rust block-print straight kurta', 'White straight trousers']],
  ['pink-wrap-top-brown-trousers', ['Dusty pink linen wrap top with a side tie', 'Chocolate-brown wide-leg trousers']],
  ['rust-shirt-navy-trousers', ['Rust linen shirt, half-tucked', 'Navy wide-leg linen trousers']],
];

test('every outfit from the deck is banned, as the report wrote it', () => {
  for (const [id, pieces] of [...fromReports, ...fromDeckPictures]) {
    assert.equal(bannedOutfitFor(pieces)?.id, id, `expected ${id} for: ${pieces.join(' | ')}`);
  }
  // All 15 deck outfits have a ban.
  assert.equal(BANNED_OUTFITS.length, 15);
  assert.equal(new Set(BANNED_OUTFITS.map(item => item.id)).size, 15);
});

test('look-alikes that are not the banned outfit stay allowed', () => {
  const allowed: string[][] = [
    // The Pinterest look the olive one resembles, in its own colour.
    ['Cobalt-blue halter-neck peplum top, sleeveless', 'matching cobalt wide-leg maxi skirt'],
    // Half of a banned outfit is not the outfit.
    ['Olive green matte crepe peplum top', 'Cream wide-leg trousers'],
    ['Rust/terracotta short-sleeve boxy shirt', 'light-wash wide-leg jeans'],
    ['Navy wrap-front top with three-quarter sleeves and a side tie', 'cream slim ankle trousers'],
    ['Emerald green satin blouse with soft drape', 'Deep navy wide-leg trousers'],
    ['Camel blazer', 'Black fitted top', 'black wide-leg trousers'],
  ];
  for (const pieces of allowed) assert.equal(bannedOutfitFor(pieces), null, pieces.join(' | '));
});

test('the science engine ignores bags and shoes when checking a ban', () => {
  const items = (rows: Array<[string, string, string]>) => rows.map(([slot, colour_name, piece]) => ({ slot, colour_name, piece }));
  assert.equal(isBannedScienceOutfit(items([
    ['Top', 'Rust', 'matte crepe blouse with elbow sleeves'],
    ['Bottom', 'Navy', 'straight-leg trousers'],
    ['Footwear', 'Tan', 'leather loafers'],
  ])), false, 'a blouse is not a shirt-and-trouser ban unless it is the rust shirt');
  assert.equal(isBannedScienceOutfit(items([
    ['Top', 'Rust', 'linen shirt, half-tucked'],
    ['Bottom', 'Navy', 'wide-leg trousers'],
  ])), true);
  // "Cream top-handle bag" must not count as a cream top.
  assert.equal(isBannedScienceOutfit(items([
    ['Layer', 'Burgundy', 'suede blazer worn like a cape'],
    ['Top', 'Black', 'fitted knit shell'],
    ['Bottom', 'Espresso', 'brown wide-leg trousers'],
    ['Bag', 'Cream', 'cream top-handle bag'],
  ])), false);
});

const classification = {
  client: { name: 'Test', email: '', country: 'India', language: 'English', age_range: '34', lifestyle_summary: 'Works in an office.' },
  body: { geometry: 'Rectangle', focus_areas: [], coverage_rules: [], silhouette_rules: [], proportion_directive: '' },
  taste: { moodboard: '', anti_codes: [], signature_codes: [], style_archetype: 'Minimalist', shopping_filters: [] },
  colour: {
    depth: 'Deep', contrast: 'Medium', palette_name: 'Warm', undertone_direction: 'warm', avoid_colours: [],
    base_palette: [{ name: 'Rust', hex: '#8B4513', usage: '' }, { name: 'Deep Navy', hex: '#1B2431', usage: '' }],
    accent_palette: [],
  },
  face_hair_accessories: { neckline_direction: '', approved_necklines: [] },
} as unknown as StylistBlueprintReportData['classification'];
const reportData = { version: 'women_blueprint_41_v1', classification, pages: [] } as unknown as StylistBlueprintReportData;
const submission = { id: 'test', coverage_requirements: {}, piece_preferences: {}, raw_consultation_notes: '' } as unknown as StylistIntakeSubmission;

test('the Pinterest engine drops a banned look and a stylist cannot paste one', () => {
  const rules = buildVerbatimClientRules(submission, reportData);
  const look: VerbatimLook = {
    id: 'pinterest-test', source: 'pinterest', capsules: ['Everyday'], ethnic: false,
    top: 'Rust linen shirt with long sleeves', bottom: 'navy wide-leg trousers', shoes: 'tan flats', accessories: 'tan tote', styling: '',
  };
  const rejects = evaluateVerbatimLook(look, rules, 'Everyday').rejects;
  const banned = rejects.find(item => item.startsWith('banned outfit'));
  assert.ok(banned, `expected a ban, got ${rejects.join(', ')}`);
  assert.ok(isHardClientRuleWarning(banned!));
  assert.equal(evaluateVerbatimLook({ ...look, bottom: 'cream wide-leg trousers' }, rules, 'Everyday').rejects.some(item => item.startsWith('banned outfit')), false);
});

test('the library still has plenty of looks after the bans', () => {
  const looks = getVerbatimLooks();
  const banned = looks.filter(look => bannedOutfitFor([look.top, look.dress, look.layer, look.bottom]));
  assert.ok(banned.length <= 10, `bans remove ${banned.length} library looks: ${banned.map(item => item.id).join(', ')}`);
});
