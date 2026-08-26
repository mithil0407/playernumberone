import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractFullManIdentityStatement,
  formatManReportOpeningNeed,
  isManReportStylistReviewed,
  resolveManFormulaColour,
} from './manReportPresentation.ts';

test('extractFullManIdentityStatement removes markdown while preserving the complete statement', () => {
  const source = `## SECTION 8: YOUR STYLE IDENTITY STATEMENT

Your style identity is defined by **architectural precision**. You choose better. Consistent dressing will strengthen your presence and confidence.`;
  const result = extractFullManIdentityStatement(source);

  assert.equal(
    result,
    'Your style identity is defined by architectural precision. You choose better. Consistent dressing will strengthen your presence and confidence.',
  );
  assert.equal(result.includes('…'), false);
  assert.equal(result.endsWith('confidence.'), true);
});

test('resolveManFormulaColour maps the screenshot garment colours', () => {
  assert.deepEqual(resolveManFormulaColour('Warm ivory cotton poplin dress shirt', []), {
    name: 'Warm Ivory',
    hex: '#FFF8E7',
  });
  assert.deepEqual(resolveManFormulaColour('Matching warm taupe linen-cotton suit trousers', []), {
    name: 'Warm Taupe',
    hex: '#A88F7A',
  });
  assert.deepEqual(resolveManFormulaColour('Dark chocolate leather Oxford shoes', []), {
    name: 'Dark Chocolate',
    hex: '#4B2E24',
  });
  assert.deepEqual(
    resolveManFormulaColour('Deep olive knitted cotton tie — chocolate leather belt — gold-tone dress watch', []),
    { name: 'Deep Olive', hex: '#4F552B' },
  );
});

test('resolveManFormulaColour uses an exact report palette colour and ignores case', () => {
  assert.deepEqual(
    resolveManFormulaColour('OLIVE cotton overshirt', [{ name: 'Olive', hex: '#667044' }]),
    { name: 'Olive', hex: '#667044' },
  );
});

test('resolveManFormulaColour prefers compound names and the first colour mentioned', () => {
  assert.deepEqual(resolveManFormulaColour('Warm taupe knit with gold buttons', []), {
    name: 'Warm Taupe',
    hex: '#A88F7A',
  });
  assert.deepEqual(resolveManFormulaColour('Chocolate belt with gold-tone watch', []), {
    name: 'Chocolate',
    hex: '#4A2F23',
  });
  assert.deepEqual(resolveManFormulaColour('Light-wash relaxed straight-leg denim', []), {
    name: 'Denim Blue',
    hex: '#5F82A3',
  });
});

test('resolveManFormulaColour returns null when no colour is stated', () => {
  assert.equal(resolveManFormulaColour('Fine-knit crewneck top', []), null);
});

test('formatManReportOpeningNeed turns generated intake language into customer-facing copy', () => {
  assert.equal(
    formatManReportOpeningNeed('Uncertainty regarding body type and fit requirements for an oval shape.', 'Oval'),
    'You wanted to know which fits work best for your oval frame.',
  );
  assert.equal(
    formatManReportOpeningNeed('Unsure about which colours suit my skin tone', 'Rectangle'),
    'You wanted to know which colours genuinely suit you.',
  );
  assert.equal(
    formatManReportOpeningNeed('', 'Rectangle'),
    'You wanted a clearer, more reliable way to get dressed.',
  );
});

test('isManReportStylistReviewed only makes the claim after approval or delivery', () => {
  assert.equal(isManReportStylistReviewed('draft_ready', null), false);
  assert.equal(isManReportStylistReviewed('in_review', null), false);
  assert.equal(isManReportStylistReviewed('approved', null), true);
  assert.equal(isManReportStylistReviewed('sent', null), true);
  assert.equal(isManReportStylistReviewed('draft_ready', '2026-08-20T00:00:00.000Z'), true);
});
