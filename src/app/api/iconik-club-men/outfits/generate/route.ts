import { NextResponse } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { generateMenOutfitRecommendations } from '@/lib/menOutfitGenerator';
import { createOutfitCard, type ImageData } from '@/lib/outfitCompositor';

const MIME_FOR_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png',  webp: 'image/webp',
};

const MIN_ITEMS = 8;

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createSupabaseAdminServerClient();

  // 1. Get men client profile
  const { data: profile, error: profileErr } = await admin
    .from('men_client_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // 2. Download client photos
  const [hsDownload, bpDownload] = await Promise.all([
    admin.storage.from('men-client-photos').download(`${user.id}/headshot.jpg`),
    admin.storage.from('men-client-photos').download(`${user.id}/body.jpg`),
  ]);

  let clientHeadshot: ImageData | null = null;
  let clientBodyPhoto: ImageData | null = null;

  if (hsDownload.data) {
    clientHeadshot = { data: Buffer.from(await hsDownload.data.arrayBuffer()).toString('base64'), mimeType: 'image/jpeg' };
  }
  if (bpDownload.data) {
    clientBodyPhoto = { data: Buffer.from(await bpDownload.data.arrayBuffer()).toString('base64'), mimeType: 'image/jpeg' };
  }

  // 3. Skip if outfits already generated
  const { data: existing } = await admin
    .from('men_outfit_sets')
    .select('id')
    .eq('client_id', profile.id)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ message: 'Outfits already generated' });
  }

  // 4. Fetch active men's fashion items
  const { data: items, error: itemsErr } = await admin
    .from('men_fashion_items')
    .select('*')
    .eq('status', 'active');

  if (itemsErr || !items?.length) {
    return NextResponse.json({ error: 'No active items in men\'s catalog' }, { status: 422 });
  }
  if (items.length < MIN_ITEMS) {
    return NextResponse.json({
      error: `Not enough items — catalog has ${items.length}, need at least ${MIN_ITEMS}.`
    }, { status: 422 });
  }

  // 5. Pre-fetch item images
  const itemImageMap = new Map<string, ImageData>();
  await Promise.all(
    items.filter(i => i.image_url).map(async (item) => {
      const match = item.image_url.match(/\/men-fashion-items\/([^/?]+\.[a-z]+)/i);
      if (!match) return;
      const { data } = await admin.storage.from('men-fashion-items').download(match[1]);
      if (data) {
        const buf = Buffer.from(await data.arrayBuffer());
        const ext = match[1].split('.').pop()?.toLowerCase() ?? 'jpg';
        itemImageMap.set(item.id!, { data: buf.toString('base64'), mimeType: MIME_FOR_EXT[ext] ?? 'image/jpeg' });
      }
    })
  );

  const usableItems = items.filter(i => i.id && itemImageMap.has(i.id));
  if (usableItems.length < MIN_ITEMS) {
    return NextResponse.json({
      error: `Only ${usableItems.length} item(s) have valid images, need at least ${MIN_ITEMS}.`
    }, { status: 422 });
  }

  // 6. Generate recommendations via Gemini
  let recommendations;
  try {
    recommendations = await generateMenOutfitRecommendations(profile, usableItems);
  } catch (err) {
    console.error('Gemini men outfit generation error:', err);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }

  // 7. Create outfit sets sequentially (no parallel Gemini image calls)
  let succeeded = 0;
  for (const rec of recommendations) {
    try {
      const { data: outfitSet, error: insertErr } = await admin
        .from('men_outfit_sets')
        .insert({
          client_id:        profile.id,
          occasion:         rec.occasion,
          ai_style_note:    rec.styleNote,
          status:           'generating',
          generation_batch: 1,
        })
        .select()
        .single();

      if (insertErr || !outfitSet) throw new Error('Failed to insert men_outfit_set');

      const outfitItems = usableItems.filter(item => rec.itemIds.includes(item.id!));
      const cardItems = outfitItems.map(i => ({
        imageUrl:       i.image_url,
        name:           i.item_name,
        category:       i.category ?? 'piece',
        brand:          i.brand ?? null,
        color:          i.color ?? null,
        material:       i.material ?? null,
        rawDescription: i.raw_description ?? null,
        imageData:      itemImageMap.get(i.id!) ?? null,
      }));

      let cardUrl: string | null = null;
      try {
        if (cardItems.length > 0) {
          const cardBuffer = await createOutfitCard(
            { headshot: clientHeadshot, bodyPhoto: clientBodyPhoto },
            cardItems,
            rec.styleNote
          );
          const cardPath = `${outfitSet.id}.jpg`;
          const { error: uploadErr } = await admin.storage
            .from('men-outfit-cards')
            .upload(cardPath, cardBuffer, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr) {
            const { data: { publicUrl } } = admin.storage
              .from('men-outfit-cards')
              .getPublicUrl(cardPath);
            cardUrl = publicUrl;
          }
        }
      } catch (err) {
        console.error(`Men card creation failed for outfit ${outfitSet.id}:`, err);
      }

      await admin
        .from('men_outfit_sets')
        .update({ outfit_card_url: cardUrl, status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', outfitSet.id);

      if (outfitItems.length > 0) {
        await admin.from('men_outfit_items').insert(
          outfitItems.map((item, pos) => ({
            outfit_set_id:   outfitSet.id,
            fashion_item_id: item.id,
            position:        pos,
          }))
        );
      }

      succeeded++;
    } catch (err) {
      console.error('Men outfit generation failed for rec:', rec.occasion, err);
    }
  }

  return NextResponse.json({ message: `Generated ${succeeded} of ${recommendations.length} outfits` });
}
