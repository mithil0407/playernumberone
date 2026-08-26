export const MAN_STYLE_MEMORY_CATEGORIES = [
  'like',
  'dislike',
  'fit',
  'colour',
  'brand',
  'budget',
  'owned_item',
  'lifestyle',
  'other',
] as const;

export const MAN_STYLE_MEMORY_KINDS = [
  'hard_constraint',
  'standing_instruction',
  'soft_preference',
  'wardrobe_fact',
  'local_feedback',
] as const;

export type ManStyleMemoryCategory = typeof MAN_STYLE_MEMORY_CATEGORIES[number];
export type ManStyleMemoryKind = typeof MAN_STYLE_MEMORY_KINDS[number];

export interface ManStyleMemory {
  id?: string;
  memoryKey: string;
  category: ManStyleMemoryCategory;
  kind: ManStyleMemoryKind;
  value: string;
  contextScopes: string[];
  strength: number;
  confidence: number;
  evidenceCount: number;
  timesUsed: number;
  lastUsedAt?: string | null;
  status: 'active' | 'superseded' | 'dismissed';
}

export interface ManRecommendationFingerprint {
  primaryColours: string[];
  primaryGarments: string[];
  layerType?: string | null;
  bottomSilhouette?: string | null;
  footwear?: string | null;
  archetype?: string | null;
}

export interface ManRecommendationHistoryItem {
  route: string;
  fingerprint: ManRecommendationFingerprint;
  memoryKeysUsed: string[];
  createdAt?: string;
}

export interface ManStyleMemoryUpdate {
  memoryKey: string;
  category: ManStyleMemoryCategory;
  kind: ManStyleMemoryKind;
  value: string;
  contextScopes: string[];
  strength: number;
  confidence: number;
  supersedesKeys: string[];
}

export interface ManWhatsappInteractionAnalysis {
  memoryUpdates: ManStyleMemoryUpdate[];
  recommendationFingerprint: (ManRecommendationFingerprint & {
    memoryKeysUsed: string[];
  }) | null;
}

export interface SelectedManStyleMemories {
  memories: ManStyleMemory[];
  promptLines: string[];
  selectedKeys: string[];
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'at', 'be', 'for', 'from', 'i', 'in', 'is', 'it', 'me', 'my',
  'of', 'on', 'or', 'that', 'the', 'this', 'to', 'with', 'would', 'you', 'your',
]);

function normalizeWords(value: string) {
  return value.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word));
}

export function normalizeMemoryKey(category: ManStyleMemoryCategory, value: string) {
  const normalized = value.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
  return `${category}:${normalized || 'unspecified'}`;
}

export function enforceContextualMemoryKind(input: {
  message: string;
  category: ManStyleMemoryCategory;
  proposedKind: ManStyleMemoryKind;
}) {
  const message = input.message.toLowerCase();
  const isReaction = /\b(?:like|love|prefer|dislike|hate|don(?:'|’)t like|do not like)\b/.test(message);
  const pointsToCurrentOption = /\b(?:this|that|these|those|it|current|previous|last one|the one)\b/.test(message);
  const isExplicitlyGeneral = /\b(?:always|usually|generally|in general|most of the time|tend to|never)\b/.test(message);
  const isPreferenceKind = input.proposedKind === 'soft_preference' || input.proposedKind === 'hard_constraint';
  const isPreferenceCategory = input.category === 'like' || input.category === 'dislike';
  return isReaction && pointsToCurrentOption && !isExplicitlyGeneral && isPreferenceKind && isPreferenceCategory
    ? 'local_feedback' as const
    : input.proposedKind;
}

export function legacyMemoriesToRecords(values: string[]): ManStyleMemory[] {
  return values.flatMap((raw, index) => {
    const match = raw.trim().match(/^([a-z_]+)\s*:\s*(.+)$/i);
    if (!match) return [];
    const category = match[1].toLowerCase() as ManStyleMemoryCategory;
    if (!MAN_STYLE_MEMORY_CATEGORIES.includes(category)) return [];
    const value = match[2].trim();
    if (!value) return [];
    const kind: ManStyleMemoryKind = category === 'dislike'
      ? 'hard_constraint'
      : ['budget', 'owned_item', 'lifestyle'].includes(category)
        ? 'wardrobe_fact'
        : 'soft_preference';
    return [{
      memoryKey: normalizeMemoryKey(category, value),
      category,
      kind,
      value,
      contextScopes: [],
      strength: 0.55,
      confidence: 0.8,
      evidenceCount: 1,
      timesUsed: 0,
      status: 'active' as const,
      id: `legacy-${index}`,
    }];
  });
}

function memoryRelevance(memory: ManStyleMemory, message: string, route: string) {
  const messageWords = new Set(normalizeWords(`${message} ${route.replace(/_/g, ' ')}`));
  const memoryWords = normalizeWords(`${memory.value} ${memory.contextScopes.join(' ')}`);
  const overlap = memoryWords.filter(word => messageWords.has(word)).length;
  const scopeMatch = memory.contextScopes.some(scope => {
    const normalized = scope.toLowerCase().replace(/\s+/g, '_');
    return route.includes(normalized) || message.toLowerCase().includes(scope.toLowerCase());
  });
  const routeFactBoost = memory.kind === 'wardrobe_fact' && ['shopping', 'owned_item_styling'].includes(route);
  return overlap * 3
    + (scopeMatch ? 4 : 0)
    + (routeFactBoost ? 2 : 0)
    + memory.strength
    + Math.min(memory.evidenceCount, 4) * 0.25;
}

function recentUsageCount(memoryKey: string, history: ManRecommendationHistoryItem[], limit: number) {
  return history.slice(0, limit).reduce(
    (count, item) => count + (item.memoryKeysUsed.includes(memoryKey) ? 1 : 0),
    0,
  );
}

function preferenceIsRelevant(memory: ManStyleMemory, message: string, route: string) {
  if (!memory.contextScopes.length) return true;
  const haystack = `${message} ${route.replace(/_/g, ' ')}`.toLowerCase();
  return memory.contextScopes.some(scope => haystack.includes(scope.toLowerCase()));
}

export function selectMemoriesForTurn(input: {
  memories: ManStyleMemory[];
  legacyMemories?: string[];
  history: ManRecommendationHistoryItem[];
  message: string;
  route: string;
}): SelectedManStyleMemories {
  const structuredKeys = new Set(input.memories.map(memory => memory.memoryKey));
  const combined = [
    ...input.memories,
    ...legacyMemoriesToRecords(input.legacyMemories ?? [])
      .filter(memory => !structuredKeys.has(memory.memoryKey)),
  ].filter(memory => memory.status === 'active');

  const permanent = combined.filter(memory => (
    memory.kind === 'hard_constraint' || memory.kind === 'standing_instruction'
  ));

  const facts = combined
    .filter(memory => memory.kind === 'wardrobe_fact')
    .map(memory => ({ memory, score: memoryRelevance(memory, input.message, input.route) }))
    .filter(item => item.score >= 1.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(item => item.memory);

  const preferences = combined
    .filter(memory => memory.kind === 'soft_preference')
    .filter(memory => preferenceIsRelevant(memory, input.message, input.route))
    .filter(memory => recentUsageCount(memory.memoryKey, input.history, 1) === 0)
    .filter(memory => recentUsageCount(memory.memoryKey, input.history, 5) < 2)
    .map(memory => ({ memory, score: memoryRelevance(memory, input.message, input.route) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(item => item.memory);

  const deduped = new Map<string, ManStyleMemory>();
  for (const memory of [...permanent, ...facts, ...preferences]) {
    if (memory.kind !== 'local_feedback') deduped.set(memory.memoryKey, memory);
  }
  const memories = [...deduped.values()];
  return {
    memories,
    selectedKeys: memories.map(memory => memory.memoryKey),
    promptLines: memories.map(memory => (
      `[${memory.memoryKey}] ${memory.kind}/${memory.category}: ${memory.value}`
      + (memory.contextScopes.length ? ` (only when relevant to: ${memory.contextScopes.join(', ')})` : '')
    )),
  };
}

export function buildRecommendationDiversityBrief(history: ManRecommendationHistoryItem[]) {
  if (!history.length) return 'No recent recommendation fingerprints; create the strongest fresh answer.';
  const recent = history.slice(0, 5);
  const lines = recent.map((item, index) => {
    const fingerprint = item.fingerprint;
    const pieces = [
      fingerprint.primaryColours.length && `colours ${fingerprint.primaryColours.join('/')}`,
      fingerprint.primaryGarments.length && `garments ${fingerprint.primaryGarments.join('/')}`,
      fingerprint.layerType && `layer ${fingerprint.layerType}`,
      fingerprint.bottomSilhouette && `bottom ${fingerprint.bottomSilhouette}`,
      fingerprint.footwear && `footwear ${fingerprint.footwear}`,
      fingerprint.archetype && `archetype ${fingerprint.archetype}`,
    ].filter(Boolean);
    return `${index + 1}. ${pieces.join('; ') || 'unclassified recommendation'}`;
  });
  return `Recent recommendation fingerprints (newest first):\n${lines.join('\n')}\nAvoid a near-duplicate unless the client explicitly asks to repeat or refine one of these looks.`;
}
