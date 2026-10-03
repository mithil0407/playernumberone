import 'server-only';

// Persistence and the two "thinking about memory" passes for the agent's memory
// tree (see agentMemoryTree.ts for the model):
//   reflectOnTurn       after every answered turn — what did we just learn?
//   consolidateMemory   in the background — fold busy branches into their gist,
//                       archive stale episodes, rewrite the portrait.

import { generateAgentJson } from '@/lib/agentLlm';
import {
  MEMORY_BRANCHES,
  ROOT_PATH,
  branchOfPath,
  branchesNeedingConsolidation,
  buildMemoryPath,
  normalizeMemoryOperations,
  selectMemoriesForTurn,
  type MemoryBranchKey,
  type MemoryNode,
  type MemoryOperation,
} from '@/lib/agentMemoryTree';
import { supabaseAdmin } from '@/lib/supabase';

type Row = Record<string, unknown>;

function toNode(row: Row): MemoryNode {
  return {
    id: String(row.id),
    parentId: (row.parent_id as string | null) ?? null,
    kind: row.kind as MemoryNode['kind'],
    path: String(row.path),
    title: String(row.title ?? ''),
    content: String(row.content ?? ''),
    memoryType: (row.memory_type as MemoryNode['memoryType']) ?? null,
    importance: Number(row.importance ?? 0.5),
    confidence: Number(row.confidence ?? 0.8),
    evidenceCount: Number(row.evidence_count ?? 1),
    recallCount: Number(row.recall_count ?? 0),
    lastRecalledAt: (row.last_recalled_at as string | null) ?? null,
    occurredAt: (row.occurred_at as string | null) ?? null,
    validUntil: (row.valid_until as string | null) ?? null,
    status: row.status as MemoryNode['status'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/** Creates the portrait and branch nodes the first time a client is seen. */
export async function ensureMemoryTree(clientId: string) {
  const { data, error } = await supabaseAdmin
    .from('agent_memory_nodes')
    .select('id, path')
    .eq('client_id', clientId)
    .in('kind', ['root', 'branch']);
  if (error) throw new Error(`Could not load memory tree: ${error.message}`);

  const existing = new Map((data ?? []).map(row => [row.path as string, row.id as string]));
  let rootId = existing.get(ROOT_PATH);
  if (!rootId) {
    const { data: root, error: rootError } = await supabaseAdmin
      .from('agent_memory_nodes')
      .insert({ client_id: clientId, kind: 'root', path: ROOT_PATH, title: 'Portrait', importance: 1, confidence: 1 })
      .select('id')
      .single();
    if (rootError) {
      // A concurrent turn created it first.
      const { data: raced } = await supabaseAdmin
        .from('agent_memory_nodes').select('id').eq('client_id', clientId).eq('path', ROOT_PATH).maybeSingle();
      if (!raced) throw new Error(`Could not create memory root: ${rootError.message}`);
      rootId = raced.id as string;
    } else {
      rootId = root.id as string;
    }
  }

  const missing = MEMORY_BRANCHES.filter(branch => !existing.has(branch.key));
  if (missing.length) {
    // Duplicates from a concurrent turn fail on the unique path index; that is fine.
    await supabaseAdmin.from('agent_memory_nodes').insert(missing.map(branch => ({
      client_id: clientId,
      parent_id: rootId,
      kind: 'branch',
      path: branch.key,
      title: branch.title,
      importance: 1,
      confidence: 1,
    })));
  }
}

export async function loadMemoryNodes(clientId: string): Promise<MemoryNode[]> {
  const { data, error } = await supabaseAdmin
    .from('agent_memory_nodes')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(600);
  if (error) throw new Error(`Could not load memories: ${error.message}`);
  return (data ?? []).map(row => toNode(row));
}

/** Recalling a memory strengthens it, as it does for people. */
export async function markMemoriesRecalled(nodes: MemoryNode[], ids: string[]) {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const now = new Date().toISOString();
  await Promise.all(ids.map(id => {
    const node = byId.get(id);
    if (!node) return null;
    return supabaseAdmin
      .from('agent_memory_nodes')
      .update({ recall_count: node.recallCount + 1, last_recalled_at: now })
      .eq('id', id);
  }));
}

export async function applyMemoryOperations(input: {
  clientId: string;
  nodes: MemoryNode[];
  operations: MemoryOperation[];
  sourceMessageIds?: string[];
}) {
  if (!input.operations.length) return 0;
  const byId = new Map(input.nodes.map(node => [node.id, node]));
  const branchIds = new Map(input.nodes.filter(node => node.kind === 'branch').map(node => [node.path, node.id]));
  const now = new Date().toISOString();
  const sources = input.sourceMessageIds ?? [];
  let applied = 0;

  for (const operation of input.operations) {
    if (operation.op === 'add') {
      const parentId = branchIds.get(operation.branch);
      if (!parentId) continue;
      const { error } = await supabaseAdmin.from('agent_memory_nodes').insert({
        client_id: input.clientId,
        parent_id: parentId,
        kind: operation.kind,
        path: buildMemoryPath(operation.branch, operation.topic),
        content: operation.content,
        memory_type: operation.memoryType,
        importance: operation.importance,
        confidence: operation.confidence,
        valid_until: operation.validUntil,
        occurred_at: operation.occurredAt,
        source_message_ids: sources,
      });
      if (!error) applied += 1;
      continue;
    }

    const node = byId.get(operation.nodeId);
    if (!node) continue;

    if (operation.op === 'reinforce') {
      await supabaseAdmin.from('agent_memory_nodes').update({
        evidence_count: node.evidenceCount + 1,
        confidence: Math.min(1, node.confidence + 0.05),
        updated_at: now,
      }).eq('id', node.id);
    } else if (operation.op === 'update') {
      await supabaseAdmin.from('agent_memory_nodes').update({
        content: operation.content,
        importance: operation.importance ?? node.importance,
        updated_at: now,
      }).eq('id', node.id);
    } else if (operation.op === 'archive') {
      await supabaseAdmin.from('agent_memory_nodes').update({ status: 'archived', updated_at: now }).eq('id', node.id);
    } else if (operation.op === 'supersede') {
      // The old belief stays in the tree, linked to what replaced it.
      const { data: replacement, error } = await supabaseAdmin.from('agent_memory_nodes').insert({
        client_id: input.clientId,
        parent_id: node.parentId,
        kind: node.kind,
        path: node.path,
        content: operation.content,
        memory_type: operation.memoryType ?? node.memoryType,
        importance: operation.importance ?? node.importance,
        confidence: 0.9,
        related_node_ids: [node.id],
        source_message_ids: sources,
      }).select('id').single();
      if (error || !replacement) continue;
      await supabaseAdmin.from('agent_memory_nodes').update({
        status: 'superseded',
        superseded_by: replacement.id,
        updated_at: now,
      }).eq('id', node.id);
    }
    applied += 1;
  }
  return applied;
}

const REFLECTION_RULES = `You maintain a personal stylist's memory of one client, organised as a tree:
branches ${MEMORY_BRANCHES.map(branch => `"${branch.key}" (${branch.hint})`).join(', ')}.

Return ONLY JSON: {"operations": [...]} with at most 6 operations. Each operation is one of:
{"op":"add","branch":"<branch>","topic":"short-slug or null","kind":"fact|episode","memory_type":"constraint|preference|fact|wardrobe|person|feedback|plan","content":"one standalone sentence","importance":0-1,"confidence":0-1,"valid_until":"ISO date or null","occurred_at":"ISO date or null"}
{"op":"reinforce","ref":"m3"}            the client restated or confirmed an existing memory
{"op":"update","ref":"m3","content":"…"}   same memory, more precise wording
{"op":"supersede","ref":"m3","content":"…"} the client changed their mind; content is the new belief
{"op":"archive","ref":"m3"}              no longer true or no longer useful

What deserves remembering (as a thoughtful human stylist would):
- constraint: firm rules the client stated ("never sleeveless", "no leather", "nothing above the knee"). importance ≥ 0.85.
- preference: patterns they stated or showed more than once ("loves linen", "prefers muted colours for work").
- fact / wardrobe / person: sizes by brand, items they own, people who matter ("wife picks his shoes"), their job, city.
- plan: short-lived context with valid_until ("in Goa next week" → valid_until a week out).
- episode: one notable moment worth recalling later, dated ("loved the emerald kurta option for the sangeet; rejected pastels"). Use kind "episode", memory_type "feedback" or "plan".
Do NOT store: a reaction to one specific option as a general preference; anything the stylist (assistant) said; guesses about their body or looks; health, religion, finances or other sensitive data unless the client stated it as a dressing need; things already in the report.
Prefer reinforce/update/supersede over adding near-duplicates. Return {"operations": []} when nothing durable was learned.`;

/** After a turn: decide what the agent should remember from it. */
export async function reflectOnTurn(input: {
  clientId: string;
  nodes: MemoryNode[];
  clientMessages: string;
  assistantReply: string;
  sourceMessageIds: string[];
  now?: Date;
}) {
  const clientText = input.clientMessages.trim();
  if (!clientText) return 0;
  const selection = selectMemoriesForTurn(input.nodes, clientText, { withRefs: true, maxFacts: 24, maxEpisodes: 6 });
  const now = input.now ?? new Date();

  const raw = await generateAgentJson(`${REFLECTION_RULES}

TODAY: ${now.toISOString().slice(0, 10)}

CURRENT MEMORY (refs in brackets):
${selection.text}

CLIENT SAID:
${clientText}

STYLIST REPLIED:
${input.assistantReply || '(reaction only)'}`, 'iconik_agent_memory_reflection');

  const operations = normalizeMemoryOperations(raw.operations, selection.refs, input.nodes);
  return applyMemoryOperations({
    clientId: input.clientId,
    nodes: input.nodes,
    operations,
    sourceMessageIds: input.sourceMessageIds,
  });
}

/**
 * Background consolidation: for each busy branch, write a fresh gist, merge
 * duplicates and archive stale episodes; then rewrite the portrait from the
 * branch gists. Returns the branches consolidated.
 */
export async function consolidateMemory(clientId: string, passportSummary: string) {
  const nodes = await loadMemoryNodes(clientId);
  const due = branchesNeedingConsolidation(nodes);
  const branchNodes = new Map(nodes.filter(node => node.kind === 'branch').map(node => [node.path, node]));

  for (const branch of due) {
    const branchNode = branchNodes.get(branch);
    if (!branchNode) continue;
    const leaves = nodes.filter(node => (
      (node.kind === 'fact' || node.kind === 'episode') && branchOfPath(node.path) === branch
    ));
    const refs = new Map(leaves.map((node, index) => [`m${index + 1}`, node.id]));
    const listing = leaves.map((node, index) => (
      `(m${index + 1}) [${node.kind}/${node.memoryType ?? 'fact'}${node.occurredAt ? ` ${node.occurredAt.slice(0, 10)}` : ''}] ${node.content}`
    )).join('\n');

    const raw = await generateAgentJson(`You are consolidating one branch of a personal stylist's memory of a client, the way sleep consolidates memory.

Branch: "${branch}" — ${MEMORY_BRANCHES.find(item => item.key === branch)?.hint}
Today: ${new Date().toISOString().slice(0, 10)}

Return ONLY JSON:
{"gist": "2-3 sentences capturing what matters most in this branch, most important first",
 "operations": [ ...merge/clean-up operations... ]}

Operations may be {"op":"archive","ref":"mN"} for duplicates, trivia and episodes older than a month whose lesson the gist or a fact now holds; {"op":"update","ref":"mN","content":"…"} to merge a duplicate's detail into the surviving memory; or {"op":"add","branch":"${branch}","kind":"fact",...} for a pattern several episodes reveal (confidence ≥ 0.8). Never archive a constraint the client has not reversed.

MEMORIES:
${listing}`, 'iconik_agent_memory_consolidation');

    const gist = typeof raw.gist === 'string' ? raw.gist.replace(/\s+/g, ' ').trim().slice(0, 600) : '';
    if (gist) {
      await supabaseAdmin.from('agent_memory_nodes')
        .update({ content: gist, updated_at: new Date().toISOString() })
        .eq('id', branchNode.id);
    }
    const operations = normalizeMemoryOperations(raw.operations, refs, leaves)
      .filter(operation => operation.op !== 'add' || operation.branch === branch);
    await applyMemoryOperations({ clientId, nodes, operations });
  }

  if (due.length) await rewritePortrait(clientId, passportSummary);
  return due as MemoryBranchKey[];
}

async function rewritePortrait(clientId: string, passportSummary: string) {
  const nodes = await loadMemoryNodes(clientId);
  const root = nodes.find(node => node.kind === 'root');
  if (!root) return;
  const gists = nodes
    .filter(node => node.kind === 'branch' && node.content.trim())
    .map(node => `${node.path}: ${node.content}`)
    .join('\n');
  if (!gists) return;

  const raw = await generateAgentJson(`Write the portrait at the top of a personal stylist's memory of one client: 3-4 sentences a stylist would want in mind before every conversation — who they are, what they care about, how to talk to them, what to never forget. Plain language, no styling jargon.

Return ONLY JSON: {"portrait": "…"}

REPORT SUMMARY:
${passportSummary}

WHAT WE HAVE LEARNED (branch gists):
${gists}`, 'iconik_agent_memory_portrait');

  const portrait = typeof raw.portrait === 'string' ? raw.portrait.replace(/\s+/g, ' ').trim().slice(0, 700) : '';
  if (portrait) {
    await supabaseAdmin.from('agent_memory_nodes')
      .update({ content: portrait, updated_at: new Date().toISOString() })
      .eq('id', root.id);
  }
}
