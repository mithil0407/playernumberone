import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { generateStyleDescription, generateStyleTags } from '@/lib/gemini';
import { isAdminAuthenticated } from '@/lib/adminAuth';

/**
 * POST /api/iconik-club-men/items/enrich
 *
 * Admin-only. Retroactively enriches men's fashion_items with:
 *   1. style_description (prose) — for items where it is NULL
 *   2. style_tags (structured JSON) — for items where it is NULL
 *
 * Each pass processes up to `limit` items sequentially to avoid Gemini rate limits.
 * Safe to call multiple times — only processes items missing the relevant field.
 *
 * Query params:
 *   limit  — max items per pass (default 20, max 50)
 *   mode   — "description" | "tags" | "both" (default "both")
 */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminServerClient();

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 50);
  const mode = url.searchParams.get('mode') ?? 'both';

  let descriptionEnriched = 0;
  let tagsEnriched = 0;
  const failures: { id: string; name: string; field: string; error: string }[] = [];

  // ── Pass 1: Backfill style_description ──────────────────────────────────────
  if (mode === 'description' || mode === 'both') {
    const { data: descItems, error: descFetchError } = await supabase
      .from('men_fashion_items')
      .select('id, item_name, image_url, raw_description')
      .is('style_description', null)
      .eq('status', 'active')
      .limit(limit);

    if (descFetchError) {
      console.error('Men enrich description fetch error:', descFetchError);
      return NextResponse.json({ error: 'Failed to fetch items for description backfill' }, { status: 500 });
    }

    for (const item of descItems ?? []) {
      try {
        const description = await generateStyleDescription(
          item.image_url,
          item.item_name,
          item.raw_description ?? ''
        );

        const { error: updateError } = await supabase
          .from('men_fashion_items')
          .update({ style_description: description })
          .eq('id', item.id);

        if (updateError) throw new Error(updateError.message);

        descriptionEnriched++;
        console.log(`[men][description] Enriched ${descriptionEnriched}: ${item.item_name}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[men][description] Failed "${item.item_name}" (${item.id}):`, message);
        failures.push({ id: item.id, name: item.item_name, field: 'style_description', error: message });
      }
    }
  }

  // ── Pass 2: Backfill style_tags ──────────────────────────────────────────────
  if (mode === 'tags' || mode === 'both') {
    const { data: tagItems, error: tagFetchError } = await supabase
      .from('men_fashion_items')
      .select('id, item_name, image_url, raw_description')
      .is('style_tags', null)
      .eq('status', 'active')
      .limit(limit);

    if (tagFetchError) {
      console.error('Men enrich tags fetch error:', tagFetchError);
      return NextResponse.json({ error: 'Failed to fetch items for tags backfill' }, { status: 500 });
    }

    for (const item of tagItems ?? []) {
      try {
        const tags = await generateStyleTags(
          item.image_url,
          item.item_name,
          item.raw_description ?? ''
        );

        if (!tags) throw new Error('generateStyleTags returned null');

        const { error: updateError } = await supabase
          .from('men_fashion_items')
          .update({ style_tags: tags })
          .eq('id', item.id);

        if (updateError) throw new Error(updateError.message);

        tagsEnriched++;
        console.log(`[men][tags] Enriched ${tagsEnriched}: ${item.item_name}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[men][tags] Failed "${item.item_name}" (${item.id}):`, message);
        failures.push({ id: item.id, name: item.item_name, field: 'style_tags', error: message });
      }
    }
  }

  // ── Remaining counts ─────────────────────────────────────────────────────────
  const { count: remainingDesc } = await supabase
    .from('men_fashion_items')
    .select('id', { count: 'exact', head: true })
    .is('style_description', null)
    .eq('status', 'active');

  const { count: remainingTags } = await supabase
    .from('men_fashion_items')
    .select('id', { count: 'exact', head: true })
    .is('style_tags', null)
    .eq('status', 'active');

  return NextResponse.json({
    message: `Men's batch complete. description: ${descriptionEnriched} enriched, tags: ${tagsEnriched} enriched, ${failures.length} failures.`,
    description_enriched: descriptionEnriched,
    tags_enriched: tagsEnriched,
    failed: failures.length,
    failures,
    remaining_description: remainingDesc ?? null,
    remaining_tags: remainingTags ?? null,
  });
}
