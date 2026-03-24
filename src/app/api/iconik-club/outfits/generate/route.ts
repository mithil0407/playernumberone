import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { generateOutfitRecommendations } from '@/lib/outfitGenerator';
import { createOutfitCard, type ImageData } from '@/lib/outfitCompositor';

const MIME_FOR_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp',
};

export async function POST() {
  // 1. Auth
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminServerClient();

  // 2. Get client profile
  const { data: profile, error: profileErr } = await admin
    .from('client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // 2b. Download client photos directly from storage (avoids relying on stored signed URLs)
  const [hsDownload, bpDownload] = await Promise.all([
    admin.storage.from('client-photos').download(`${user.id}/headshot.jpg`),
    admin.storage.from('client-photos').download(`${user.id}/body.jpg`),
  ]);

  let clientHeadshot: ImageData | null = null;
  let clientBodyPhoto: ImageData | null = null;

  if (hsDownload.data) {
    const buf = Buffer.from(await hsDownload.data.arrayBuffer());
    clientHeadshot = { data: buf.toString('base64'), mimeType: 'image/jpeg' };
  } else {
    console.warn('Failed to download client headshot:', hsDownload.error?.message);
  }

  if (bpDownload.data) {
    const buf = Buffer.from(await bpDownload.data.arrayBuffer());
    clientBodyPhoto = { data: buf.toString('base64'), mimeType: 'image/jpeg' };
  } else {
    console.warn('Failed to download client body photo:', bpDownload.error?.message);
  }

  console.log(`Client photos loaded — headshot:${!!clientHeadshot} body:${!!clientBodyPhoto}`);

  // 3. Skip if outfits already exist for this batch
  const { data: existing } = await admin
    .from('outfit_sets')
    .select('id')
    .eq('client_id', profile.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ message: 'Outfits already generated' });
  }

  // 4. Fetch active fashion items
  const { data: items, error: itemsErr } = await admin
    .from('fashion_items')
    .select('*')
    .eq('status', 'active');

  const MIN_ITEMS = 8; // need enough variety to build 6 distinct outfits
  if (itemsErr || !items?.length) {
    return NextResponse.json({ error: 'No active items in catalog' }, { status: 422 });
  }
  if (items.length < MIN_ITEMS) {
    return NextResponse.json({
      error: `Not enough items — catalog has ${items.length} active item(s), need at least ${MIN_ITEMS} to generate outfits.`
    }, { status: 422 });
  }

  // 4b. Pre-fetch all fashion item images from storage (download once, reuse across outfits)
  const itemImageMap = new Map<string, ImageData>();
  await Promise.all(
    items.filter(i => i.image_url).map(async (item) => {
      // Extract storage key from public URL (e.g. ".../fashion-items/UUID.jpg")
      const match = item.image_url.match(/\/fashion-items\/([^/?]+\.[a-z]+)/i);
      if (!match) {
        console.warn(`Item ${item.id} "${item.item_name}" has invalid image URL: ${item.image_url}`);
        return;
      }
      const { data, error } = await admin.storage.from('fashion-items').download(match[1]);
      if (data) {
        const buf = Buffer.from(await data.arrayBuffer());
        const ext = match[1].split('.').pop()?.toLowerCase() ?? 'jpg';
        itemImageMap.set(item.id!, { data: buf.toString('base64'), mimeType: MIME_FOR_EXT[ext] ?? 'image/jpeg' });
      } else {
        console.warn(`Failed to download item ${item.id} "${item.item_name}":`, error?.message);
      }
    })
  );

  // Only send items with successfully loaded images to the AI —
  // this prevents the AI from recommending items we can't render.
  const usableItems = items.filter(i => i.id && itemImageMap.has(i.id));
  console.log(`Fashion item images loaded: ${itemImageMap.size}/${items.length} — using ${usableItems.length} items for recommendations`);

  if (usableItems.length < MIN_ITEMS) {
    return NextResponse.json({
      error: `Only ${usableItems.length} item(s) have valid images, need at least ${MIN_ITEMS}.`
    }, { status: 422 });
  }

  // 5. Generate recommendations via Gemini (only usable items with loaded images)
  let recommendations;
  try {
    recommendations = await generateOutfitRecommendations(profile, usableItems);
  } catch (err) {
    console.error('Gemini outfit generation error:', err);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }

  // 6. Create outfit sets sequentially — Gemini image generation must not run in parallel.
  // Concurrent requests referencing the same person trigger safety overrides and rate limits,
  // causing all but the first image to lose identity fidelity.
  let succeeded = 0;
  for (const rec of recommendations) {
    try {
      // Insert outfit_set row
      const { data: outfitSet, error: insertErr } = await admin
        .from('outfit_sets')
        .insert({
          client_id: profile.id,
          occasion: rec.occasion,
          ai_style_note: rec.styleNote,
          status: 'generating',
          generation_batch: 1,
        })
        .select()
        .single();

      if (insertErr || !outfitSet) throw new Error('Failed to insert outfit_set');

      // Resolve the actual item rows (only from usable items with loaded images)
      const outfitItems = usableItems.filter(item => rec.itemIds.includes(item.id!));
      const cardItems = outfitItems.map(i => ({
        imageUrl: i.image_url,
        name: i.item_name,
        category: i.category ?? 'piece',
        brand: i.brand ?? null,
        color: i.color ?? null,
        material: i.material ?? null,
        rawDescription: i.raw_description ?? null,
        imageData: itemImageMap.get(i.id!) ?? null,
      }));

      // Create AI editorial card
      let cardUrl: string | null = null;
      try {
        if (cardItems.length > 0) {
          const cardBuffer = await createOutfitCard(
            { headshot: clientHeadshot, bodyPhoto: clientBodyPhoto },
            cardItems,
            rec.styleNote
          );
          const cardPath = `outfit-cards/${outfitSet.id}.jpg`;

          const { error: uploadErr } = await admin.storage
            .from('outfit-cards')
            .upload(cardPath, cardBuffer, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr) {
            const { data: { publicUrl } } = admin.storage
              .from('outfit-cards')
              .getPublicUrl(cardPath);
            cardUrl = publicUrl;
          }
        }
      } catch (err) {
        console.error(`Card creation failed for outfit ${outfitSet.id}:`, err);
      }

      // Update outfit_set with card URL + mark ready
      await admin
        .from('outfit_sets')
        .update({ outfit_card_url: cardUrl, status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', outfitSet.id);

      // Insert junction rows
      if (outfitItems.length > 0) {
        await admin.from('outfit_items').insert(
          outfitItems.map((item, pos) => ({
            outfit_set_id: outfitSet.id,
            fashion_item_id: item.id,
            position: pos,
          }))
        );
      }

      succeeded++;
    } catch (err) {
      console.error('Outfit generation failed for rec:', rec.occasion, err);
    }
  }
  return NextResponse.json({ message: `Generated ${succeeded} of ${recommendations.length} outfits` });
}
