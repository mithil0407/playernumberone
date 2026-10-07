// Replays real ICONIK agent conversations through the current prompt and tools,
// without sending anything: no WhatsApp messages, no pictures generated, no
// product searches, nothing written to the database. Prints, for each moment,
// what they sent, what we actually replied then, and what the agent would reply
// now (with the tools it would have used).
//
//   node --experimental-strip-types --import ./scripts/node-test-hooks.mjs \
//     scripts/agent-replay.ts [--top 8] [--per-client 4] [--selfies 20] [client-id-prefix…] > replay.md
//
// --selfies N replays the first selfie of N people to see which seasons the
// Colour Card would give now.
//
// Needs .env.local (Supabase service role + OPENAI_API_KEY) loaded into the env.

import type { ResponseFunctionToolCall, ResponseInputItem } from 'openai/resources/responses/responses';
import { loadStylePassport, type AgentClient } from '@/lib/agentClients';
import { indiaDateString } from '@/lib/agentEvents';
import { AGENT_TEXT_MODEL, agentOpenAI } from '@/lib/agentLlm';
import { loadMemoryNodes } from '@/lib/agentMemoryStore';
import { selectMemoriesForTurn } from '@/lib/agentMemoryTree';
import { buildAgentInstructions } from '@/lib/agentPrompt';
import { PHOTO_TURN_NOTE, agentTools, pendingToInput, threadToInput } from '@/lib/agentRuntime';
import type { AgentMessageRow } from '@/lib/agentStore';
import { parseColourObservations, readingsFrom, sameSeason, seasonFor } from '@/lib/agentColourSeason';
import { describeTextingStyle, readTextingStyle } from '@/lib/agentTextingStyle';
import { NO_REPLY_SENTINEL, parseQuoteMarker, quoteRefs, replyText, splitIntoBubbles, unsentBubbles } from '@/lib/agentWhatsapp';
import { supabaseAdmin } from '@/lib/supabase';

const args = process.argv.slice(2);
const flag = (name: string, fallback: number) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? Number(args[index + 1]) : fallback;
};
const TOP = flag('top', 8);
const PER_CLIENT = flag('per-client', 4);
const SELFIES = flag('selfies', 0);
const prefixes = args.filter((arg, index) => !arg.startsWith('--') && !args[index - 1]?.startsWith('--'));

let profileHasBodyAsk = false;

/** What a tool would have done, without doing it. */
function simulate(call: ResponseFunctionToolCall, log: string[]) {
  const input = JSON.parse(call.arguments || '{}') as Record<string, unknown>;
  switch (call.name) {
    case 'send_message':
      log.push(`💬 ${input.reply_to ? `↩ (quoting ${String(input.reply_to)}) ` : ''}${String(input.text)}`);
      return 'Sent.';
    case 'react':
      log.push(`(reacts ${String(input.emoji)})`);
      return 'Reacted.';
    case 'create_image':
      log.push(`🖼️ create_image [${String(input.kind)}] ${String(input.brief)}${input.caption ? ` — caption: "${String(input.caption)}"` : ''}`);
      return `Picture sent${input.caption ? ' with your caption' : ''}. Keep your reply to one short line (or ${NO_REPLY_SENTINEL} if the caption said it all). 2 pictures left today.`;
    case 'send_shade_card': {
      const swatches = Array.isArray(input.swatches) ? input.swatches as Array<Record<string, unknown>> : [];
      log.push(`🎨 send_shade_card "${String(input.title)}": ${swatches.map(swatch => `${String(swatch.name)}${swatch.note ? ` (${String(swatch.note)})` : ''}`).join(', ')}${input.caption ? ` — caption: "${String(input.caption)}"` : ''}`);
      return 'Shade card sent. Add at most one or two short lines: your first pick and why, or nothing more if the card says it.';
    }
    case 'send_colour_card': {
      const observations = parseColourObservations(input);
      const readings = observations ? readingsFrom(observations) : null;
      const mapped = readings ? seasonFor(readings) : null;
      log.push(`🃏 send_colour_card ${String(input.season)} [${String(input.undertone)}, skin ${String(input.skin_depth)}, hair ${String(input.hair_depth)}, eyes ${String(input.eye_depth)}, ${String(input.chroma)} → ${readings ? `${readings.depth}/${readings.contrast}` : '?'}]${mapped && !sameSeason(mapped, String(input.season)) ? ` → code says ${mapped}` : ''} — seen: ${String(input.seen ?? '')}`);
      log.push(`   wow: ${String(input.wow)}`);
      log.push(`   next: ${String(input.next_step)}`);
      if (mapped && !sameSeason(mapped, String(input.season))) {
        return `Your readings map to ${mapped}, not ${String(input.season)}. Call send_colour_card again with season "${mapped}" and a ${mapped} palette.`;
      }
      return `Colour Card, your wow message and your next-step question are all sent. Reply exactly ${NO_REPLY_SENTINEL}.`;
    }
    case 'send_body_card':
      if (!profileHasBodyAsk) {
        log.push('(tried send_body_card — blocked: they did not ask)');
        return "They haven't asked for a Body Card — this photo is for an outfit check. Don't analyse their body; answer about the outfit.";
      }
      log.push('🧍 send_body_card');
      return 'Body Card sent.';
    case 'search_products':
      log.push(`🔎 search_products "${String(input.query)}"`);
      return 'Replay: no search run. Pretend nothing matched and carry on.';
    case 'present_products':
      log.push('🛍️ present_products');
      return 'Checking on the store pages now.';
    case 'share_invite':
      log.push('📨 share_invite');
      return 'Sent their invite.';
    default:
      log.push(`🔧 ${call.name} ${call.arguments.slice(0, 160)}`);
      return 'OK.';
  }
}

async function replayTurn(client: AgentClient, history: AgentMessageRow[], pending: AgentMessageRow[], profileOverride?: Record<string, unknown>) {
  const passport = await loadStylePassport(client);
  const nodes = await loadMemoryNodes(client.id).catch(() => []);
  const memory = selectMemoriesForTurn(nodes, pending.map(message => message.content).join('\n'));
  const profile = profileOverride ?? passport.profile;
  profileHasBodyAsk = typeof profile.body_ask_at === 'string' && !profile.body_card_at;
  const freeTier = client.tier === 'free';
  const instructions = buildAgentInstructions({
    line: client.line,
    firstName: passport.firstName,
    today: indiaDateString(new Date(pending[0].created_at)),
    profile,
    reportUrl: passport.reportUrl,
    memoryText: memory.text,
    events: [],
    lookActivity: '',
    firstConversation: false,
    hasReportPhotos: client.line === 'man' && Boolean(client.report_share_token),
    tier: client.tier,
    runsLeft: freeTier ? 3 : null,
    invitesLeft: 5,
    textingStyle: describeTextingStyle(readTextingStyle([...history, ...pending]
      .filter(message => message.direction === 'inbound' && message.kind === 'text').map(message => message.content))),
    imagesLeftToday: 3,
    photoThisTurn: pending.some(message => message.kind === 'image') && Boolean(profile.best_colours),
    blueprintUrl: 'https://www.iconik.pro/',
    now: new Date(pending[0].created_at),
  });
  const photoTurn = pending.some(message => message.kind === 'image') && Boolean(profile.best_colours);
  const refs = quoteRefs([...history, ...pending]);
  const refOf = new Map([...refs.byRef].map(([ref, whatsappId]) => [whatsappId, ref]));
  let input: ResponseInputItem[] = [
    ...threadToInput(history, new Set(), refs.byMessageId),
    pendingToInput(pending, photoTurn ? PHOTO_TURN_NOTE : null, refs.byMessageId),
  ];
  const tools = agentTools({ freeTier });
  const log: string[] = [];
  for (let call = 0; call < 5; call += 1) {
    const response = await agentOpenAI().responses.create({
      model: AGENT_TEXT_MODEL, instructions, input, tools,
      reasoning: { effort: 'medium' }, include: ['reasoning.encrypted_content'],
      max_output_tokens: 4_000, store: false, metadata: { workload: 'iconik_agent_replay' },
    });
    const calls = response.output.filter((item): item is ResponseFunctionToolCall => item.type === 'function_call');
    input = [...input, ...(response.output as ResponseInputItem[])];
    if (!calls.length) {
      const reply = replyText(response.output);
      if (reply !== NO_REPLY_SENTINEL) {
        const sentEarly = log.filter(line => line.startsWith('💬')).map(line => line.replace(/^💬 (?:↩ \(quoting m\d+\) )?/, ''));
        for (const parsed of unsentBubbles(splitIntoBubbles(reply).map(bubble => parseQuoteMarker(bubble, refs.byRef)), sentEarly)) {
          log.push(`${parsed.replyTo ? `↩ (quoting ${refOf.get(parsed.replyTo)}) ` : ''}${parsed.text}`);
        }
      }
      break;
    }
    for (const toolCall of calls) input.push({ type: 'function_call_output', call_id: toolCall.call_id, output: simulate(toolCall, log) });
  }
  return log;
}

const shown = (message: AgentMessageRow) => message.kind === 'image'
  ? `[${message.direction === 'inbound' ? 'photo' : 'picture'}]${message.content ? ` ${message.content}` : ''}`
  : message.content;
const quote = (text: string) => text.split('\n').map(line => `> ${line}`).join('\n');

async function main() {
  const { data: clientRows } = await supabaseAdmin.from('agent_clients').select('*');
  const clients = (clientRows ?? []) as AgentClient[];
  const { data: messageRows } = await supabaseAdmin.from('agent_messages').select('*').order('created_at', { ascending: true }).limit(5000);
  const byClient = new Map<string, AgentMessageRow[]>();
  for (const message of (messageRows ?? []) as AgentMessageRow[]) {
    if (!byClient.has(message.client_id)) byClient.set(message.client_id, []);
    byClient.get(message.client_id)!.push(message);
  }
  const typed = (message: AgentMessageRow) => message.direction === 'inbound' && ['text', 'image', 'interactive'].includes(message.kind);

  console.log(`# Agent replay — ${new Date().toISOString().slice(0, 16)} — model ${AGENT_TEXT_MODEL}\n\nNothing was sent. Pictures, searches and cards are shown as the tool calls the agent would make.\n`);

  if (SELFIES > 0) {
    console.log('## Colour Cards, replayed from first selfies\n');
    const seasons = new Map<string, number>();
    let done = 0;
    for (const client of clients.filter(row => row.tier === 'free')) {
      if (done >= SELFIES) break;
      const thread = byClient.get(client.id) ?? [];
      const index = thread.findIndex(message => message.direction === 'inbound' && message.kind === 'image' && message.image_url);
      if (index < 0) continue;
      const log = await replayTurn(client, thread.slice(0, index), [thread[index]], {});
      const card = log.filter(line => line.startsWith('🃏')).at(-1);
      const season = card?.match(/send_colour_card (.+?) \[/)?.[1] ?? 'no card';
      seasons.set(season, (seasons.get(season) ?? 0) + 1);
      console.log(`- ${client.id.slice(0, 8)} (was ${String(client.lite_profile?.season ?? '—')}): ${card ?? log.join(' / ').slice(0, 200)}`);
      done += 1;
    }
    console.log(`\nSeasons now: ${[...seasons].sort((a, b) => b[1] - a[1]).map(([season, count]) => `${season} ×${count}`).join(', ')}\n`);
  }

  const chosen = prefixes.length
    ? clients.filter(client => prefixes.some(prefix => client.id.startsWith(prefix)))
    : clients
      .filter(client => client.lite_profile?.colour_card_at || client.tier !== 'free')
      .sort((a, b) => (byClient.get(b.id) ?? []).filter(typed).length - (byClient.get(a.id) ?? []).filter(typed).length)
      .slice(0, TOP);

  for (const client of chosen) {
    const thread = byClient.get(client.id) ?? [];
    const firstCard = thread.find(row => row.direction === 'outbound' && (row.metadata as Record<string, unknown> | null)?.type === 'colour_card');
    const cardAt = client.tier === 'free' ? firstCard?.created_at ?? null : null;
    if (client.tier === 'free' && !cardAt) continue;
    // Moments after their Colour Card (the profile we load is today's).
    const moments = thread
      .map((message, index) => ({ message, index }))
      .filter(({ message }) => typed(message) && (!cardAt || message.created_at > cardAt) && !/^Hi ICONIK!/.test(message.content));
    if (!moments.length) continue;
    const step = Math.max(1, Math.floor(moments.length / PER_CLIENT));
    const picked = moments.filter((_, position) => position % step === 0).slice(0, PER_CLIENT);
    console.log(`\n## ${client.first_name ?? 'Unnamed'} (${client.id.slice(0, 8)}, ${client.tier}${client.lite_profile?.season ? `, ${String(client.lite_profile.season)}` : ''})\n`);
    for (const { index } of picked) {
      const history = thread.slice(0, index);
      // Messages sent together are answered together, as in production.
      let end = index + 1;
      while (end < thread.length && typed(thread[end])
        && new Date(thread[end].created_at).getTime() - new Date(thread[end - 1].created_at).getTime() < 15_000) end += 1;
      const pending = thread.slice(index, end);
      const before = thread.slice(end).filter(row => row.direction === 'outbound' && row.kind !== 'reaction');
      const nextInbound = thread.slice(end).findIndex(typed);
      const old = (nextInbound >= 0 ? thread.slice(end, end + nextInbound) : thread.slice(end))
        .filter(row => row.direction === 'outbound' && row.kind !== 'reaction');
      const fresh = await replayTurn(client, history, pending).catch(error => [`(replay failed: ${error instanceof Error ? error.message : String(error)})`]);
      console.log(`**They sent:**\n${quote(pending.map(shown).join('\n'))}\n`);
      console.log(`**Before:**\n${quote((old.length ? old : before.slice(0, 1)).map(shown).join('\n\n') || '(nothing)')}\n`);
      console.log(`**Now:**\n${quote(fresh.join('\n\n') || '(no reply)')}\n\n---\n`);
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
