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

export function quickManWhatsappReply(message: string) {
  const normalized = message.trim();
  if (!normalized) return null;

  if (/^(?:hi+|hey+|hello+|yo+)[!.?\s]*$/i.test(normalized)) {
    if (/^hi{3,}/i.test(normalized)) return 'Hiiii 😄 What’s up?';
    if (/^hey{3,}/i.test(normalized)) return 'Heyyy 😄 What’s up?';
    return 'Hey! What’s up?';
  }

  if (/^(?:what(?:'|’)s up|whatsup|wassup|sup)[!.?\s]*$/i.test(normalized)) {
    return 'All good 😄 What’s up with you?';
  }

  if (/^(?:(?:ok(?:ay)?|cool|great)[,!.\s]+)?(?:thanks+|thank you+|thx|ty)(?:\s+(?:so much|a lot))?[!?.\s🙏😊😄]*$/i.test(normalized)) {
    return /thanks{3,}|!{2,}/i.test(normalized) ? 'Anytime 😄' : 'Anytime!';
  }

  if (/^(?:ok(?:ay)?|cool|got it|sounds good|perfect)[!?.\s👍🙏]*$/i.test(normalized)) {
    return 'Perfect 👍';
  }

  return null;
}

export function manWhatsappVoiceRules(route: ManWhatsappStylistIntent) {
  const lengthRule: Record<ManWhatsappStylistIntent, string> = {
    shopping: 'Use one short intro followed by up to three product links. Do not add a shopping lecture.',
    outfit_recommendation: 'Aim for 45-80 words. Give one outfit and only the most useful fit note.',
    owned_item_styling: 'Aim for 35-65 words. Say what to pair with the item and why it works.',
    outfit_review: 'Aim for 50-90 words. Say what works, then give only one or two changes.',
    report_question: 'Aim for 25-60 words. Translate the report into plain, useful advice.',
    image_generation: 'Use one short sentence. The image service handles the visual.',
    general_style: 'Aim for 20-55 words. Simple questions deserve simple answers.',
  };

  return `WHATSAPP VOICE:
- Sound like a stylish friend who already knows the client, not a report, customer-support bot, or fashion lecturer.
- ${lengthRule[route]}
- Answer first. Use short sentences and everyday English. Match the client's casual energy without forcing slang.
- Use the client's name rarely, not as the default opening for a reply.
- Do not restate the client's profile, palette, body type, saved preferences, or the full reasoning behind the answer.
- Mention a saved preference only when it changes the recommendation. Never repeat it just to prove you remember it.
- Avoid technical styling language. Say "clean shape" instead of "architectural silhouette", "don't let the jeans bunch" instead of "controlled hem" or "full clean break", "layer" instead of "third element", and "warm, earthy colours" instead of naming a seasonal palette.
- Do not use the phrases "premium", "outfit direction", "architectural", "colour harmony", "elevation move", "controlled hem", "full clean fall", or "no ankle pooling" unless the client explicitly asks for a technical explanation.
- Do not give grooming, fragrance, body, or accessory advice unless the client asks or it is essential to the request.
- Use no more than three bullets, and only when a list is genuinely easier to read. Never use headings, tables, Markdown emphasis, or report-style labels such as "Top:" and "Bottom:".
- Do not end every reply with a question. Ask one short question only when the answer genuinely depends on it.
- If the client dislikes a look without explaining why, acknowledge it briefly and ask what felt wrong before replacing the whole outfit.
- If the client questions a surprising or wrong reply, acknowledge the mistake once and correct it briefly. Do not send another full recommendation or repeat the apology.
- Never invent a shopping link. Only share URLs present in VERIFIED SHOPPING LINKS.
- Never say you cannot create or send an image. The surrounding WhatsApp service handles explicit visual requests.`;
}

export function limitManWhatsappReply(body: string, route: ManWhatsappStylistIntent) {
  const hardLimits: Record<ManWhatsappStylistIntent, number> = {
    shopping: 180,
    outfit_recommendation: 100,
    owned_item_styling: 85,
    outfit_review: 110,
    report_question: 75,
    image_generation: 25,
    general_style: 75,
  };
  const limit = hardLimits[route];
  const matches = Array.from(body.matchAll(/\S+/g));
  if (matches.length <= limit) return body;

  const lastWord = matches[limit - 1];
  const end = (lastWord.index ?? 0) + lastWord[0].length;
  const candidate = body.slice(0, end).trimEnd();
  const minimumUsefulLength = Math.floor(candidate.length * 0.6);
  const sentenceEnd = Math.max(
    candidate.lastIndexOf('. '),
    candidate.lastIndexOf('! '),
    candidate.lastIndexOf('? '),
    candidate.lastIndexOf('.\n'),
    candidate.lastIndexOf('!\n'),
    candidate.lastIndexOf('?\n'),
  );
  if (sentenceEnd >= minimumUsefulLength) return candidate.slice(0, sentenceEnd + 1).trim();
  return `${candidate.replace(/[,:;—-]+$/, '')}…`;
}

export interface ManWhatsappRetailer {
  name: string;
  domain: string;
  aliases: RegExp;
  specialties: readonly ('sports' | 'general')[];
  searchUrl: (query: string) => string;
}

export type ManWhatsappShoppingOccasion =
  | 'football'
  | 'training'
  | 'running'
  | 'casual'
  | 'office'
  | 'formal'
  | 'evening';

export interface ManWhatsappShoppingIntent {
  query: string;
  garment: string | null;
  occasion: ManWhatsappShoppingOccasion | null;
  colours: string[];
  hardRequirements: string[];
  exclusions: string[];
  clarification: string | null;
}

export interface ManWhatsappProductCandidate {
  title: string;
  url: string;
  evidence?: string;
}

const FASHION_ITEM = '(?:bomber jacket|leather jacket|denim jacket|jacket|blazer|overshirt|shacket|coat|shirt|polo|t-?shirt|tee|sweater|jumper|cardigan|trousers?|chinos?|jeans|denim|shorts|kurta|suit|loafers?|sneakers?|derbys?|oxfords?|boots?)';
const FASHION_ITEM_PATTERN = new RegExp(`\\b${FASHION_ITEM}\\b`, 'i');
const OWNED_ITEM_PATTERN = new RegExp(`\\b(?:my|this|these|the)\\s+(?:[a-z-]+\\s+){0,3}${FASHION_ITEM}\\b`, 'i');

export const MAN_WHATSAPP_RETAILERS: readonly ManWhatsappRetailer[] = [
  {
    name: 'Nike',
    domain: 'nike.com',
    aliases: /\bnike\b/i,
    specialties: ['sports'],
    searchUrl: query => `https://www.nike.com/in/w?q=${encodeURIComponent(query)}&vst=${encodeURIComponent(query)}`,
  },
  {
    name: 'Adidas',
    domain: 'adidas.co.in',
    aliases: /\badidas\b/i,
    specialties: ['sports'],
    searchUrl: query => `https://www.adidas.co.in/search?q=${encodeURIComponent(query)}`,
  },
  {
    name: 'Puma',
    domain: 'in.puma.com',
    aliases: /\bpuma\b/i,
    specialties: ['sports'],
    searchUrl: query => `https://in.puma.com/in/en/search?q=${encodeURIComponent(query)}`,
  },
  {
    name: 'Decathlon',
    domain: 'decathlon.in',
    aliases: /\b(?:decathlon|kipsta)\b/i,
    specialties: ['sports'],
    searchUrl: query => `https://www.decathlon.in/search?query=${encodeURIComponent(query)}`,
  },
  {
    name: 'H&M',
    domain: 'www2.hm.com',
    aliases: /\b(?:h\s*(?:&|and|n)\s*m|hm)\b/i,
    specialties: ['general'],
    searchUrl: query => `https://www2.hm.com/en_in/search-results.html?q=${encodeURIComponent(query)}`,
  },
  {
    name: 'Uniqlo',
    domain: 'uniqlo.com',
    aliases: /\buniqlo\b/i,
    specialties: ['general'],
    searchUrl: query => `https://www.google.com/search?q=${encodeURIComponent(`site:uniqlo.com/in/en ${query}`)}`,
  },
  {
    name: 'Zara',
    domain: 'zara.com',
    aliases: /\bzara\b/i,
    specialties: ['general'],
    searchUrl: query => `https://www.google.com/search?q=${encodeURIComponent(`site:zara.com/in ${query}`)}`,
  },
  {
    name: 'Marks & Spencer',
    domain: 'marksandspencer.in',
    aliases: /\b(?:marks\s*(?:&|and)\s*spencer|m\s*&\s*s)\b/i,
    specialties: ['general'],
    searchUrl: query => `https://www.google.com/search?q=${encodeURIComponent(`site:marksandspencer.in ${query}`)}`,
  },
  {
    name: 'Westside',
    domain: 'westside.com',
    aliases: /\bwestside\b/i,
    specialties: ['general'],
    searchUrl: query => `https://www.google.com/search?q=${encodeURIComponent(`site:westside.com ${query}`)}`,
  },
  {
    name: 'Myntra',
    domain: 'myntra.com',
    aliases: /\bmyntra\b/i,
    specialties: ['sports', 'general'],
    searchUrl: query => `https://www.google.com/search?q=${encodeURIComponent(`site:myntra.com ${query}`)}`,
  },
  {
    name: 'AJIO',
    domain: 'ajio.com',
    aliases: /\bajio\b/i,
    specialties: ['sports', 'general'],
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

  const bareVisualFollowup = /^(?:please\s+)?(?:show|send)(?:\s+it|\s+me)?(?:\s+please)?[.!?]*$/i.test(normalized);
  const visualRequest = bareVisualFollowup
    || /\b(?:generate|create|make|render|visuali[sz]e|show me|send me)\b.{0,48}\b(?:image|picture|visual|render|outfit|look)\b/i.test(normalized);
  if (visualRequest) {
    return { intent: 'image_generation', useOutfitEngine: true, needsConversationReference: true };
  }

  const shoppingRequest = /\b(?:links?|buy|shop|shopping|purchase|order|price|cost|available|availability|in stock|where (?:can|do) i (?:find|get|buy)|find me)\b/i.test(normalized);
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
    const vagueContinuation = /\b(?:another|different|new|one more)\s+(?:outfit|look)\b/i.test(normalized);
    return { intent: 'outfit_recommendation', useOutfitEngine: true, needsConversationReference: vagueContinuation };
  }

  return { intent: 'general_style', useOutfitEngine: false, needsConversationReference: false };
}

export function findRequestedRetailer(message: string): ManWhatsappRetailer | null {
  return MAN_WHATSAPP_RETAILERS.find(retailer => retailer.aliases.test(message)) ?? null;
}

function cleanShoppingWords(value: string) {
  return value
    .replace(/\b(?:could|can|would|please|also|give|send|find|show|me|a|an|the|link|for|from|at|on|this|that|these|those)\b/gi, ' ')
    .replace(/\b(?:nike|adidas|puma|decathlon|kipsta|h\s*(?:&|and|n)\s*m|hm|uniqlo|zara|marks\s*(?:&|and)\s*spencer|m\s*&\s*s|westside|myntra|ajio)\b/gi, ' ')
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

const COLOUR_PATTERNS: ReadonlyArray<{ name: string; pattern: RegExp }> = [
  { name: 'black', pattern: /\bblack\b/i },
  { name: 'navy', pattern: /\b(?:navy|deep navy)\b/i },
  { name: 'white', pattern: /\bwhite\b/i },
  { name: 'grey', pattern: /\b(?:grey|gray)\b/i },
  { name: 'charcoal', pattern: /\bcharcoal\b/i },
  { name: 'olive', pattern: /\bolive\b/i },
  { name: 'green', pattern: /\bgreen\b/i },
  { name: 'blue', pattern: /\bblue\b/i },
  { name: 'red', pattern: /\bred\b/i },
  { name: 'burgundy', pattern: /\b(?:burgundy|maroon)\b/i },
  { name: 'brown', pattern: /\bbrown\b/i },
  { name: 'tan', pattern: /\btan\b/i },
  { name: 'beige', pattern: /\bbeige\b/i },
  { name: 'cream', pattern: /\b(?:cream|ecru|off-white)\b/i },
  { name: 'khaki', pattern: /\bkhaki\b/i },
];

function detectColours(value: string) {
  return COLOUR_PATTERNS.filter(colour => colour.pattern.test(value)).map(colour => colour.name);
}

function detectShoppingOccasion(value: string): ManWhatsappShoppingOccasion | null {
  if (/\b(?:football|soccer|on the pitch|football training)\b/i.test(value)) return 'football';
  if (/\b(?:gym|workout|training|athletic|sportswear|performance)\b/i.test(value)) return 'training';
  if (/\b(?:running|jogging|run in)\b/i.test(value)) return 'running';
  if (/\b(?:office|workwear|client meeting|corporate)\b/i.test(value)) return 'office';
  if (/\b(?:formal|wedding|black tie)\b/i.test(value)) return 'formal';
  if (/\b(?:date night|dinner|party|evening|club|bar)\b/i.test(value)) return 'evening';
  if (/\b(?:casual|coffee|weekend|everyday|day out|relaxed)\b/i.test(value)) return 'casual';
  return null;
}

function normalizeGarment(value: string) {
  const normalized = value.toLowerCase().replace(/-/g, ' ');
  if (/^t ?shirt$/.test(normalized)) return 't-shirt';
  if (/^trouser$/.test(normalized)) return 'trousers';
  if (/^chino$/.test(normalized)) return 'chinos';
  if (/^short$/.test(normalized)) return 'shorts';
  if (/^loafer$/.test(normalized)) return 'loafers';
  if (/^sneaker$/.test(normalized)) return 'sneakers';
  if (/^boot$/.test(normalized)) return 'boots';
  return normalized;
}

function garmentsIn(value: string) {
  return Array.from(value.matchAll(new RegExp(`\\b${FASHION_ITEM}\\b`, 'ig')))
    .map(match => normalizeGarment(match[0]));
}

export function buildManWhatsappShoppingIntent(
  message: string,
  conversationReference = '',
): ManWhatsappShoppingIntent {
  const requestedGarment = message.match(FASHION_ITEM_PATTERN)?.[0];
  const referenceGarments = [...new Set(garmentsIn(conversationReference))];
  const anaphoric = /\b(?:this|that|these|those|it|them|same|similar)\b/i.test(message);
  const garment = requestedGarment
    ? normalizeGarment(requestedGarment)
    : anaphoric && referenceGarments.length === 1
      ? referenceGarments[0]
      : null;
  const referenceDescriptor = garment
    ? descriptorFromReference(conversationReference, garment)
    : '';
  const messageOccasion = detectShoppingOccasion(message);
  const referenceOccasion = detectShoppingOccasion(referenceDescriptor) ?? detectShoppingOccasion(conversationReference);
  const occasion = messageOccasion ?? referenceOccasion;
  const messageColours = detectColours(message);
  const colours = messageColours.length
    ? messageColours
    : detectColours(referenceDescriptor);

  let clarification: string | null = null;
  if (!garment) {
    clarification = referenceGarments.length > 1
      ? `Which item do you want links for: ${referenceGarments.slice(0, 3).join(', ')}?`
      : 'Which item do you want me to find?';
  }

  const hardRequirements = [
    garment ? `men's ${garment}` : '',
    occasion ? `suitable for ${occasion}` : '',
    colours.length ? `colour must be ${colours.join(' or ')}` : '',
  ].filter(Boolean);
  const exclusions: string[] = [];
  if (occasion === 'football' || occasion === 'training' || occasion === 'running') {
    exclusions.push('cotton twill', 'chino', 'denim', 'cargo', 'casual-only');
  }
  if (occasion === 'casual') exclusions.push('football kit', 'match kit');

  const resolved = resolveShoppingQuery(message, conversationReference);
  const queryParts = [
    "men's",
    colours.length ? colours.join(' or ') : '',
    occasion ?? '',
    garment ?? resolved,
  ].filter(Boolean);

  return {
    query: queryParts.join(' ').replace(/\s+/g, ' ').trim(),
    garment,
    occasion,
    colours,
    hardRequirements,
    exclusions,
    clarification,
  };
}

export function retailersForShoppingIntent(
  intent: ManWhatsappShoppingIntent,
  requestedRetailer: ManWhatsappRetailer | null,
) {
  if (requestedRetailer) return [requestedRetailer];
  const performance = intent.occasion === 'football' || intent.occasion === 'training' || intent.occasion === 'running';
  return MAN_WHATSAPP_RETAILERS.filter(retailer => !performance || retailer.specialties.includes('sports'));
}

function likelyProductPage(urlValue: string) {
  try {
    const url = new URL(urlValue);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    if (host.endsWith('nike.com')) return /\/(?:in\/)?t\//.test(path);
    if (host.endsWith('adidas.co.in')) return /\/(?:[^/]+\/)?[^/]+\.html$/.test(path) || /\/product\//.test(path);
    if (host.endsWith('puma.com')) return /\.html$/.test(path);
    if (host.endsWith('decathlon.in')) return /\/p\//.test(path);
    if (host.endsWith('myntra.com')) return /\/buy\/?$/.test(path);
    if (host.endsWith('ajio.com')) return /\/p\//.test(path);
    if (host.endsWith('hm.com')) return /\/productpage\./.test(path);
    if (host.endsWith('uniqlo.com')) return /\/products\//.test(path);
    if (host.endsWith('zara.com')) return /-p\d+\.html$/.test(path);
    if (host.endsWith('marksandspencer.in')) return /\/(?:p|products?)\//.test(path);
    if (host.endsWith('westside.com')) return /\/products\//.test(path);
    return false;
  } catch {
    return false;
  }
}

function garmentMatches(garment: string, haystack: string) {
  const root = garment.replace(/s$/, '').replace(/[^a-z0-9]+/g, '[ -]?');
  return new RegExp(`\\b${root}s?\\b`, 'i').test(haystack);
}

function sourceRank(urlValue: string) {
  try {
    const host = new URL(urlValue).hostname.toLowerCase();
    const index = MAN_WHATSAPP_RETAILERS.findIndex(retailer => host === retailer.domain || host.endsWith(`.${retailer.domain}`));
    return index < 0 ? MAN_WHATSAPP_RETAILERS.length : index;
  } catch {
    return MAN_WHATSAPP_RETAILERS.length;
  }
}

export function rankMatchingShoppingProducts(
  intent: ManWhatsappShoppingIntent,
  candidates: ManWhatsappProductCandidate[],
) {
  if (!intent.garment) return [];
  const rejectedMaterials = /\b(?:cotton twill|twill|chino|denim|cargo|casual)\b/i;
  const performanceEvidence = /\b(?:football|soccer|training|performance|sports?|dri-?fit|aeroready|drycell|kipsta|academy)\b/i;
  const casualEvidence = /\b(?:casual|everyday|cotton|twill|chino)\b/i;

  return candidates
    .map(candidate => {
      const haystack = `${candidate.title} ${candidate.url} ${candidate.evidence ?? ''}`.replace(/[_-]+/g, ' ');
      if (!likelyProductPage(candidate.url) || !garmentMatches(intent.garment!, haystack)) return null;
      if (intent.colours.length && !intent.colours.some(colour => new RegExp(`\\b${colour}\\b`, 'i').test(haystack))) return null;
      if (intent.occasion === 'football' || intent.occasion === 'training' || intent.occasion === 'running') {
        if (!performanceEvidence.test(haystack) || rejectedMaterials.test(haystack)) return null;
      }
      if (intent.occasion === 'casual' && /\b(?:football|soccer|match kit)\b/i.test(haystack) && !casualEvidence.test(haystack)) return null;

      let score = 10;
      if (intent.colours.some(colour => new RegExp(`\\b${colour}\\b`, 'i').test(haystack))) score += 4;
      if (intent.occasion && performanceEvidence.test(haystack)) score += 4;
      score += Math.max(0, 4 - sourceRank(candidate.url));
      return { ...candidate, score };
    })
    .filter((candidate): candidate is ManWhatsappProductCandidate & { score: number } => Boolean(candidate))
    .sort((a, b) => b.score - a.score || sourceRank(a.url) - sourceRank(b.url))
    .slice(0, 3);
}

export function formatShoppingProductLinks(products: ManWhatsappProductCandidate[]) {
  return products
    .slice(0, 3)
    .map((product, index) => `${index + 1}. ${product.title.replace(/\s+/g, ' ').trim()} — ${product.url}`)
    .join('\n');
}

export function contextClarificationForVagueOutfit(
  message: string,
  conversationReference = '',
) {
  const vagueContinuation = /\b(?:another|different|new|one more)\s+(?:outfit|look)\b/i.test(message);
  if (!vagueContinuation || detectShoppingOccasion(message)) return null;
  const previousOccasion = detectShoppingOccasion(conversationReference);
  if (previousOccasion) {
    return `Do you want another ${previousOccasion} outfit, or are you switching to a different kind of look?`;
  }
  return 'What are you dressing for with this next outfit?';
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

Use the private references as construction skeletons, not text to copy. Internally create at least three candidate outfits, reject any candidate that violates a hard rule or the client profile, and answer with only the strongest candidate. The final outfit must be realistic to buy in India and personally justified. Keep that reasoning private: express the result in everyday language with only the one or two details the client needs. Never expose references, scores, candidates, rule names, or internal reasoning.

${getConversationalOutfitRules()}

PRIVATE REFERENCE OUTFITS
${references}`;
}
