import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminServerClient } from '@/lib/supabaseServer';
import { parseItemWithGemini, aiResultToFashionItem } from '@/lib/gemini';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  try {
    if (!isAdminAuthenticated(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData       = await request.formData();
    const imageFile      = formData.get('image') as File | null;
    const rawDescription = (formData.get('raw_description') as string) ?? '';

    if (!imageFile) {
      return NextResponse.json({ error: 'image field is required' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, and WebP images are supported' }, { status: 400 });
    }

    const buffer   = Buffer.from(await imageFile.arrayBuffer());
    const base64   = buffer.toString('base64');
    const admin    = createSupabaseAdminServerClient();
    const fileExt  = imageFile.name.split('.').pop() ?? 'jpg';
    const storageKey = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await admin.storage
      .from('men-fashion-items')
      .upload(storageKey, buffer, { contentType: imageFile.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
    }

    const { data: urlData } = admin.storage.from('men-fashion-items').getPublicUrl(storageKey);

    if (!urlData.publicUrl.includes(storageKey)) {
      return NextResponse.json({ error: 'Storage URL malformed' }, { status: 500 });
    }

    // Gemini extracts structured item data — same AI pipeline as women's catalog
    const aiResult = await parseItemWithGemini(base64, imageFile.type, rawDescription);
    const itemData = aiResultToFashionItem(aiResult, urlData.publicUrl, rawDescription, null);

    const { data: savedItem, error: dbError } = await admin
      .from('men_fashion_items')
      .insert([itemData])
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: savedItem, ai_extracted: aiResult });
  } catch (err) {
    console.error('Men item ingest error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
