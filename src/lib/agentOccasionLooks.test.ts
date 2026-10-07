import assert from 'node:assert/strict';
import test from 'node:test';
import {
  OCCASION_CAMPAIGNS,
  agentServesBlueprintClients,
  buildLookButtonsPayload,
  buildOccasionTemplatePayload,
  cleanHook,
  forwardableOccasionInvite,
  isLookActive,
  lookButtonPayload,
  lookResponseFromText,
  occasionLookSection,
  parseLookButtonPayload,
  renderInviteEmail,
  renderInviteMessage,
  renderRevealMessage,
  templateParam,
  whatsappLink,
} from './agentOccasionLooks.ts';
import { buildAgentInstructions } from './agentPrompt.ts';
import { extractWhatsappWebhookEvents } from './whatsappPilot.ts';

const diwali = OCCASION_CAMPAIGNS.diwali_2026;
const LOOK_ID = '3f2b8c1e-5a4d-4e8f-9b7a-1c2d3e4f5a6b';

test('the invite says a look is ready, without showing it', () => {
  assert.equal(
    renderInviteMessage(diwali, 'Rohan'),
    "Hi Rohan, Diwali's on the 8th 🪔 I've put together a look for you, built on your Blueprint: your colours, your fit.\n\nWant to see it?",
  );
  assert.match(renderInviteMessage(diwali, null), /^Hi there, /);
  assert.match(renderInviteEmail(diwali, 'Rohan'), /^Hi Rohan,\n\nDiwali's on the 8th/);
  assert.equal(diwali.emailSubject('Rohan'), 'Rohan, your Diwali look is ready 🪔');
});

test('the reveal caption reads like a person wrote it', () => {
  assert.equal(
    renderRevealMessage('The deep rust brings out the warmth in your skin.'),
    'I put this together for you, the deep rust brings out the warmth in your skin.\n\nLike it?',
  );
});

test('hooks and template parameters are cleaned for WhatsApp', () => {
  assert.equal(cleanHook('  The rust\nkurta   suits you!  '), 'the rust kurta suits you');
  assert.equal(cleanHook('— I chose olive for you.'), 'I chose olive for you');
  assert.equal(templateParam('a\tb\n\nc'), 'a b c');
  assert.ok(templateParam('x'.repeat(300)).length <= 160);
});

test('button payloads round-trip and reject anything else', () => {
  for (const action of ['show', 'love', 'another'] as const) {
    assert.deepEqual(parseLookButtonPayload(lookButtonPayload(LOOK_ID, action)), { lookId: LOOK_ID, action });
  }
  assert.equal(parseLookButtonPayload('look:not-an-id:love'), null);
  assert.equal(parseLookButtonPayload(undefined), null);
});

test('asking to see the look is read from buttons and the email text', () => {
  assert.equal(lookResponseFromText('Show me my look', diwali), 'show');
  assert.equal(lookResponseFromText(diwali.showText, diwali), 'show');
  assert.equal(lookResponseFromText('Love it 😍', diwali), 'love');
  assert.equal(lookResponseFromText('Show me another', diwali), 'another');
  assert.equal(lookResponseFromText('nice! where is the kurta from', diwali), 'reply');
});

test('the WhatsApp template is text only, with a "Show me my look" button', () => {
  const payload = buildOccasionTemplatePayload({ to: '919876543210', campaign: diwali, lookId: LOOK_ID, firstName: 'Rohan' });
  assert.equal(payload.template.name, 'iconik_diwali_look_invite_v1');
  type Component = { type: string; index?: string; parameters: Array<{ text?: string; payload?: string }> };
  const components = payload.template.components as Component[];
  assert.deepEqual(components.map(component => component.type), ['body', 'button']);
  assert.deepEqual(components[0].parameters.map(parameter => parameter.text), ['Rohan']);
  assert.equal(components[1].parameters[0].payload, `look:${LOOK_ID}:show`);
});

test('the reveal goes out as free reply buttons with his picture on top', () => {
  const payload = buildLookButtonsPayload({
    to: '919876543210', lookId: LOOK_ID, body: renderRevealMessage('the rust suits you'), actions: ['love', 'another'], imageUrl: 'https://x.test/a.png',
  });
  assert.equal(payload.interactive.header?.image.link, 'https://x.test/a.png');
  assert.deepEqual(payload.interactive.action.buttons.map(button => button.reply.id), [`look:${LOOK_ID}:love`, `look:${LOOK_ID}:another`]);
  for (const button of payload.interactive.action.buttons) assert.ok(button.reply.title.length <= 20);
  const invite = buildLookButtonsPayload({ to: '919876543210', lookId: LOOK_ID, body: 'x', actions: ['show'] });
  assert.equal('header' in invite.interactive, false);
});

test('template button taps reach the agent with their payload', () => {
  const { messages } = extractWhatsappWebhookEvents({
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ value: { messages: [{
      id: 'wamid.1', from: '919876543210', timestamp: '1760000000', type: 'button',
      button: { text: 'Show me my look', payload: `look:${LOOK_ID}:show` },
    }] } }] }],
  });
  assert.equal(messages[0].type, 'interactive');
  assert.equal(messages[0].text, 'Show me my look');
  assert.equal(messages[0].payload, `look:${LOOK_ID}:show`);
});

test('a look steers the chat for three weeks, until just after the day', () => {
  const look = { campaign: 'diwali_2026', sentAt: '2026-10-22T05:00:00Z' };
  assert.ok(isLookActive(look, new Date('2026-10-23T05:00:00Z')));
  assert.ok(isLookActive(look, new Date('2026-11-09T05:00:00Z')));
  assert.ok(!isLookActive(look, new Date('2026-11-12T05:00:00Z')));
  assert.ok(!isLookActive({ ...look, campaign: 'unknown' }, new Date('2026-10-23T05:00:00Z')));
});

test('the prompt tells the agent to ask only for pincode and size after he likes it', () => {
  const now = new Date('2026-10-23T05:00:00Z');
  const section = occasionLookSection({
    campaign: 'diwali_2026', outfit: 'deep rust silk-blend kurta, ivory churidar, tan mojaris', hook: 'the rust suits you',
    sentAt: '2026-10-22T05:00:00Z', response: 'love',
  }, now);
  assert.match(section, /DIWALI LOOK YOU MADE HIM/);
  assert.match(section, /Diwali is in 16 days/);
  assert.match(section, /He tapped "Love it"/);
  assert.match(section, /pincode and shirt size/);
  assert.match(section, /create_image \(kind look_on_them\) straight away/);

  const instructions = buildAgentInstructions({
    line: 'man', firstName: 'Rohan', today: '2026-10-23', profile: {}, reportUrl: null, memoryText: '', events: [],
    lookActivity: '', firstConversation: true, hasReportPhotos: true, tier: 'blueprint', now,
    occasionLook: { campaign: 'diwali_2026', outfit: 'rust kurta', hook: 'the rust suits you', sentAt: '2026-10-22T05:00:00Z', response: 'show' },
  });
  assert.match(instructions, /DIWALI LOOK YOU MADE HIM/);
  assert.match(instructions, /He has just seen it/);
  // He's answering the look: no "first chat" introduction.
  assert.doesNotMatch(instructions, /FIRST CONVERSATION/);
});

test('the family invite is about going together, not a referral pitch', () => {
  const text = forwardableOccasionInvite({ inviterName: 'Rohan', occasion: 'Diwali', link: 'https://wa.me/91?text=x', code: 'ICK-ABC123' });
  assert.match(text, /^Rohan's Diwali outfit is sorted/);
  assert.match(text, /so you two go together/);
});

test('invites wait until the agent answers Blueprint clients', () => {
  assert.equal(agentServesBlueprintClients({}), false);
  assert.equal(agentServesBlueprintClients({ ICONIK_AGENT_ENABLED: '1', ICONIK_AGENT_ALLOWED_PHONES: '919999999999' }), false);
  assert.equal(agentServesBlueprintClients({ ICONIK_AGENT_ENABLED: '1', ICONIK_AGENT_ALLOWED_PHONES: '919999999999,*' }), true);
  assert.equal(agentServesBlueprintClients({ ICONIK_AGENT_ENABLED: '1', ICONIK_AGENT_FREE_ENABLED: '1' }), true);
});

test('the email button opens WhatsApp with the request typed', () => {
  assert.equal(whatsappLink('+91 98765 43210', diwali.showText), `https://wa.me/919876543210?text=${encodeURIComponent('Show me my Diwali look 🪔')}`);
});

// ─── The Diwali outfit library ──────────────────────────────────────────────

import { readFileSync } from 'node:fs';
import { findManColourMentions } from './manOutfitColour.ts';
import {
  findOccasionOutfit,
  occasionOutfitText,
  parseOccasionLibrary,
  shortlistOccasionOutfits,
} from './agentOccasionLibrary.ts';

const library = parseOccasionLibrary(readFileSync(new URL('./ICONIK_Mens_Library_Diwali.md', import.meta.url), 'utf-8'));

test('the Diwali library has 200+ distinct, real looks across many shapes', () => {
  assert.ok(library.length >= 200, `only ${library.length} looks`);
  assert.equal(new Set(library.map(occasionOutfitText)).size, library.length, 'duplicate looks');
  assert.equal(new Set(library.map(outfit => outfit.id)).size, library.length, 'duplicate ids');
  const families = new Map<string, number>();
  for (const outfit of library) families.set(outfit.family, (families.get(outfit.family) ?? 0) + 1);
  assert.ok(families.size >= 10, 'too few shapes');
  // Every piece near the face and the bottom has a colour the matcher knows.
  for (const outfit of library) {
    for (const piece of [outfit.top, outfit.layer, outfit.bottom]) {
      if (piece) assert.ok(findManColourMentions(piece).length, `unknown colour in ${outfit.id}: ${piece}`);
    }
  }
});

const warmClient = {
  colour: {
    season: 'Deep Autumn', undertone: 'warm', skin_tone_depth: 'deep',
    primary_palette: [{ name: 'rust' }, { name: 'olive' }, { name: 'mustard' }, { name: 'bottle green' }],
    neutral_base_colours: ['cream', 'camel'],
    colours_to_avoid: [{ name: 'pale pink' }, { name: 'powder blue' }, { name: 'lavender' }],
  },
  style: { tribes: ['indian_casual'] },
};

test('a shortlist never puts his avoid colours near his face, and mixes shapes', () => {
  const shortlist = shortlistOccasionOutfits(library, warmClient, { count: 10, seed: 'a' });
  assert.equal(shortlist.length, 10);
  for (const outfit of shortlist) {
    const nearFace = `${outfit.top} ${outfit.layer ?? ''}`.toLowerCase();
    assert.doesNotMatch(nearFace, /pale pink|powder blue|lavender/);
  }
  const perFamily = new Map<string, number>();
  for (const outfit of shortlist) perFamily.set(outfit.family, (perFamily.get(outfit.family) ?? 0) + 1);
  assert.ok([...perFamily.values()].every(count => count <= 2));
  assert.ok(perFamily.size >= 5);
});

test('alternatives skip the look he saw and its shape', () => {
  const [first] = shortlistOccasionOutfits(library, warmClient, { count: 1, seed: 'b' });
  const shown = findOccasionOutfit(library, occasionOutfitText(first));
  assert.equal(shown?.id, first.id);
  const others = shortlistOccasionOutfits(library, warmClient, {
    count: 3, perFamily: 1, exclude: [occasionOutfitText(first)], avoidFamilies: [first.family], seed: 'c',
  });
  assert.equal(others.length, 3);
  assert.equal(new Set(others.map(outfit => outfit.family)).size, 3);
  assert.ok(others.every(outfit => outfit.family !== first.family));
});

test('"Show me another" uses the library alternatives word for word', () => {
  const section = occasionLookSection({
    campaign: 'diwali_2026', outfit: 'rust kurta', hook: 'the rust suits you', sentAt: '2026-10-22T05:00:00Z', response: 'another',
    alternatives: ['Olive green wool-blend bandhgala jacket, buttoned; Beige tailored trousers; Brown leather derby shoes'],
  }, new Date('2026-10-23T05:00:00Z'));
  assert.match(section, /word for word/);
  assert.match(section, /1\) Olive green wool-blend bandhgala jacket/);
});
