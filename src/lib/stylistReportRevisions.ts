/**
 * Client revision requests, as the workspace understands them.
 *
 * The brief is whatever the client wrote — usually a WhatsApp message the
 * stylist pastes in. This turns that message into a checklist she can work
 * through, keeping her own words intact underneath it, so a revision stops
 * living in her memory of the chat.
 */

export const REVISION_DUE_HOURS = 48;
export const MAX_REVISION_REQUEST_CHARS = 4000;
/** A pasted message becomes at most this many lines, so the checklist stays workable. */
export const MAX_PARSED_REVISION_ITEMS = 12;
// Stored checklists hold more: one line per revised look, and a client can ask
// for every look to be redone.
export const MAX_REVISION_SCOPE_ITEMS = 30;
const MAX_LABEL_CHARS = 200;

export interface RevisionScopeItem {
  id: string;
  label: string;
  /** A report page this item is about, when the client named one. */
  page_number?: number | null;
  /** The look the client named, counted the way she counts them: 1 is the first. */
  outfit_number?: number | null;
  done: boolean;
}

export interface StylistReportRevision {
  id: string;
  report_id: string;
  consultation_id: string | null;
  stylist_id: string | null;
  requested_by: 'client' | 'stylist' | 'admin';
  request_text: string;
  scope: RevisionScopeItem[];
  status: 'open' | 'published' | 'cancelled';
  published_version: number | null;
  due_at: string | null;
  published_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

/** A revision is a short turnaround on work the client has already paid for. */
export function revisionDueAt(from: number | Date = Date.now()) {
  const start = from instanceof Date ? from.getTime() : from;
  return new Date(start + REVISION_DUE_HOURS * 3_600_000).toISOString();
}

export function isRevisionOverdue(revision: Pick<StylistReportRevision, 'status' | 'due_at'>, now = Date.now()) {
  return revision.status === 'open' && Boolean(revision.due_at && Date.parse(revision.due_at) < now);
}

export function revisionProgress(revision: Pick<StylistReportRevision, 'scope'>) {
  const total = revision.scope.length;
  return { done: revision.scope.filter(item => item.done).length, total };
}

/** Pages the stylist needs to look at again, in report order. */
export function revisionScopePages(revision: Pick<StylistReportRevision, 'scope'>) {
  const pages = revision.scope.map(item => item.page_number).filter((page): page is number => Number.isInteger(page) && page! > 0);
  return [...new Set(pages)].sort((a, b) => a - b);
}

// --- Reading the client's message ------------------------------------------
// Deliberately boring string work, not a model call: it runs instantly while
// the stylist is looking at the paste box, and she corrects the checklist
// afterwards anyway. Anything it misses she can still add by hand.

/** "look 4", "outfit #4", "the 4th look", "look four". */
const OUTFIT_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const OUTFIT_PATTERNS: RegExp[] = [
  /\b(?:look|outfit|combination|combo)\s*#?\s*(\d{1,2})\b/i,
  /\b(\d{1,2})(?:st|nd|rd|th)\s+(?:look|outfit|combination|combo)\b/i,
];
const PAGE_PATTERN = /\bpage\s*#?\s*(\d{1,2})\b/i;

/** Whole-sentence pleasantries carry no work. */
const PLEASANTRY = /^(?:hi+|hey+|hello|thanks?(?:\s+(?:so|a)\s+much)?|thank\s+you|good\s+(?:morning|afternoon|evening|night)|ok(?:ay)?|sure|got\s+it|received|noted|great|nice|lovely|beautiful|gorgeous|amazing|perfect|wow|superb|excellent)\b[\s!.,😊🙏❤️🎉]*$/iu;

/** Words that mark a sentence as an ask rather than a comment. */
const CHANGE_SIGNAL = /\b(?:change|changed?|replace|swap|instead|another|other|different|add|remove|drop|redo|update|revise|revision|more|less|fewer|extra|again|avoid|prefer|rather|can\s+you|could\s+you|would\s+you|please|want|need|looking\s+for|not|n[o']t|never|too|very|little|bit|without|except|only|also)\b/i;

function numberFrom(sentence: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = sentence.match(pattern);
    if (match) return Number(match[1]);
  }
  const word = sentence.match(/\b(?:look|outfit)\s+(one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
  return word ? OUTFIT_WORDS.indexOf(word[1].toLowerCase()) + 1 : null;
}

/**
 * Splits a message the way a client writes one: line breaks and bullets first,
 * then sentence ends — including an emoji used as a full stop, and a full stop
 * followed by lower case, both of which are the norm on WhatsApp. Common
 * abbreviations ("Dr. Sindhura") are held back from splitting.
 */
const SENTENCE_SPLIT = /\r?\n+|(?:^|\s)[-•*–]\s+|(?<=[\p{Extended_Pictographic}\uFE0F])\s+(?=\S)|(?<!\b(?:dr|mr|mrs|ms|prof|sr|jr|vs|etc))(?<=[.!?…])\s+(?=\S)/giu;
/** A list marker at the start of a line, never a leading digit the client meant. */
const LIST_MARKER = /^(?:[-•*–]|\d{1,2}[.)])\s+/;

function sentences(text: string) {
  return text
    .split(SENTENCE_SPLIT)
    .map(part => (part ?? '').replace(LIST_MARKER, '').trim())
    .filter(Boolean);
}

function label(sentence: string) {
  const trimmed = sentence.replace(/\s+/g, ' ').trim();
  return trimmed.length > MAX_LABEL_CHARS ? `${trimmed.slice(0, MAX_LABEL_CHARS - 1).trimEnd()}…` : trimmed;
}

/**
 * The client's message as a checklist. Sentences that are only greetings or
 * praise are dropped; a message that reads as one continuous ask stays whole.
 */
export function parseRevisionRequest(text: string): RevisionScopeItem[] {
  const clean = text.slice(0, MAX_REVISION_REQUEST_CHARS).trim();
  if (!clean) return [];
  const asks = sentences(clean).filter(sentence => {
    if (PLEASANTRY.test(sentence)) return false;
    return CHANGE_SIGNAL.test(sentence) || OUTFIT_PATTERNS.some(pattern => pattern.test(sentence)) || PAGE_PATTERN.test(sentence);
  });
  // Nothing recognisable: give her the message itself as the single item rather
  // than an empty checklist she has to build from scratch.
  const items = (asks.length ? asks : [clean]).slice(0, MAX_PARSED_REVISION_ITEMS);
  return items.map((sentence, index) => {
    const page = numberFrom(sentence, [PAGE_PATTERN]);
    const outfit = numberFrom(sentence, OUTFIT_PATTERNS);
    return {
      id: `item-${index + 1}`,
      label: label(sentence),
      page_number: page,
      outfit_number: outfit,
      done: false,
    };
  });
}

/** Throws on anything a stylist's browser should not be able to store. */
export function assertRevisionScope(value: unknown): RevisionScopeItem[] {
  if (!Array.isArray(value)) throw new Error('A revision checklist must be a list.');
  if (value.length > MAX_REVISION_SCOPE_ITEMS) throw new Error(`A revision can hold at most ${MAX_REVISION_SCOPE_ITEMS} changes.`);
  return value.map((raw, index) => {
    const item = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    const text = typeof item.label === 'string' ? item.label.replace(/\s+/g, ' ').trim() : '';
    if (!text) throw new Error('Every change in the checklist needs a description.');
    const asNumber = (input: unknown) => {
      if (input == null || input === '') return null;
      const number = Number(input);
      return Number.isInteger(number) && number > 0 && number <= 200 ? number : null;
    };
    return {
      id: typeof item.id === 'string' && item.id.trim() ? item.id.trim().slice(0, 40) : `item-${index + 1}`,
      label: text.slice(0, MAX_LABEL_CHARS),
      page_number: asNumber(item.page_number),
      outfit_number: asNumber(item.outfit_number),
      done: item.done === true,
    };
  });
}

/** What to record as the brief when the stylist chose looks but pasted no message. */
export function revisionRequestForLooks(looks: number[]) {
  const names = [...new Set(looks)].sort((a, b) => a - b).map(look => `Look ${look}`);
  if (!names.length) return '';
  return `Revise ${names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]}.`;
}

/**
 * The checklist once revised looks exist: anything the client said about a
 * look points at the new page written for it, and a look she asked for without
 * saying why still gets its own line, so every new page is on the list.
 */
export function scopeWithRevisedLooks(scope: RevisionScopeItem[], added: Array<{ replaces: number; page_number: number }>): RevisionScopeItem[] {
  const pageFor = new Map(added.map(entry => [entry.replaces, entry.page_number]));
  const linked = scope.map(item => item.outfit_number && pageFor.has(item.outfit_number)
    ? { ...item, page_number: pageFor.get(item.outfit_number)! }
    : item);
  const mentioned = new Set(linked.map(item => item.outfit_number));
  const extra = added
    .filter(entry => !mentioned.has(entry.replaces))
    .map(entry => ({ id: `look-${entry.replaces}-${entry.page_number}`, label: `Write a new Look ${entry.replaces}`, page_number: entry.page_number, outfit_number: entry.replaces, done: false }));
  return [...linked, ...extra].slice(0, MAX_REVISION_SCOPE_ITEMS);
}

/** A second ask while one is open joins the same brief, with ids kept unique. */
export function mergeRevisionScope(existing: RevisionScopeItem[], incoming: RevisionScopeItem[]): RevisionScopeItem[] {
  const ids = new Set(existing.map(item => item.id));
  const seen = new Set(existing.map(item => `${item.outfit_number ?? ''}|${item.label.toLowerCase()}`));
  const merged = [...existing];
  for (const item of incoming) {
    const key = `${item.outfit_number ?? ''}|${item.label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    let id = item.id;
    for (let n = merged.length + 1; ids.has(id); n += 1) id = `item-${n}`;
    ids.add(id);
    merged.push({ ...item, id });
  }
  return merged.slice(0, MAX_REVISION_SCOPE_ITEMS);
}

/** Normalises a stored row, which may predate any field added later. */
export function revisionFromRow(row: Record<string, unknown>): StylistReportRevision {
  return {
    ...row,
    scope: Array.isArray(row.scope) ? row.scope as RevisionScopeItem[] : [],
  } as StylistReportRevision;
}
