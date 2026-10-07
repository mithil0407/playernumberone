import 'server-only';

import { AsyncLocalStorage } from 'node:async_hooks';
import OpenAI from 'openai';
import { modelCallCostUsd } from '@/lib/agentGrowth';
import { supabaseAdmin } from '@/lib/supabase';

// The agent's conversational brain runs on OpenAI, like the existing ICONIK Man
// WhatsApp stylist; browser verification runs on OpenAI's computer tool by
// default (agentBrowserVerifier.ts).
//
// Every call through agentOpenAI() is logged to agent_usage_events with its cost,
// attributed to whichever client and kind of work withAgentUsage() set around it.
export const AGENT_TEXT_MODEL = process.env.ICONIK_AGENT_TEXT_MODEL?.trim()
  || process.env.ICONIK_MAN_WHATSAPP_TEXT_MODEL?.trim()
  || 'gpt-5.6-luna';

export type AgentUsageKind = 'chat' | 'search' | 'product_check' | 'memory' | 'followup' | 'checkin' | 'image' | 'other';

const usageContext = new AsyncLocalStorage<{ clientId: string | null; kind: AgentUsageKind }>();

/** Attributes the model calls made inside fn to a client and a kind of work. */
export function withAgentUsage<T>(context: { clientId: string | null; kind: AgentUsageKind }, fn: () => Promise<T>) {
  return usageContext.run(context, fn);
}

type UsageShape = {
  usage?: { input_tokens?: number; output_tokens?: number; input_tokens_details?: { cached_tokens?: number } } | null;
  output?: Array<{ type: string }>;
};

async function recordUsage(model: string, workload: string | null, response: UsageShape) {
  const context = usageContext.getStore();
  const inputTokens = response.usage?.input_tokens ?? 0;
  const cachedTokens = response.usage?.input_tokens_details?.cached_tokens ?? 0;
  const outputTokens = response.usage?.output_tokens ?? 0;
  const webSearches = (response.output ?? []).filter(item => item.type === 'web_search_call').length;
  const { error } = await supabaseAdmin.from('agent_usage_events').insert({
    client_id: context?.clientId ?? null,
    kind: context?.kind ?? 'other',
    workload,
    model,
    input_tokens: inputTokens,
    cached_tokens: cachedTokens,
    output_tokens: outputTokens,
    web_searches: webSearches,
    cost_usd: modelCallCostUsd({ model, inputTokens, cachedTokens, outputTokens, webSearches }),
  });
  if (error) console.warn('[agent] usage not recorded:', error.message);
}

let client: OpenAI | null = null;

export function agentOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  if (!client) {
    const created = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const create = created.responses.create.bind(created.responses);
    // Same call, plus a usage record. Streaming is not used by the agent.
    created.responses.create = (async (params: Parameters<typeof create>[0], options?: Parameters<typeof create>[1]) => {
      const response = await create(params, options);
      const metadata = (params as { metadata?: Record<string, string> | null }).metadata;
      await recordUsage(String(params.model), metadata?.workload ?? null, response as UsageShape).catch(() => undefined);
      return response;
    }) as typeof created.responses.create;
    client = created;
  }
  return client;
}

/** Runs a JSON-only side task (memory reflection, consolidation, update copy). */
export async function generateAgentJson(prompt: string, workload: string): Promise<Record<string, unknown>> {
  const response = await agentOpenAI().responses.create({
    model: AGENT_TEXT_MODEL,
    input: prompt,
    reasoning: { effort: 'low' },
    text: { format: { type: 'json_object' } },
    max_output_tokens: 2_000,
    store: false,
    metadata: { workload },
  });
  const parsed: unknown = JSON.parse(response.output_text || '{}');
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
}
