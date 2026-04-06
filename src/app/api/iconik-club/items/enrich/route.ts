import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { generateStyleDescription } from '@/lib/gemini';
import { isAdminAuthenticated } from '@/lib/adminAuth';

/**
 * POST /api/iconik-club/items/enrich
 *
 * Admin-only. Retroactively generates style_description for all women's
 * fashion_items where the field is currently NULL.
 *
 * Processes items sequentially (not in parallel) to avoid rate-limiting
 * Gemini. Returns a summary of how many were enriched vs. failed.
 *
 * Safe to call multiple times — only processes items missing a description.
 */
export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createSupabaseAdminServerClient();

  // Fetch all items without a style_description
  const { data: items, error: fetchError } = await supabase
    .from('fashion_items')
    .select('id, item_name, image_url, raw_description')
    .is('style_description', null)
    .eq('status', 'active');

  if (fetchError) {
    console.error('Enrich fetch error:', fetchError);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ message: 'All active items already have a style_description', enriched: 0, failed: 0 });
  }

  let enriched = 0;
  const failures: { id: string; name: string; error: string }[] = [];

  for (const item of items) {
    try {
      const description = await generateStyleDescription(
        item.image_url,
        item.item_name,
        item.raw_description ?? ''
      );

      const { error: updateError } = await supabase
        .from('fashion_items')
        .update({ style_description: description })
        .eq('id', item.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      enriched++;
      console.log(`Enriched [${enriched}/${items.length}]: ${item.item_name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Failed to enrich "${item.item_name}" (${item.id}):`, message);
      failures.push({ id: item.id, name: item.item_name, error: message });
    }
  }

  return NextResponse.json({
    message: `Enrichment complete. ${enriched} succeeded, ${failures.length} failed.`,
    enriched,
    failed: failures.length,
    failures,
  });
}
