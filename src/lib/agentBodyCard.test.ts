import assert from 'node:assert/strict';
import test from 'node:test';
import { BODY_SHAPES, bodyCardHtml, bodyCardPending, bodyProfileFields, bodyShapeKey, parseBodyAnalysis, silhouetteSvg } from './agentBodyCard.ts';
import {
  BODY_LINK_QUESTION,
  bodyOutfitMessage,
  loadBodyLibrary,
  parseWomenBodyLibrary,
  pickBodyLooks,
  scoreBodyLook,
  type BodyLibraryLook,
} from './agentBodyOutfit.ts';
import {
  bodyPhotoReceivedMessage,
  asksForBodyShapeAnalysis,
  bodyPhotoAskMessage,
  inviteLink,
  isBodyOpenerMessage,
  isOpenerMessage,
} from './agentGrowth.ts';
import { buildAgentInstructions } from './agentPrompt.ts';

const analysisInput = {
  line: 'woman',
  shape: 'Pear',
  proportions: ['Shoulders a touch narrower than hips', 'Defined waist'],
  summary: 'Your hips and waist are your strongest line.',
  highlight: ['Shoulders and neckline', 'Your waist with a clean belt', 'A long, straight line below'],
  silhouettes: ['A-line skirts', 'Structured blazers', 'Wide-leg trousers'],
  necklines: ['Boat neck', 'Square neck'],
  go_easy: ['Hip-level pockets and patches'],
  fabrics: ['Crepe', 'Structured cotton'],
  formula: 'Structure on top, a clean A-line below, one belt to cinch.',
};

test('body shape requests are recognised, and a bare request is an opener', () => {
  assert.equal(asksForBodyShapeAnalysis('Hi ICONIK! I want my free body shape analysis 👗 ICK-6QNVGB'), true);
  assert.equal(asksForBodyShapeAnalysis('can you tell me my body type?'), true);
  assert.equal(asksForBodyShapeAnalysis('I want my free colour analysis'), false);
  assert.equal(asksForBodyShapeAnalysis('I need a shirt'), false);
  assert.equal(isBodyOpenerMessage('Hi ICONIK! I want my free body shape analysis 👗 ICK-6QNVGB'), true);
  assert.equal(isBodyOpenerMessage('can you tell me my body type?'), false);
  assert.equal(isBodyOpenerMessage('what suits my body shape for my sister\'s wedding next month, I am 5ft2 and want something in budget so please suggest'), false);
  // The campaign text carries an invite code, so the colour opener also matches it: the body check must come first.
  assert.equal(isOpenerMessage('Hi ICONIK! I want my free body shape analysis 👗 ICK-6QNVGB'), true);
  assert.match(inviteLink('ICK-REEL01', '919876543210', 'body_analysis') ?? '', /free%20body%20shape%20analysis%20%F0%9F%91%97%20ICK-REEL01$/);
});

test('the photo ask says what makes a body photo readable, and never mentions codes', () => {
  const first = bodyPhotoAskMessage('Riya', true);
  assert.match(first, /^Hey Riya!/);
  assert.match(first, /full-length/);
  assert.match(first, /head to toe/);
  assert.match(first, /stays between us/);
  assert.doesNotMatch(first, /code|link/i);
  assert.doesNotMatch(bodyPhotoAskMessage(null, false), /^Hey/);
  assert.match(bodyPhotoReceivedMessage("a") + bodyPhotoReceivedMessage("b") + bodyPhotoReceivedMessage("c"), /\w/);
});

test('body card: only a complete analysis in a valid shape for the line renders; text is escaped', () => {
  const analysis = parseBodyAnalysis(analysisInput, 'Riya')!;
  assert.ok(analysis);
  assert.equal(analysis.shape, 'pear');
  const html = bodyCardHtml({ ...analysis, summary: '<script>alert(1)</script>' }, '7 Oct 2026');
  assert.match(html, /Riya, your shape is/);
  assert.match(html, />Pear</);
  assert.match(html, /Dress to highlight/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.equal(parseBodyAnalysis({ ...analysisInput, shape: 'trapezoid' }, null), null);
  assert.equal(parseBodyAnalysis({ ...analysisInput, line: 'man', shape: 'apple' }, null), null);
  assert.equal(parseBodyAnalysis({ ...analysisInput, highlight: ['one only'] }, null), null);
  assert.equal(parseBodyAnalysis({ ...analysisInput, formula: '' }, null), null);
  assert.equal(parseBodyAnalysis({ ...analysisInput, line: undefined }, null), null);
  assert.equal(bodyShapeKey('Inverted-Triangle', 'man'), 'inverted triangle');
  assert.deepEqual(Object.keys(BODY_SHAPES.woman), ['hourglass', 'pear', 'inverted triangle', 'rectangle', 'apple']);
  assert.match(silhouetteSvg(BODY_SHAPES.man.oval.widths), /<path d="M/);
  assert.match(bodyProfileFields(analysis).body_notes, /Structure on top/);
});

test('the body card is open from the request until it is delivered', () => {
  assert.equal(bodyCardPending({}), false);
  assert.equal(bodyCardPending({ body_ask_at: '2026-10-07T10:00:00Z' }), true);
  assert.equal(bodyCardPending({ body_ask_at: '2026-10-07T10:00:00Z', body_card_at: '2026-10-07T10:02:00Z' }), false);
  assert.equal(bodyCardPending({ body_ask_at: '2026-10-08T10:00:00Z', body_card_at: '2026-10-07T10:02:00Z' }), true);
  assert.equal(bodyCardPending(null), false);
});

const look = (id: string, setting: string, pieces: string[], styling = ''): BodyLibraryLook => ({ id, line: 'woman', setting, pieces, styling });

test('looks are ranked by what flatters the shape, and colours to avoid rule a look out', () => {
  const wrapAline = look('a', 'Everyday', ['Top: Rust wrap blouse with a defined waist', 'Bottom: Black A-line midi skirt', 'Shoes: Tan block heels']);
  const skinnyBodycon = look('b', 'Everyday', ['Top: Black bodycon ribbed top', 'Bottom: Skinny leggings', 'Shoes: White trainers']);
  assert.ok(scoreBodyLook(wrapAline, 'hourglass', {}, 'x') > scoreBodyLook(skinnyBodycon, 'hourglass', {}, 'x'));
  assert.ok(scoreBodyLook(wrapAline, 'pear', {}, 'x') > scoreBodyLook(skinnyBodycon, 'pear', {}, 'x'));
  const padded = look('c', 'Everyday', ['Top: Cream blouse with structured shoulders and a boat neck', 'Bottom: Straight trousers', 'Shoes: Flats']);
  const soft = look('d', 'Everyday', ['Top: Cream V-neck drape blouse', 'Bottom: Wide-leg trousers', 'Shoes: Flats']);
  assert.ok(scoreBodyLook(soft, 'inverted triangle', {}, 'x') > scoreBodyLook(padded, 'inverted triangle', {}, 'x'));
  assert.ok(scoreBodyLook(padded, 'pear', {}, 'x') > scoreBodyLook(soft, 'pear', {}, 'x') - 0.5);
  // Rust blouse is a colour to keep away from their face.
  const picked = pickBodyLooks({ line: 'woman', shape: 'hourglass', profile: { avoid_colours: ['Rust'] } }, [wrapAline, soft]);
  assert.equal(picked[0].id, 'd');
});

test('picks respect the occasion, skip looks already shown and never run dry', () => {
  const office = look('o', 'Professional', ['Top: Shirt', 'Bottom: Trousers', 'Shoes: Pumps']);
  const casual = look('c', 'Everyday', ['Top: Tee', 'Bottom: Jeans', 'Shoes: Trainers']);
  const wedding = look('w', 'Occasion', ['Dress: Silk saree', 'Top: Blouse', 'Shoes: Heels']);
  const library = [office, casual, wedding];
  assert.equal(pickBodyLooks({ line: 'woman', shape: 'pear', occasion: 'office' }, library)[0].id, 'o');
  assert.equal(pickBodyLooks({ line: 'woman', shape: 'pear', occasion: 'my cousin\'s wedding' }, library)[0].id, 'w');
  // No occasion: everyday looks, never a wedding saree.
  assert.ok(!pickBodyLooks({ line: 'woman', shape: 'pear', count: 3 }, library).some(item => item.id === 'w'));
  assert.deepEqual(pickBodyLooks({ line: 'woman', shape: 'pear', exclude: ['o', 'c'], count: 3 }, library).map(item => item.id), ['w']);
  assert.deepEqual(pickBodyLooks({ line: 'woman', shape: 'pear', exclude: ['o', 'c', 'w'] }, library), []);
});

test('the real libraries load, with searchable pieces for each look', () => {
  const women = loadBodyLibrary('woman');
  const men = loadBodyLibrary('man');
  assert.ok(women.length > 250, `women: ${women.length}`);
  assert.ok(men.length > 100, `men: ${men.length}`);
  for (const item of [...women, ...men]) assert.ok(item.pieces.length >= 3, item.id);
  assert.ok(women.every(item => !item.pieces.some(piece => /\.$/.test(piece))));
  for (const shape of Object.keys(BODY_SHAPES.woman)) assert.equal(pickBodyLooks({ line: 'woman', shape })[0]?.line, 'woman');
  for (const shape of Object.keys(BODY_SHAPES.man)) assert.equal(pickBodyLooks({ line: 'man', shape })[0]?.line, 'man');
  assert.ok(parseWomenBodyLibrary('').length === 0);
});

test('the outfit message gives the best outfit, a library look and why it works; the question asks for pincode and size', () => {
  const item = look('women-06', 'Professional', ['Top: Optic white knit shell', 'Layer: Deep teal blazer', 'Bottom: Deep teal trousers', 'Shoes: Tan mules'], 'Tuck the knit smoothly');
  const message = bodyOutfitMessage({ line: 'woman', shape: 'pear', bestOutfit: 'a structured top with a clean A-line below', look: item });
  assert.match(message, /^What I'd put you in: a structured top/);
  assert.match(message, /• Top: Optic white knit shell/);
  assert.match(message, /Structure and detail on top/);
  assert.match(message, /Tuck the knit smoothly\./);
  assert.doesNotMatch(message, /Why it works for you:|Styling tip:/);
  assert.equal(bodyOutfitMessage({ line: 'woman', shape: 'pear', bestOutfit: 'a structured top', look: null }), "What I'd put you in: a structured top");
  assert.match(BODY_LINK_QUESTION, /pincode/);
  assert.match(BODY_LINK_QUESTION, /size/);
});

test('the prompt switches the colour selfie off while the body card is open, and carries the offered outfit afterwards', () => {
  const base = {
    line: null, firstName: 'Riya', today: '2026-10-07', reportUrl: null, memoryText: '', events: [], lookActivity: '',
    firstConversation: false, hasReportPhotos: false, tier: 'free' as const, runsLeft: 3, invitesLeft: 5,
  };
  const pending = buildAgentInstructions({ ...base, profile: { body_ask_at: '2026-10-07T10:00:00Z' } });
  assert.match(pending, /BODY CARD \(free\) — they asked for it/);
  assert.match(pending, /send_body_card/);
  assert.match(pending, /never mention weight/);
  assert.doesNotMatch(pending, /THE FREE COLOUR ANALYSIS is why most people are here/);
  const offered = buildAgentInstructions({
    ...base,
    profile: { body_shape: 'Pear', body_notes: 'Structure on top.', body_outfit: { id: 'women-06', text: 'Top: Optic white knit shell; Bottom: Deep teal trousers' } },
  });
  assert.match(offered, /BODY CARD: they have it — Pear/);
  assert.match(offered, /OUTFIT OFFERED after the card: Top: Optic white knit shell/);
  assert.match(offered, /suggest_library_outfit/);
  const none = buildAgentInstructions({ ...base, profile: {} });
  assert.match(none, /start_body_card/);
  assert.match(none, /THE FREE COLOUR ANALYSIS is why most people are here/);
  const blueprint = buildAgentInstructions({ ...base, tier: 'blueprint', profile: {} });
  assert.doesNotMatch(blueprint, /BODY CARD/);
});
