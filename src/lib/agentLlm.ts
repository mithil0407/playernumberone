import 'server-only';

import OpenAI from 'openai';

// The agent's conversational brain runs on OpenAI, like the existing ICONIK Man
// WhatsApp stylist; browser verification runs on Claude's browser toolset
// (agentBrowserVerifier.ts).
export const AGENT_TEXT_MODEL = process.env.ICONIK_AGENT_TEXT_MODEL?.trim()
  || process.env.ICONIK_MAN_WHATSAPP_TEXT_MODEL?.trim()
  || 'gpt-5.6-luna';

let client: OpenAI | null = null;

export function agentOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured');
  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
