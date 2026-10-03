// The ICONIK agent's memory, organised the way people remember someone close:
//
//   portrait (root)     a few sentences on who this person is
//   └ branches          one per life area, each with a gist ("knows she hates
//                       anything clingy, loves earthy colours…")
//      ├ facts          durable semantic memories, optionally under a topic
//      │                path such as style/likes or body/sizes
//      └ episodes       things that happened ("12 Oct: loved the emerald
//                       kurta for the sangeet, rejected pastels")
//
// Memories strengthen with evidence and every recall, fade with time unless they
// matter, and are superseded rather than overwritten when the client changes
// their mind. Consolidation (like sleep) periodically folds a branch's leaves
// into its gist and archives stale episodes.
//
// This module is pure: scoring, selection, rendering and operation validation.
// Persistence lives in agentMemoryStore.ts.

export const MEMORY_BRANCHES = [
  { key: 'identity', title: 'Who they are', hint: 'how they like to be addressed, work, city, personality, life stage' },
  { key: 'body', title: 'Body, fit & sizes', hint: 'sizes by brand, fits they like, comfort limits, coverage needs' },
  { key: 'colour', title: 'Colours', hint: 'colours they love or avoid, beyond the report' },
  { key: 'style', title: 'Style & taste', hint: 'aesthetic, silhouettes, fabrics, likes and dislikes' },
  { key: 'wardrobe', title: 'Wardrobe', hint: 'items they already own' },
  { key: 'lifestyle', title: 'Life & routine', hint: 'work dress code, climate, routines, cultural dressing they mention' },
  { key: 'people', title: 'People', hint: 'partner, family and friends who matter in what they wear' },
  { key: 'occasions', title: 'Occasions & plans', hint: 'events and plans, past and upcoming' },
  { key: 'shopping', title: 'Shopping & budget', hint: 'brands, stores, budget, delivery, how they like to buy' },
  { key: 'feedback', title: 'Reactions to our suggestions', hint: 'what landed and what did not' },
] as const;

export type MemoryBranchKey = typeof MEMORY_BRANCHES[number]['key'];
export const MEMORY_BRANCH_KEYS = MEMORY_BRANCHES.map(branch => branch.key) as readonly MemoryBranchKey[];

export const MEMORY_TYPES = ['constraint', 'preference', 'fact', 'wardrobe', 'person', 'feedback', 'plan'] as const;
export type MemoryType = typeof MEMORY_TYPES[number];

export type MemoryNodeKind = 'root' | 'branch' | 'fact' | 'episode';
export type MemoryNodeStatus = 'active' | 'superseded' | 'archived';

export interface MemoryNode {
  id: string;
  parentId: string | null;
  kind: MemoryNodeKind;
  path: string;
  title: string;
  content: string;
  memoryType: MemoryType | null;
  importance: number;
  confidence: number;
  evidenceCount: number;
  recallCount: number;
  lastRecalledAt: string | null;
  occurredAt: string | null;
  validUntil: string | null;
  status: MemoryNodeStatus;
  createdAt: string;
  updatedAt: string;
}

export const ROOT_PATH = 'root';
const DAY_MS = 24 * 60 * 60 * 1000;

export function isMemoryBranchKey(value: unknown): value is MemoryBranchKey {
  return typeof value === 'string' && (MEMORY_BRANCH_KEYS as readonly string[]).includes(value);
}

export function branchOfPath(path: string): MemoryBranchKey | null {
  const head = path.split('/')[0];
  return isMemoryBranchKey(head) ? head : null;
}

/** Topic segments are short lowercase slugs: style/likes, body/sizes/zara. */
export function buildMemoryPath(branch: MemoryBranchKey, topic?: string | null) {
  const slug = (topic ?? '')
    .toLowerCase()
    .split('/')
    .map(part => part.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .filter(Boolean)
    .slice(0, 2)
    .join('/');
  return slug ? `${branch}/${slug}` : branch;
}

/**
 * How vividly this memory is held right now, 0-1. Constraints ("never
 * sleeveless") never fade; episodes fade within weeks; facts fade over months,
 * slower the more important they are. Evidence and recall reinforce.
 */
export function memoryStrength(node: MemoryNode, now = new Date()) {
  if (node.status !== 'active') return 0;
  if (node.validUntil && new Date(node.validUntil).getTime() < now.getTime()) return 0;

  const anchor = node.lastRecalledAt ?? node.updatedAt ?? node.createdAt;
  const ageDays = Math.max(0, (now.getTime() - new Date(anchor).getTime()) / DAY_MS);
  const halfLifeDays = node.memoryType === 'constraint'
    ? Number.POSITIVE_INFINITY
    : node.kind === 'episode'
      ? 21
      : 120 * (0.5 + node.importance);
  const recency = Number.isFinite(halfLifeDays) ? Math.pow(0.5, ageDays / halfLifeDays) : 1;
  const reinforcement = Math.min(
    1,
    0.6 + 0.2 * Math.log2(1 + Math.max(1, node.evidenceCount)) + 0.05 * Math.log2(1 + node.recallCount),
  );
  const value = node.importance * (0.6 + 0.4 * node.confidence) * (0.35 + 0.65 * recency) * reinforcement;
  return Math.max(0, Math.min(1, value));
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'what', 'which', 'have', 'has', 'are', 'was', 'were', 'you',
  'your', 'can', 'should', 'would', 'could', 'something', 'some', 'any', 'about', 'from', 'like', 'just',
  'want', 'need', 'get', 'got', 'also', 'but', 'not', 'how', 'its', 'it\'s', 'too', 'very', 'more', 'all',
  'one', 'there', 'their', 'them', 'they', 'she', 'her', 'his', 'him', 'our', 'out', 'into', 'then', 'than',
  'will', 'wear', 'look', 'please', 'help', 'me', 'my', 'i\'m',
]);

export function memoryTokens(text: string) {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s'-]+/g, ' ')
      .split(/\s+/)
      .map(token => token.replace(/^['-]+|['-]+$/g, ''))
      .filter(token => token.length >= 3 && !STOPWORDS.has(token)),
  );
}

const BRANCH_CUES: Array<{ branch: MemoryBranchKey; pattern: RegExp }> = [
  { branch: 'body', pattern: /\b(?:size|sizes|fit|fits|fitting|tight|loose|length|waist|chest|petite|tall|short|xs|xl|xxl)\b/i },
  { branch: 'colour', pattern: /\b(?:colou?rs?|shade|tone|black|white|navy|beige|olive|emerald|maroon|pastel|neon|red|blue|green|pink|yellow|brown|grey|gray)\b/i },
  { branch: 'occasions', pattern: /\b(?:wedding|sangeet|mehendi|mehndi|haldi|reception|party|date|interview|meeting|trip|vacation|festival|diwali|navratri|eid|puja|birthday|event|function|office party)\b/i },
  { branch: 'wardrobe', pattern: /\b(?:i have|i own|my (?:black|white|blue|navy|old|new)|already have|in my wardrobe|in my closet)\b/i },
  { branch: 'shopping', pattern: /\b(?:buy|shop|shopping|brand|budget|price|under|rs|₹|inr|myntra|ajio|zara|h&m|uniqlo|westside|order|delivery)\b/i },
  { branch: 'people', pattern: /\b(?:wife|husband|partner|girlfriend|boyfriend|mom|mum|mother|dad|father|sister|brother|friend|family|in-laws|boss)\b/i },
  { branch: 'lifestyle', pattern: /\b(?:office|work|weekend|gym|travel|commute|weather|hot|humid|rain|winter|summer)\b/i },
  { branch: 'style', pattern: /\b(?:style|vibe|aesthetic|outfit|look|classy|casual|formal|ethnic|kurta|saree|lehenga|dress|shirt|jeans|trousers|blazer|shoes|sneakers)\b/i },
];

export function cuedBranches(text: string) {
  const branches = new Set<MemoryBranchKey>();
  for (const cue of BRANCH_CUES) {
    if (cue.pattern.test(text)) branches.add(cue.branch);
  }
  return branches;
}

export function memoryRelevance(node: MemoryNode, queryTokens: Set<string>, branches: Set<MemoryBranchKey>) {
  const nodeTokens = memoryTokens(`${node.title} ${node.content} ${node.path.replace(/\//g, ' ')}`);
  let overlap = 0;
  for (const token of queryTokens) {
    if (nodeTokens.has(token)) overlap += 1;
  }
  const lexical = nodeTokens.size ? overlap / Math.sqrt(nodeTokens.size) : 0;
  const branch = branchOfPath(node.path);
  return Math.min(1.5, lexical + (branch && branches.has(branch) ? 0.35 : 0));
}

export interface MemorySelection {
  text: string;
  /** Nodes surfaced to the model this turn (for recall reinforcement). */
  recalledIds: string[];
  /** Short refs (m1, m2…) shown to the reflection pass, mapped to node ids. */
  refs: Map<string, string>;
}

export interface SelectMemoryOptions {
  now?: Date;
  maxFacts?: number;
  maxEpisodes?: number;
  maxConstraints?: number;
  /** Prefix each leaf with a short ref so a reflection pass can point at it. */
  withRefs?: boolean;
}

function formatEvidence(node: MemoryNode) {
  const sure = node.confidence >= 0.9 ? 'sure' : node.confidence >= 0.75 ? 'likely' : 'tentative';
  return node.evidenceCount > 1 ? `${sure}, ×${node.evidenceCount}` : sure;
}

function formatEpisodeDate(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return `${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}: `;
}

/**
 * Picks what the agent should "have in mind" for this message, the way a person
 * recalls: the portrait and branch gists always, hard constraints always, then
 * the strongest memories most related to what was just said.
 */
export function selectMemoriesForTurn(
  nodes: MemoryNode[],
  message: string,
  options: SelectMemoryOptions = {},
): MemorySelection {
  const now = options.now ?? new Date();
  const maxFacts = options.maxFacts ?? 14;
  const maxEpisodes = options.maxEpisodes ?? 4;
  const maxConstraints = options.maxConstraints ?? 10;
  const queryTokens = memoryTokens(message);
  const branches = cuedBranches(message);
  const active = nodes.filter(node => memoryStrength(node, now) > 0 || node.kind === 'root' || node.kind === 'branch');
  const activeStructural = active.filter(node => node.status === 'active');

  const root = activeStructural.find(node => node.kind === 'root');
  const branchNodes = activeStructural.filter(node => node.kind === 'branch');
  const leaves = active.filter(node => (node.kind === 'fact' || node.kind === 'episode') && node.status === 'active');

  const constraints = leaves
    .filter(node => node.kind === 'fact' && node.memoryType === 'constraint')
    .sort((a, b) => memoryStrength(b, now) - memoryStrength(a, now))
    .slice(0, maxConstraints);
  const constraintIds = new Set(constraints.map(node => node.id));

  const facts = leaves
    .filter(node => node.kind === 'fact' && !constraintIds.has(node.id))
    .map(node => ({ node, score: memoryStrength(node, now) * (0.4 + memoryRelevance(node, queryTokens, branches)) }))
    .filter(item => item.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxFacts)
    .map(item => item.node);

  const episodes = leaves
    .filter(node => node.kind === 'episode')
    .map(node => {
      const relevance = memoryRelevance(node, queryTokens, branches);
      const ageDays = (now.getTime() - new Date(node.occurredAt ?? node.createdAt).getTime()) / DAY_MS;
      return { node, relevance, ageDays, score: memoryStrength(node, now) * (0.2 + relevance) };
    })
    .filter(item => item.relevance > 0 || item.ageDays <= 14)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxEpisodes)
    .map(item => item.node);

  const selectedLeaves = [...constraints, ...facts, ...episodes];
  const refs = new Map<string, string>();
  const refFor = (node: MemoryNode) => {
    if (!options.withRefs) return '';
    const ref = `m${refs.size + 1}`;
    refs.set(ref, node.id);
    return `(${ref}) `;
  };

  const lines: string[] = [];
  lines.push(`PORTRAIT: ${root?.content.trim() || 'Not written yet — you are still getting to know them.'}`);

  for (const branch of MEMORY_BRANCHES) {
    const branchNode = branchNodes.find(node => node.path === branch.key);
    const branchLeaves = selectedLeaves.filter(node => branchOfPath(node.path) === branch.key);
    if (!branchNode?.content.trim() && !branchLeaves.length) continue;
    lines.push(`${branch.key} — ${branch.title}${branchNode?.content.trim() ? `: ${branchNode.content.trim()}` : ''}`);
    for (const node of branchLeaves) {
      if (node.kind === 'episode') {
        lines.push(`  ◦ ${refFor(node)}${formatEpisodeDate(node.occurredAt ?? node.createdAt)}${node.content}`);
      } else {
        const topic = node.path.includes('/') ? `${node.path.split('/').slice(1).join('/')} · ` : '';
        lines.push(`  • ${refFor(node)}[${node.memoryType ?? 'fact'}] ${topic}${node.content} (${formatEvidence(node)})`);
      }
    }
  }

  return {
    text: lines.join('\n'),
    recalledIds: selectedLeaves.map(node => node.id),
    refs,
  };
}

/** Deep recall for the agent's recall_memory tool: searches every active leaf. */
export function searchMemories(nodes: MemoryNode[], query: string, limit = 8, now = new Date()) {
  const queryTokens = memoryTokens(query);
  const branches = cuedBranches(query);
  return nodes
    .filter(node => (node.kind === 'fact' || node.kind === 'episode') && node.status === 'active')
    .map(node => ({ node, score: memoryRelevance(node, queryTokens, branches) * (0.3 + memoryStrength(node, now)) }))
    .filter(item => item.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.node);
}

// ── Memory operations (written by the reflection pass and the remember tool) ──

export type MemoryOperation =
  | {
      op: 'add';
      branch: MemoryBranchKey;
      topic: string | null;
      kind: 'fact' | 'episode';
      memoryType: MemoryType;
      content: string;
      importance: number;
      confidence: number;
      validUntil: string | null;
      occurredAt: string | null;
    }
  | { op: 'reinforce'; nodeId: string }
  | { op: 'update'; nodeId: string; content: string; importance: number | null }
  | { op: 'supersede'; nodeId: string; content: string; importance: number | null; memoryType: MemoryType | null }
  | { op: 'archive'; nodeId: string };

function clamp01(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

function cleanText(value: unknown, max = 280) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function isoOrNull(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

export function textSimilarity(a: string, b: string) {
  const left = memoryTokens(a);
  const right = memoryTokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / (left.size + right.size - shared);
}

export const MIN_MEMORY_CONFIDENCE = 0.7;
export const MAX_MEMORY_OPERATIONS = 6;

/**
 * Validates operations proposed by a model. Unknown refs and branches are
 * dropped, low-confidence adds are ignored, and an add that restates an
 * existing memory becomes a reinforcement instead of a duplicate.
 */
export function normalizeMemoryOperations(
  raw: unknown,
  refs: Map<string, string>,
  existing: MemoryNode[],
): MemoryOperation[] {
  if (!Array.isArray(raw)) return [];
  const byId = new Map(existing.map(node => [node.id, node]));
  const resolve = (value: unknown) => {
    const ref = typeof value === 'string' ? value.trim() : '';
    const id = refs.get(ref) ?? (byId.has(ref) ? ref : null);
    return id && byId.get(id)?.status === 'active' ? id : null;
  };

  const operations: MemoryOperation[] = [];
  const touched = new Set<string>();
  for (const item of raw) {
    if (operations.length >= MAX_MEMORY_OPERATIONS) break;
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const op = record.op;

    if (op === 'add') {
      const branch = record.branch;
      const content = cleanText(record.content);
      const kind = record.kind === 'episode' ? 'episode' : 'fact';
      const memoryType = MEMORY_TYPES.includes(record.memory_type as MemoryType)
        ? record.memory_type as MemoryType
        : kind === 'episode' ? 'feedback' : 'fact';
      const confidence = clamp01(record.confidence, 0);
      if (!isMemoryBranchKey(branch) || !content || confidence < MIN_MEMORY_CONFIDENCE) continue;

      const duplicate = existing.find(node => (
        node.status === 'active'
        && node.kind === kind
        && branchOfPath(node.path) === branch
        && textSimilarity(node.content, content) >= 0.75
      ));
      if (duplicate) {
        if (!touched.has(duplicate.id)) {
          operations.push({ op: 'reinforce', nodeId: duplicate.id });
          touched.add(duplicate.id);
        }
        continue;
      }

      operations.push({
        op: 'add',
        branch,
        topic: cleanText(record.topic, 40) || null,
        kind,
        memoryType,
        content,
        importance: clamp01(record.importance, memoryType === 'constraint' ? 0.9 : 0.5),
        confidence,
        validUntil: isoOrNull(record.valid_until),
        occurredAt: kind === 'episode' ? isoOrNull(record.occurred_at) ?? new Date().toISOString() : null,
      });
      continue;
    }

    const nodeId = resolve(record.ref);
    if (!nodeId || touched.has(nodeId)) continue;
    const node = byId.get(nodeId)!;
    if (node.kind === 'root' || node.kind === 'branch') continue;

    if (op === 'reinforce' || op === 'archive') {
      operations.push({ op, nodeId });
      touched.add(nodeId);
    } else if (op === 'update' || op === 'supersede') {
      const content = cleanText(record.content);
      if (!content) continue;
      const importance = typeof record.importance === 'number' ? clamp01(record.importance, node.importance) : null;
      if (op === 'update') {
        operations.push({ op, nodeId, content, importance });
      } else {
        const memoryType = MEMORY_TYPES.includes(record.memory_type as MemoryType)
          ? record.memory_type as MemoryType
          : null;
        operations.push({ op, nodeId, content, importance, memoryType });
      }
      touched.add(nodeId);
    }
  }
  return operations;
}

/** Whether a branch has grown enough leaves that it should be consolidated. */
export function branchesNeedingConsolidation(nodes: MemoryNode[], now = new Date()) {
  const due: MemoryBranchKey[] = [];
  for (const branch of MEMORY_BRANCH_KEYS) {
    const leaves = nodes.filter(node => (
      node.status === 'active'
      && (node.kind === 'fact' || node.kind === 'episode')
      && branchOfPath(node.path) === branch
    ));
    const staleEpisodes = leaves.filter(node => (
      node.kind === 'episode'
      && (now.getTime() - new Date(node.occurredAt ?? node.createdAt).getTime()) / DAY_MS > 30
    ));
    const gist = nodes.find(node => node.kind === 'branch' && node.path === branch)?.content.trim() ?? '';
    if (leaves.length > 10 || staleEpisodes.length >= 4 || (!gist && leaves.length >= 3)) due.push(branch);
  }
  return due;
}
