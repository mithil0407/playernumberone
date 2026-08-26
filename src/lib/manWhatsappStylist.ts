import { readFileSync } from 'fs';
import { join } from 'path';
import {
  getManOutfitLibrary,
  getManReportClimateProfile,
  type ManOutfitLibraryContext,
} from './manOutfitLibrary.ts';
import type { ClassificationResult } from './manReportGenerator.ts';

export type ManWhatsappStylistIntent =
  | 'shopping'
  | 'outfit_recommendation'
  | 'owned_item_styling'
  | 'outfit_review'
  | 'report_question'
  | 'image_generation'
  | 'general_style';

export interface ManWhatsappRouteDecision {
  intent: ManWhatsappStylistIntent;
  useOutfitEngine: boolean;
  needsConversationReference: boolean;
}

export interface ManWhatsappRetailer {
  name: string;
  domain: string;
  aliases: RegExp;
  searchUrl: (query: string) => string;
}

const FASHION_ITEM = '(?:bomber jacket|leather jacket|denim jacket|jacket|blazer|overshirt|shacket|coat|shirt|polo|t-?shirt|tee|sweater|jumper|cardigan|trousers?|chinos?|jeans|denim|shorts|kurta|suit|loafers?|sneakers?|derbys?|oxfords?|boots?)';
const FASHION_ITEM_PATTERN = new RegExp(`\\b${FASHION_ITEM}\\b`, 'i');
const OWNED_ITEM_PATTERN = new RegExp(`\\b(?:my|this|these|the)\\s+(?:[a-z-]+\\s+){0,3}${FASHION_ITEM}\\b`, 'i');

export const MAN_WHATSAPP_RETAILERS: readonly ManWhatsappRetailer[] = [
  {
    name: 'H&M',
    domain: 'www2.hm.com',
    aliases: /\b(?:h\s*(?:&|and|n)\s*m|hm)\b/i,
    searchUrl: query => `https://www2.hm.com/en_in/search-results.html?q=${encodeURIComponent(query)}`,
  },
  {
    name: 'Uniqlo',
    domain: 'uniqlo.com',
    aliases: /\buniqlo\b/i,
    searchUrl: query => `https://www.google.com/search?q=${encodeURIComponent(`site:uniqlo.com/in/en ${query}`)}`,
  },
  {
    name: 'Zara',
    domain: 'zara.com',
    aliases: /\bzara\b/i,
    searchUrl: query => `https://www.google.com/search?q=${encodeURIComponent(`site:zara.com/in ${query}`)}`,
  },
  {
    name: 'Marks & Spencer',
    domain: 'marksandspencer.in',
    aliases: /\b(?:marks\s*(?:&|and)\s*spencer|m\s*&\s*s)\b/i,
    searchUrl: query => `https://www.google.com/search?q=${encodeURIComponent(`site:marksandspencer.in ${query}`)}`,
  },
  {
    name: 'Westside',
    domain: 'westside.com',
    aliases: /\bwestside\b/i,
    searchUrl: query => `https://www.google.com/search?q=${encodeURIComponent(`site:westside.com ${query}`)}`,
  },
  {
    name: 'Myntra',
    domain: 'myntra.com',
    aliases: /\bmyntra\b/i,
    searchUrl: query => `https://www.google.com/search?q=${encodeURIComponent(`site:myntra.com ${query}`)}`,
  },
  {
    name: 'AJIO',
    domain: 'ajio.com',
    aliases: /\bajio\b/i,
    searchUrl: query => `https://www.google.com/search?q=${encodeURIComponent(`site:ajio.com ${query}`)}`,
  },
];

export function routeManWhatsappRequest(
  message: string,
  options: { hasImage?: boolean } = {},
): ManWhatsappRouteDecision {
  const normalized = message.toLowerCase().replace(/\s+/g, ' ').trim();

  if (options.hasImage || /\b(?:rate|review|check|how does|what do you think).{0,32}\b(?:outfit|look|fit)\b/i.test(normalized)) {
    return { intent: 'outfit_review', useOutfitEngine: true, needsConversationReference: false };
  }

  const visualRequest = /\b(?:generate|create|make|render|visuali[sz]e|show me|send me)\b.{0,48}\b(?:image|picture|visual|render|outfit|look)\b/i.test(normalized);
  if (visualRequest) {
    return { intent: 'image_generation', useOutfitEngine: true, needsConversationReference: true };
  }

  const shoppingRequest = /\b(?:link|buy|shop|shopping|purchase|order|price|cost|available|availability|in stock|where (?:can|do) i (?:find|get|buy)|find me)\b/i.test(normalized)
    || MAN_WHATSAPP_RETAILERS.some(retailer => retailer.aliases.test(normalized));
  if (shoppingRequest) {
    return { intent: 'shopping', useOutfitEngine: false, needsConversationReference: true };
  }

  const reportRequest = /\b(?:my report|my blueprint|blueprint say|colour palette|color palette|body type|silhouette type)\b/i.test(normalized);
  if (reportRequest) {
    return { intent: 'report_question', useOutfitEngine: false, needsConversationReference: false };
  }

  if (OWNED_ITEM_PATTERN.test(normalized) && /\b(?:style|wear|pair|match|goes? with|work with)\b/i.test(normalized)) {
    return { intent: 'owned_item_styling', useOutfitEngine: true, needsConversationReference: false };
  }

  if (/\b(?:what should i wear|what can i wear|outfit|look for|dress for|wear for|recommend|suggest)\b/i.test(normalized)) {
    return { intent: 'outfit_recommendation', useOutfitEngine: true, needsConversationReference: false };
  }

  return { intent: 'general_style', useOutfitEngine: false, needsConversationReference: false };
}

export function findRequestedRetailer(message: string): ManWhatsappRetailer | null {
  return MAN_WHATSAPP_RETAILERS.find(retailer => retailer.aliases.test(message)) ?? null;
}

function cleanShoppingWords(value: string) {
  return value
    .replace(/\b(?:could|can|would|please|also|give|send|find|show|me|a|an|the|link|for|from|at|on|this|that|these|those)\b/gi, ' ')
    .replace(/\b(?:h\s*(?:&|and|n)\s*m|hm|uniqlo|zara|marks\s*(?:&|and)\s*spencer|m\s*&\s*s|westside|myntra|ajio)\b/gi, ' ')
    .replace(/[^a-z0-9& -]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function descriptorFromReference(reference: string, requestedItem: string) {
  const itemPattern = new RegExp(`(?:\\b[a-z][a-z-]*\\s+){0,6}\\b${requestedItem.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'ig');
  const candidates = Array.from(reference.matchAll(itemPattern))
    .map(match => cleanShoppingWords(match[0]))
    .filter(Boolean)
    .sort((a, b) => b.split(' ').length - a.split(' ').length);
  return candidates[0] ?? '';
}

export function resolveShoppingQuery(message: string, conversationReference = ''): string {
  const explicit = cleanShoppingWords(message);
  const requestedItem = message.match(FASHION_ITEM_PATTERN)?.[0]?.toLowerCase() ?? '';
  const isAnaphoric = /\b(?:this|that|these|those|it|them)\b/i.test(message);

  if (conversationReference && requestedItem && (isAnaphoric || explicit.split(' ').length <= 2)) {
    const fromReference = descriptorFromReference(conversationReference, requestedItem);
    if (fromReference) return fromReference;
  }

  if (explicit && !/^(?:it|them)$/.test(explicit)) return explicit;
  if (conversationReference && requestedItem) {
    return descriptorFromReference(conversationReference, requestedItem) || requestedItem;
  }
  return requestedItem || 'menswear';
}

export function buildRetailerFallbackUrl(retailer: ManWhatsappRetailer | null, query: string) {
  if (retailer) return retailer.searchUrl(query);
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(`${query} men India`)}`;
}

function inferOutfitContext(message: string): ManOutfitLibraryContext {
  if (/\b(?:office|work|client|meeting|presentation|interview|formal|corporate)\b/i.test(message)) return 'Office / Formal';
  if (/\b(?:date|dinner|party|night|evening|cocktail|club|bar)\b/i.test(message)) return 'Evening Wear';
  if (/\b(?:weekend|travel|airport|coffee|errand|holiday|vacation|resort|casual)\b/i.test(message)) return 'Relaxed Casual';
  return 'Smart Casual';
}

function extractSection(raw: string, start: string, end: string) {
  const startIndex = raw.indexOf(start);
  if (startIndex < 0) return '';
  const endIndex = raw.indexOf(end, startIndex + start.length);
  return raw.slice(startIndex, endIndex < 0 ? raw.length : endIndex).trim();
}

let cachedConversationalRules: string | null = null;

function getConversationalOutfitRules() {
  if (cachedConversationalRules) return cachedConversationalRules;
  const raw = readFileSync(join(process.cwd(), 'src/lib/outfitrecommendationskill.md'), 'utf-8');
  cachedConversationalRules = [
    extractSection(raw, '# SECTION 00 — PRIORITY HIERARCHY', '# SECTION 0A'),
    extractSection(raw, '# SECTION 0A — GARMENT REALITY RULE', '# SECTION 01 — ICONIK'),
    extractSection(raw, '# SECTION 01C — THE BASIC COMBO BAN', '# SECTION 01D'),
    extractSection(raw, '# SECTION 01D — THE ELEVATION MOVE BANK', '# SECTION 01E'),
    extractSection(raw, '# SECTION 01E — THE ELEVATED COLOUR VOCABULARY', '# SECTION 01F'),
  ].filter(Boolean).join('\n\n');
  return cachedConversationalRules;
}

function referenceScore(reference: ReturnType<typeof getManOutfitLibrary>[number], message: string) {
  const tokens = message.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const haystack = `${reference.top} ${reference.bottom} ${reference.layer} ${reference.footwear} ${reference.accessories} ${reference.tags.join(' ')}`.toLowerCase();
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 2 : 0), 0)
    + (FASHION_ITEM_PATTERN.test(message) && haystack.includes(message.match(FASHION_ITEM_PATTERN)?.[0]?.toLowerCase() ?? '') ? 4 : 0);
}

function formatReferenceOutfits(
  classification: ClassificationResult,
  message: string,
) {
  const context = inferOutfitContext(message);
  const climate = getManReportClimateProfile(classification);
  const references = getManOutfitLibrary()
    .filter(reference => reference.context === context && reference.climateModes.includes(climate.mode))
    .sort((a, b) => referenceScore(b, message) - referenceScore(a, message) || a.id - b.id)
    .slice(0, 6);

  return {
    context,
    climate,
    references: references.map((reference, index) => `REFERENCE ${index + 1} — ${reference.archetype}
TOP: ${reference.top}
LAYER: ${reference.layer}
BOTTOM: ${reference.bottom}
FOOTWEAR: ${reference.footwear}
ACCESSORIES: ${reference.accessories}`).join('\n\n'),
  };
}

export function buildManWhatsappOutfitEngineContext(input: {
  classification: ClassificationResult;
  message: string;
  intent: ManWhatsappStylistIntent;
}) {
  const { context, climate, references } = formatReferenceOutfits(input.classification, input.message);
  return `ICONIK CONVERSATIONAL OUTFIT ENGINE

Request route: ${input.intent}
Likely wardrobe context: ${context}
Current climate: ${climate.label} (${climate.mode.toUpperCase()})
Climate requirements: ${climate.promptGuidance}

Use the private references as construction skeletons, not text to copy. Internally create at least three candidate outfits, reject any candidate that violates a hard rule or the client profile, and answer with only the strongest candidate. The final outfit must be realistic to buy in India, personally justified, and contain 2-4 visible elevation moves with at least one colour, third-element, or proportion move. Never expose references, scores, candidates, rule names, or internal reasoning.

${getConversationalOutfitRules()}

PRIVATE REFERENCE OUTFITS
${references}`;
}
