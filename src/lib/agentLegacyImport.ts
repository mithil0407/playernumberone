import 'server-only';

// Men who chatted with the ICONIK Man WhatsApp pilot shouldn't meet a stylist who
// has forgotten them. On enrolment, the pilot's structured memories become facts
// in the memory tree and the recent chat becomes the start of the agent's thread.

import type { AgentClient } from '@/lib/agentClients';
import { applyMemoryOperations, ensureMemoryTree, loadMemoryNodes } from '@/lib/agentMemoryStore';
import type { MemoryBranchKey, MemoryOperation, MemoryType } from '@/lib/agentMemoryTree';
import { supabaseAdmin } from '@/lib/supabase';

const PILOT_CHANNEL = 'iconik_man_whatsapp_pilot';
const HISTORY_LIMIT = 30;

const BRANCH_BY_CATEGORY: Record<string, MemoryBranchKey> = {
  like: 'style',
  dislike: 'style',
  fit: 'body',
  colour: 'colour',
  brand: 'shopping',
  budget: 'shopping',
  owned_item: 'wardrobe',
  lifestyle: 'lifestyle',
  other: 'identity',
};

const TYPE_BY_KIND: Record<string, MemoryType | null> = {
  hard_constraint: 'constraint',
  standing_instruction: 'constraint',
  soft_preference: 'preference',
  wardrobe_fact: 'wardrobe',
  // Reactions to one specific look are not durable preferences.
  local_feedback: null,
};

export async function importManPilotHistory(client: AgentClient) {
  const [{ data: memories }, { data: messages }] = await Promise.all([
    supabaseAdmin
      .from('man_edit_style_memories')
      .select('category, kind, value, strength, confidence, evidence_count')
      .eq('report_id', client.source_report_id)
      .eq('status', 'active')
      .limit(80),
    supabaseAdmin
      .from('man_edit_chat_messages')
      .select('role, content, image_url, created_at')
      .eq('report_id', client.source_report_id)
      .in('role', ['user', 'assistant'])
      .contains('metadata', { channel: PILOT_CHANNEL })
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT),
  ]);

  if (memories?.length) {
    await ensureMemoryTree(client.id);
    const nodes = await loadMemoryNodes(client.id);
    const operations: MemoryOperation[] = memories.flatMap(memory => {
      const memoryType = TYPE_BY_KIND[memory.kind];
      const content = String(memory.value ?? '').trim().slice(0, 280);
      if (!memoryType || !content) return [];
      const strength = Number(memory.strength ?? 0.5);
      return [{
        op: 'add' as const,
        branch: BRANCH_BY_CATEGORY[memory.category] ?? 'identity',
        topic: memory.category === 'like' ? 'likes' : memory.category === 'dislike' ? 'dislikes' : null,
        kind: 'fact' as const,
        memoryType: memory.category === 'owned_item' ? 'wardrobe' : memoryType,
        content,
        importance: memoryType === 'constraint' ? Math.max(0.85, strength) : strength,
        confidence: Math.max(0.7, Number(memory.confidence ?? 0.75)),
        validUntil: null,
        occurredAt: null,
      }];
    });
    await applyMemoryOperations({ clientId: client.id, nodes, operations });
  }

  const history = [...(messages ?? [])].reverse().filter(message => String(message.content ?? '').trim());
  if (history.length) {
    await supabaseAdmin.from('agent_messages').insert(history.map(message => ({
      client_id: client.id,
      direction: message.role === 'user' ? 'inbound' : 'outbound',
      kind: message.image_url ? 'image' : 'text',
      content: String(message.content).slice(0, 4_000),
      image_url: message.image_url ?? null,
      created_at: message.created_at,
      // Already answered by the pilot; never re-answered by the agent.
      answered_at: message.role === 'user' ? message.created_at : null,
      metadata: { imported_from: PILOT_CHANNEL },
    })));
  }
}
