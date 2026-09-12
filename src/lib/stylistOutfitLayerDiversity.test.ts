import assert from 'node:assert/strict';
import test from 'node:test';
import { selectOutfitPortfolio, type ScoredCandidateOutfit } from './stylistOutfitScience.ts';
import { getParsedStylistOutfitLibrary, isUsableStylistOutfitAnchor } from './stylistOutfitLibraryParser.ts';

test('reference pins explicitly marked as menswear are excluded from women recommendations', () => {
  const library = getParsedStylistOutfitLibrary();
  const skipped = library.filter(item => /\(\s*menswear\b|men['’]s look/i.test(item.fields.map(field => field.value).join(' ')));
  assert.ok(skipped.length > 0);
  assert.ok(skipped.every(item => !isUsableStylistOutfitAnchor(item)));
});

function look(id: string, layer: string | null, colour = 'Camel', score = 9): ScoredCandidateOutfit {
  return {
    id, demand_id: id, capsule: 'Professional', library_signature: id,
    formula_items: [
      { slot: 'Top', piece: `${id} blouse`, colour_name: id, colour_hex: '#184A59', palette_role: 'lead', structural_notes: '' },
      ...(layer ? [{ slot: 'Layer', piece: layer, colour_name: colour, colour_hex: '#C19A6B', palette_role: 'support' as const, structural_notes: '' }] : []),
    ],
    techniques: [], attention_map: { first_fixation: 'face', second_fixation: 'waist', risk_zones: [] },
    colour_scores: [], veto_checks: [], sourcing_assumptions: [], generation_reasoning: '',
    score: { candidate_id: id, iconik: score, realism: score, relevance: score, diversity: score, killed: false, kill_flags: [], rationale: '' },
  };
}

test('different lead colours and anchor IDs cannot disguise four matching beige blazers', () => {
  const pool = [look('blue', 'camel blazer'), look('navy', 'camel/beige oversized blazer'),
    look('white', 'beige blazer', 'Beige'), look('cream', 'oatmeal blazer', 'Oatmeal'),
    look('olive', 'linen waistcoat', 'Olive', 8.7), look('rust', null, 'Rust', 8.7),
    look('plum', 'cropped jacket', 'Plum', 8.7), look('teal', 'soft cardigan', 'Teal', 8.7)];
  const selected = selectOutfitPortfolio(pool, { count: 5, perCapsule: 5 });
  assert.equal(selected.length, 5);
  assert.equal(selected.filter(item => item.formula_items.some(piece => /blazer/.test(piece.piece))).length, 1);
  assert.ok(selected.some(item => item.id === 'rust'), 'a suitable unlayered option remains eligible');
});

test('diversity never restores killed looks and thin pools still complete', () => {
  const killed = look('unsafe', 'cardigan'); killed.score.killed = true;
  const pool = [look('one', 'camel blazer'), look('two', 'beige blazer'), killed];
  const selected = selectOutfitPortfolio(pool, { count: 2, perCapsule: 2 });
  assert.equal(selected.length, 2);
  assert.ok(selected.every(item => item.id !== 'unsafe'));
});

test('ethnic reservations are counted when ranking subsequent layers', () => {
  const ethnic = { ...look('ethnic', 'camel blazer'), is_ethnic: true };
  const pool = [ethnic, look('same', 'beige blazer', 'Beige'), look('different', 'linen waistcoat', 'Olive', 8.9)]
    .map(item => ({ ...item, capsule: 'Occasion' as const }));
  const selection = selectOutfitPortfolio(pool,
    { count: 2, perCapsule: 2, ethnicTarget: 1 });
  assert.ok(selection.some(item => item.id === 'ethnic'));
  assert.ok(selection.some(item => item.id === 'different'));
});
