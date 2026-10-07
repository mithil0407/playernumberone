import assert from 'node:assert/strict';
import test from 'node:test';
import { parseShadeCard, shadeCardHtml } from './agentColourCard.ts';
import { SEASONS, parseColourObservations, readingsFrom, sameSeason, seasonFor, type SeasonInputs } from './agentColourSeason.ts';
import { buildAgentImagePrompt, imageNeedsTheirPhoto } from './agentImagePrompts.ts';
import { describeTextingStyle, readTextingStyle } from './agentTextingStyle.ts';

test('the season comes from the readings, and medium Indian skin no longer collapses into Deep Autumn', () => {
  const read = (undertone: SeasonInputs['undertone'], depth: SeasonInputs['depth'], contrast: SeasonInputs['contrast'], chroma: SeasonInputs['chroma']) =>
    seasonFor({ undertone, depth, contrast, chroma });
  assert.equal(read('warm', 'deep', 'medium', 'muted'), 'Deep Autumn');
  assert.equal(read('cool', 'deep', 'high', 'clear'), 'Deep Winter');
  assert.equal(read('neutral', 'deep', 'high', 'clear'), 'Deep Winter');
  assert.equal(read('warm', 'medium', 'medium', 'muted'), 'Soft Autumn');
  assert.equal(read('olive', 'medium', 'low', 'muted'), 'Soft Autumn');
  assert.equal(read('cool', 'medium', 'low', 'muted'), 'Soft Summer');
  assert.equal(read('warm', 'medium', 'high', 'clear'), 'Bright Spring');
  assert.equal(read('cool', 'medium', 'high', 'clear'), 'Bright Winter');
  assert.equal(read('warm', 'medium', 'medium', 'clear'), 'Warm Spring');
  assert.equal(read('olive', 'medium', 'medium', 'clear'), 'Warm Autumn');
  assert.equal(read('cool', 'medium', 'medium', 'clear'), 'Cool Summer');
  assert.equal(read('warm', 'light', 'medium', 'clear'), 'Light Spring');
  assert.equal(read('cool', 'light', 'low', 'muted'), 'Light Summer');
  // Every combination lands on a real season.
  const seen = new Set<string>();
  for (const undertone of ['warm', 'cool', 'neutral', 'olive'] as const) {
    for (const depth of ['light', 'medium', 'deep'] as const) {
      for (const contrast of ['low', 'medium', 'high'] as const) {
        for (const chroma of ['muted', 'clear'] as const) seen.add(read(undertone, depth, contrast, chroma));
      }
    }
  }
  for (const season of seen) assert.ok((SEASONS as readonly string[]).includes(season));
  assert.ok(seen.size >= 10);
  assert.equal(sameSeason('True Autumn', 'Warm Autumn'), true);
  assert.equal(sameSeason('Dark Winter', 'Deep Winter'), true);
  assert.equal(sameSeason('Clear Spring', 'Bright Spring'), true);
  assert.equal(sameSeason('deep autumn', 'Deep Autumn'), true);
  assert.equal(sameSeason('Deep Autumn', 'Soft Autumn'), false);
});

test('depth and contrast come from the 1-10 readings: black hair is high contrast on fair skin, low on deep skin', () => {
  const read = (skin: number, hair: number, eyes: number) => readingsFrom({ undertone: 'warm', chroma: 'clear', skin, hair, eyes });
  assert.deepEqual([read(2, 9, 8).depth, read(2, 9, 8).contrast], ['medium', 'high']);
  assert.deepEqual([read(2, 6, 5).depth, read(2, 6, 5).contrast], ['light', 'medium']);
  assert.deepEqual([read(4, 9, 8).depth, read(4, 9, 8).contrast], ['medium', 'high']);
  assert.deepEqual([read(5, 9, 8).depth, read(5, 9, 8).contrast], ['medium', 'medium']);
  assert.deepEqual([read(6, 9, 9).depth, read(6, 9, 9).contrast], ['deep', 'medium']);
  assert.deepEqual([read(8, 9, 9).depth, read(8, 9, 9).contrast], ['deep', 'low']);
  assert.equal(parseColourObservations({ undertone: 'warm', chroma: 'muted', skin_depth: 11, hair_depth: 9, eye_depth: 8 }), null);
  assert.deepEqual(parseColourObservations({ undertone: 'olive', chroma: 'muted', skin_depth: 6, hair_depth: 9, eye_depth: 8 }), { undertone: 'olive', chroma: 'muted', skin: 6, hair: 9, eyes: 8 });
});

test('texting style is read from their own words and turned into how to text back', () => {
  assert.equal(readTextingStyle(['Hi ICONIK! I want my free colour analysis 🎨 ICK-6QNVGB', '[Unsupported WhatsApp message: reaction]']), null);
  const terse = readTextingStyle(['Pink', 'Saree', 'Festive', 'Help me find one']);
  assert.ok(terse);
  assert.ok(terse.averageWords <= 4);
  assert.equal(terse.emojiPerMessage, 0);
  const terseText = describeTextingStyle(terse);
  assert.match(terseText, /very short messages/);
  assert.match(terseText, /under 15 words/);
  assert.match(terseText, /emojis — one at most/);
  const hinglish = describeTextingStyle(readTextingStyle(['yaar ye kurta kaisa lag raha hai', 'mujhe office ke liye chahiye 😊😊']));
  assert.match(hinglish, /Hinglish/);
  const casual = readTextingStyle(['can u suggest me foundation', 'i prefer natural finish', 'thanks']);
  assert.equal(casual?.lowercase, true);
  assert.equal(casual?.shorthand, true);
  assert.equal(readTextingStyle(['Top'])?.hinglish, false);
  assert.match(describeTextingStyle(null), /haven't seen how they text/);
});

test('pictures keep the person exactly as they are and change only what the stylist said', () => {
  const fix = buildAgentImagePrompt({ kind: 'outfit_fix', brief: 'swap the grey trousers for espresso straight-leg trousers', line: 'woman', palette: ['Rust', 'Teal'] });
  assert.match(fix, /change only this: swap the grey trousers/);
  assert.match(fix, /same skin tone exactly \(never lighter/);
  assert.match(fix, /Do not slim, reshape, beautify/);
  assert.match(fix, /Rust, Teal/);
  assert.match(buildAgentImagePrompt({ kind: 'look_on_them', brief: 'olive bandhgala', line: 'man' }), /head to shoes/);
  assert.match(buildAgentImagePrompt({ kind: 'hairstyles', brief: 'a soft side part; a low bun', line: 'woman' }), /2x2 grid/);
  const idea = buildAgentImagePrompt({ kind: 'idea', brief: 'rust saree with a teal blouse', line: 'woman' });
  assert.match(idea, /No people's faces/);
  assert.equal(imageNeedsTheirPhoto('idea'), false);
  assert.equal(imageNeedsTheirPhoto('outfit_fix'), true);
});

test('shade cards need a title and real hex swatches, and escape what the model wrote', () => {
  assert.equal(parseShadeCard({ title: 'Your reds', swatches: [{ name: 'Red Coat', hex: '#A3302B', note: null }] }), null);
  const card = parseShadeCard({
    title: 'Your reds',
    subtitle: 'Lakmé, under ₹600',
    swatches: [
      { name: 'Red Coat', hex: '#A3302B', note: 'Lakmé 9 to 5 · festive' },
      { name: 'Coffee <Command>', hex: '#7A4A3A', note: 'everyday' },
      { name: 'Bad', hex: 'red', note: null },
    ],
  });
  assert.ok(card);
  assert.equal(card.swatches.length, 2);
  const html = shadeCardHtml(card);
  assert.match(html, /id="card"/);
  assert.match(html, /Coffee &lt;Command&gt;/);
  assert.match(html, /background:#A3302B/);
});
