import 'server-only';

import { supabaseAdmin } from '@/lib/supabase';
import type { ManEditReportContext } from '@/lib/manEdit';
import type {
  ManRecommendationFingerprint,
  ManRecommendationHistoryItem,
  ManStyleMemory,
  ManStyleMemoryUpdate,
} from '@/lib/manWhatsappMemoryPolicy';
import { legacyMemoriesToRecords } from '@/lib/manWhatsappMemoryPolicy';

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function asStrings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : [];
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mapMemory(raw: AnyRecord): ManStyleMemory | null {
  if (typeof raw.memory_key !== 'string' || typeof raw.value !== 'string') return null;
  return {
    id: typeof raw.id === 'string' ? raw.id : undefined,
    memoryKey: raw.memory_key,
    category: raw.category as ManStyleMemory['category'],
    kind: raw.kind as ManStyleMemory['kind'],
    value: raw.value,
    contextScopes: asStrings(raw.context_scopes),
    strength: asNumber(raw.strength, 0.5),
    confidence: asNumber(raw.confidence, 0.75),
    evidenceCount: asNumber(raw.evidence_count, 1),
    timesUsed: asNumber(raw.times_used, 0),
    lastUsedAt: typeof raw.last_used_at === 'string' ? raw.last_used_at : null,
    status: raw.status as ManStyleMemory['status'],
  };
}

function mapFingerprint(raw: AnyRecord): ManRecommendationHistoryItem | null {
  const value = asRecord(raw.fingerprint);
  if (typeof raw.route !== 'string') return null;
  const fingerprint: ManRecommendationFingerprint = {
    primaryColours: asStrings(value.primary_colours),
    primaryGarments: asStrings(value.primary_garments),
    layerType: typeof value.layer_type === 'string' ? value.layer_type : null,
    bottomSilhouette: typeof value.bottom_silhouette === 'string' ? value.bottom_silhouette : null,
    footwear: typeof value.footwear === 'string' ? value.footwear : null,
    archetype: typeof value.archetype === 'string' ? value.archetype : null,
  };
  return {
    route: raw.route,
    fingerprint,
    memoryKeysUsed: asStrings(raw.memory_keys_used),
    createdAt: typeof raw.created_at === 'string' ? raw.created_at : undefined,
  };
}

export async function loadManWhatsappMemoryContext(reportId: string) {
  const [memoryResult, historyResult] = await Promise.all([
    supabaseAdmin
      .from('man_edit_style_memories')
      .select('*')
      .eq('report_id', reportId)
      .order('updated_at', { ascending: false })
      .limit(200),
    supabaseAdmin
      .from('man_edit_recommendation_fingerprints')
      .select('route, fingerprint, memory_keys_used, created_at')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  if (memoryResult.error) {
    console.warn('[man whatsapp pilot] structured memories unavailable:', memoryResult.error.message);
  }
  if (historyResult.error) {
    console.warn('[man whatsapp pilot] recommendation history unavailable:', historyResult.error.message);
  }

  return {
    memories: (memoryResult.data ?? []).flatMap(raw => {
      const mapped = mapMemory(asRecord(raw));
      return mapped ? [mapped] : [];
    }),
    history: (historyResult.data ?? []).flatMap(raw => {
      const mapped = mapFingerprint(asRecord(raw));
      return mapped ? [mapped] : [];
    }),
  };
}

export async function ensureLegacyManWhatsappMemories(input: {
  context: ManEditReportContext;
  legacyMemories: string[];
}) {
  const memories = legacyMemoriesToRecords(input.legacyMemories);
  if (!memories.length) return memories;
  const customerEmail = String(
    input.context.subscription?.customer_email ?? input.context.submission.customer_email,
  );
  const rows = memories.map(memory => ({
    report_id: input.context.report.id,
    subscription_id: input.context.subscription?.id ?? null,
    customer_email: customerEmail,
    memory_key: memory.memoryKey,
    category: memory.category,
    kind: memory.kind,
    value: memory.value,
    context_scopes: memory.contextScopes,
    strength: memory.strength,
    confidence: memory.confidence,
    evidence_count: memory.evidenceCount,
    times_used: memory.timesUsed,
    status: memory.status,
  }));
  const { error } = await supabaseAdmin
    .from('man_edit_style_memories')
    .upsert(rows, {
      onConflict: 'report_id,memory_key',
      ignoreDuplicates: true,
    });
  if (error) {
    console.warn('[man whatsapp pilot] legacy memory migration unavailable:', error.message);
  }
  return memories;
}

export async function applyManWhatsappMemoryUpdates(input: {
  context: ManEditReportContext;
  updates: ManStyleMemoryUpdate[];
  sourceWhatsappMessageId: string;
}) {
  if (!input.updates.length) return 0;
  const reportId = input.context.report.id;
  const customerEmail = String(
    input.context.subscription?.customer_email ?? input.context.submission.customer_email,
  );
  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from('man_edit_style_memories')
    .select('memory_key, evidence_count, times_used, created_at')
    .eq('report_id', reportId)
    .in('memory_key', input.updates.map(update => update.memoryKey));

  if (existingError) {
    console.warn('[man whatsapp pilot] structured memory update skipped:', existingError.message);
    return 0;
  }

  const existing = new Map((existingRows ?? []).map(row => [row.memory_key, row]));
  const now = new Date().toISOString();
  let saved = 0;

  for (const update of input.updates) {
    const supersedes = update.supersedesKeys.filter(key => key !== update.memoryKey);
    if (supersedes.length) {
      const { error } = await supabaseAdmin
        .from('man_edit_style_memories')
        .update({
          status: 'superseded',
          superseded_by_key: update.memoryKey,
          updated_at: now,
        })
        .eq('report_id', reportId)
        .eq('status', 'active')
        .in('memory_key', supersedes);
      if (error) console.warn('[man whatsapp pilot] memory supersession failed:', error.message);
    }

    const current = existing.get(update.memoryKey);
    const { error } = await supabaseAdmin
      .from('man_edit_style_memories')
      .upsert({
        report_id: reportId,
        subscription_id: input.context.subscription?.id ?? null,
        customer_email: customerEmail,
        memory_key: update.memoryKey,
        category: update.category,
        kind: update.kind,
        value: update.value,
        context_scopes: update.contextScopes,
        strength: update.strength,
        confidence: update.confidence,
        evidence_count: Number(current?.evidence_count ?? 0) + 1,
        times_used: Number(current?.times_used ?? 0),
        status: 'active',
        source_whatsapp_message_id: input.sourceWhatsappMessageId,
        superseded_by_key: null,
        created_at: current?.created_at ?? now,
        updated_at: now,
      }, { onConflict: 'report_id,memory_key' });

    if (error) {
      console.warn('[man whatsapp pilot] structured memory save failed:', error.message);
    } else {
      saved += 1;
    }
  }

  return saved;
}

export async function saveManWhatsappRecommendationFingerprint(input: {
  context: ManEditReportContext;
  assistantMessageId: string;
  route: string;
  fingerprint: ManRecommendationFingerprint;
  memoryKeysUsed: string[];
}) {
  const customerEmail = String(
    input.context.subscription?.customer_email ?? input.context.submission.customer_email,
  );
  const uniqueMemoryKeys = [...new Set(input.memoryKeysUsed)];
  const { error } = await supabaseAdmin
    .from('man_edit_recommendation_fingerprints')
    .insert({
      report_id: input.context.report.id,
      subscription_id: input.context.subscription?.id ?? null,
      customer_email: customerEmail,
      assistant_message_id: input.assistantMessageId,
      route: input.route,
      fingerprint: {
        primary_colours: input.fingerprint.primaryColours,
        primary_garments: input.fingerprint.primaryGarments,
        layer_type: input.fingerprint.layerType ?? null,
        bottom_silhouette: input.fingerprint.bottomSilhouette ?? null,
        footwear: input.fingerprint.footwear ?? null,
        archetype: input.fingerprint.archetype ?? null,
      },
      memory_keys_used: uniqueMemoryKeys,
    });

  if (error) {
    console.warn('[man whatsapp pilot] recommendation fingerprint save failed:', error.message);
    return false;
  }

  if (uniqueMemoryKeys.length) {
    const { data: rows, error: loadError } = await supabaseAdmin
      .from('man_edit_style_memories')
      .select('id, times_used')
      .eq('report_id', input.context.report.id)
      .eq('status', 'active')
      .in('memory_key', uniqueMemoryKeys);
    if (loadError) {
      console.warn('[man whatsapp pilot] memory usage load failed:', loadError.message);
    } else {
      await Promise.all((rows ?? []).map(row => supabaseAdmin
        .from('man_edit_style_memories')
        .update({
          times_used: Number(row.times_used ?? 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', row.id)));
    }
  }
  return true;
}
