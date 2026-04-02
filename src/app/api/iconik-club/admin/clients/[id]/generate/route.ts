import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { generateOutfitRecommendations } from '@/lib/outfitGenerator';
import { createOutfitCard, type ImageData } from '@/lib/outfitCompositor';
import { sendOutfitsReadyEmail } from '@/lib/email';

const MIME_FOR_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', webp: 'image/webp',
};

const MIN_ITEMS = 8;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: profileId } = await params;
  const force = request.nextUrl.searchParams.get('force') === 'true';
  const admin = createSupabaseAdminServerClient();

  // 1. Load profile
  const { data: profile, error: profileErr } = await admin
    .from('client_profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // 1b. If force=true, wipe existing outfit_sets so we regenerate fresh
  if (force) {
    const { data: existingSets } = await admin
      .from('outfit_sets')
      .select('id')
      .eq('client_id', profileId);

    if (existingSets && existingSets.length > 0) {
      const ids = existingSets.map(s => s.id);
      await admin.from('outfit_items').delete().in('outfit_set_id', ids);
      await admin.from('outfit_sets').delete().in('id', ids);
      console.log(`Admin generate (force) — deleted ${ids.length} existing outfit sets for ${profileId}`);
    }
  }

  // 2. Download client photos from admin-clients storage path
  const [hsDownload, bpDownload] = await Promise.all([
    admin.storage.from('client-photos').download(`admin-clients/${profileId}/headshot.jpg`),
    admin.storage.from('client-photos').download(`admin-clients/${profileId}/body.jpg`),
  ]);

  let clientHeadshot: ImageData | null = null;
  let clientBodyPhoto: ImageData | null = null;

  if (hsDownload.data) {
    const buf = Buffer.from(await hsDownload.data.arrayBuffer());
    clientHeadshot = { data: buf.toString('base64'), mimeType: 'image/jpeg' };
  } else {
    console.warn('Admin generate — headshot download failed:', hsDownload.error?.message);
  }

  if (bpDownload.data) {
    const buf = Buffer.from(await bpDownload.data.arrayBuffer());
    clientBodyPhoto = { data: buf.toString('base64'), mimeType: 'image/jpeg' };
  } else {
    console.warn('Admin generate — body photo download failed:', bpDownload.error?.message);
  }

  // 3. Fetch active fashion items
  const { data: items, error: itemsErr } = await admin
    .from('fashion_items')
    .select('*')
    .eq('status', 'active');

  if (itemsErr || !items?.length) {
    return NextResponse.json({ error: 'No active items in catalog' }, { status: 422 });
  }
  if (items.length < MIN_ITEMS) {
    return NextResponse.json({
      error: `Not enough items — catalog has ${items.length}, need at least ${MIN_ITEMS}.`
    }, { status: 422 });
  }

  // 4. Pre-fetch item images
  const itemImageMap = new Map<string, ImageData>();
  await Promise.all(
    items.filter(i => i.image_url).map(async (item) => {
      const match = item.image_url.match(/\/fashion-items\/([^/?]+\.[a-z]+)/i);
      if (!match) return;
      const { data } = await admin.storage.from('fashion-items').download(match[1]);
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

  // 5. Generate recommendations via Gemini
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
      const { data: outfitSet, error: insertErr } = await admin
        .from('outfit_sets')
        .insert({
          client_id:        profileId,
          occasion:         rec.occasion,
          ai_style_note:    rec.styleNote,
          status:           'generating',
          generation_batch: 1,
        })
        .select()
        .single();

      if (insertErr || !outfitSet) throw new Error('Failed to insert outfit_set');

      const outfitItems = usableItems.filter(item => rec.itemIds.includes(item.id!));
      const cardItems = outfitItems.map(i => ({
        imageUrl:        i.image_url,
        name:            i.item_name,
        category:        i.category ?? 'piece',
        brand:           i.brand ?? null,
        color:           i.color ?? null,
        material:        i.material ?? null,
        rawDescription:  i.raw_description ?? null,
        imageData:       itemImageMap.get(i.id!) ?? null,
      }));

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
            const { data: { publicUrl } } = admin.storage.from('outfit-cards').getPublicUrl(cardPath);
            cardUrl = publicUrl;
          }
        }
      } catch (err) {
        console.error(`Card creation failed for outfit ${outfitSet.id}:`, err);
      }

      await admin
        .from('outfit_sets')
        .update({ outfit_card_url: cardUrl, status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', outfitSet.id);

      if (outfitItems.length > 0) {
        await admin.from('outfit_items').insert(
          outfitItems.map((item, pos) => ({
            outfit_set_id:    outfitSet.id,
            fashion_item_id:  item.id,
            position:         pos,
          }))
        );
      }

      succeeded++;
    } catch (err) {
      console.error('Outfit generation failed for rec:', rec.occasion, err);
    }
  }

  // 7. Refresh preview token (30-day expiry)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await admin
    .from('client_profiles')
    .update({ token_expires_at: expiresAt })
    .eq('id', profileId);

  const { data: refreshed } = await admin
    .from('client_profiles')
    .select('preview_token, name, email, user_id')
    .eq('id', profileId)
    .single();

  // 8. Email the client — link to portal if they have an account, preview otherwise
  if (succeeded > 0 && refreshed?.email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://playernumberone.in';
    const outfitsUrl = refreshed.user_id
      ? `${siteUrl}/iconik-club/client/outfits`
      : `${siteUrl}/iconik-club/preview/${refreshed.preview_token}`;

    await sendOutfitsReadyEmail(
      refreshed.name ?? refreshed.email,
      refreshed.email,
      outfitsUrl,
    );
  }

  return NextResponse.json({
    message:       `Generated ${succeeded} of ${recommendations.length} outfits`,
    preview_token: refreshed?.preview_token ?? null,
  });
}
