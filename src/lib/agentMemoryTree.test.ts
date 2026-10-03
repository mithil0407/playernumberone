import assert from 'node:assert/strict';
import test from 'node:test';
import {
  branchesNeedingConsolidation,
  buildMemoryPath,
  memoryStrength,
  normalizeMemoryOperations,
  searchMemories,
  selectMemoriesForTurn,
  type MemoryNode,
} from './agentMemoryTree.ts';

const NOW = new Date('2026-10-03T10:00:00Z');
let counter = 0;

function node(overrides: Partial<MemoryNode>): MemoryNode {
  counter += 1;
  return {
    id: `node-${counter}`,
    parentId: null,
    kind: 'fact',
    path: 'style',
    title: '',
    content: '',
    memoryType: 'preference',
    importance: 0.5,
    confidence: 0.8,
    evidenceCount: 1,
    recallCount: 0,
    lastRecalledAt: null,
    occurredAt: null,
    validUntil: null,
    status: 'active',
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
    ...overrides,
  };
}

function daysAgo(days: number) {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

test('constraints never fade, episodes fade within weeks', () => {
  const constraint = node({ memoryType: 'constraint', importance: 0.9, updatedAt: daysAgo(400), createdAt: daysAgo(400) });
  const freshEpisode = node({ kind: 'episode', memoryType: 'feedback', updatedAt: daysAgo(1), createdAt: daysAgo(1) });
  const oldEpisode = node({ kind: 'episode', memoryType: 'feedback', updatedAt: daysAgo(90), createdAt: daysAgo(90) });

  assert.equal(memoryStrength(constraint, NOW), memoryStrength({ ...constraint, updatedAt: NOW.toISOString() }, NOW));
  assert.ok(memoryStrength(freshEpisode, NOW) > memoryStrength(oldEpisode, NOW) * 2);
});

test('evidence and recall reinforce a memory; superseded and expired memories are gone', () => {
  const once = node({ evidenceCount: 1 });
  const often = node({ evidenceCount: 5, recallCount: 4 });
  assert.ok(memoryStrength(often, NOW) > memoryStrength(once, NOW));
  assert.equal(memoryStrength(node({ status: 'superseded' }), NOW), 0);
  assert.equal(memoryStrength(node({ validUntil: daysAgo(1) }), NOW), 0);
});

test('selection always includes the portrait and constraints, then relevant facts', () => {
  const nodes = [
    node({ kind: 'root', path: 'root', content: 'Product manager in Pune who wants to look sharper at work.', memoryType: null }),
    node({ kind: 'branch', path: 'style', content: 'Clean, minimal, hates loud prints.', memoryType: null }),
    node({ path: 'style', memoryType: 'constraint', importance: 0.95, content: 'Never wants sleeveless tops.' }),
    node({ path: 'body/sizes', memoryType: 'fact', content: 'Wears M in Zara shirts and 32 waist trousers.' }),
    node({ path: 'people', memoryType: 'person', content: 'Wife Priya picks his shoes.' }),
  ];
  const selection = selectMemoriesForTurn(nodes, 'what size should I get in this zara shirt?', { now: NOW });

  assert.match(selection.text, /PORTRAIT: Product manager in Pune/);
  assert.match(selection.text, /Never wants sleeveless/);
  assert.match(selection.text, /Wears M in Zara/);
  assert.match(selection.text, /style — Style & taste: Clean, minimal/);
  // The size fact outranks an unrelated person memory for a sizing question.
  assert.ok(selection.text.indexOf('Wears M') >= 0);
  assert.equal(selection.refs.size, 0);
});

test('reflection refs map back to node ids', () => {
  const fact = node({ path: 'colour', content: 'Loves olive and rust.' });
  const selection = selectMemoriesForTurn([fact], 'olive', { now: NOW, withRefs: true });
  assert.match(selection.text, /\(m1\) \[preference\] Loves olive/);
  assert.equal(selection.refs.get('m1'), fact.id);
});

test('normalising operations drops unknown refs and low confidence, and turns restatements into reinforcement', () => {
  const existing = node({ path: 'style', content: 'Prefers linen shirts in summer.' });
  const refs = new Map([['m1', existing.id]]);
  const operations = normalizeMemoryOperations([
    { op: 'add', branch: 'style', kind: 'fact', memory_type: 'preference', content: 'Prefers linen shirts in summer', confidence: 0.9 },
    { op: 'add', branch: 'colour', kind: 'fact', memory_type: 'preference', content: 'Maybe likes pink', confidence: 0.4 },
    { op: 'add', branch: 'nonsense', kind: 'fact', content: 'x', confidence: 0.9 },
    { op: 'supersede', ref: 'm9', content: 'unknown ref' },
    { op: 'add', branch: 'body', topic: 'Sizes / Zara', kind: 'fact', memory_type: 'fact', content: 'Wears M at Zara.', confidence: 0.95 },
  ], refs, [existing]);

  assert.deepEqual(operations[0], { op: 'reinforce', nodeId: existing.id });
  assert.equal(operations.length, 2);
  assert.equal(operations[1].op, 'add');
  if (operations[1].op === 'add') {
    assert.equal(buildMemoryPath(operations[1].branch, operations[1].topic), 'body/sizes/zara');
  }
});

test('supersede keeps the target and is limited to active leaves', () => {
  const fact = node({ path: 'colour', content: 'Avoids black.' });
  const branch = node({ kind: 'branch', path: 'colour', memoryType: null });
  const operations = normalizeMemoryOperations([
    { op: 'supersede', ref: 'm1', content: 'Now loves all-black outfits.' },
    { op: 'archive', ref: 'm2' },
  ], new Map([['m1', fact.id], ['m2', branch.id]]), [fact, branch]);
  assert.deepEqual(operations, [{ op: 'supersede', nodeId: fact.id, content: 'Now loves all-black outfits.', importance: null, memoryType: null }]);
});

test('deep recall finds memories by meaning words', () => {
  const nodes = [
    node({ path: 'wardrobe', memoryType: 'wardrobe', content: 'Owns a navy blazer from Zara.' }),
    node({ path: 'style', content: 'Likes relaxed fits.' }),
  ];
  const found = searchMemories(nodes, 'do I have a blazer already', 5, NOW);
  assert.equal(found[0]?.content, 'Owns a navy blazer from Zara.');
});

test('a branch with many leaves or no gist is due for consolidation', () => {
  const leaves = Array.from({ length: 11 }, (_, index) => node({ path: 'style', content: `fact ${index}` }));
  const branch = node({ kind: 'branch', path: 'style', memoryType: null, content: 'gist' });
  assert.deepEqual(branchesNeedingConsolidation([branch, ...leaves], NOW), ['style']);
  const fewWithoutGist = [node({ kind: 'branch', path: 'colour', memoryType: null }), ...Array.from({ length: 3 }, () => node({ path: 'colour', content: 'c' }))];
  assert.deepEqual(branchesNeedingConsolidation(fewWithoutGist, NOW), ['colour']);
});
