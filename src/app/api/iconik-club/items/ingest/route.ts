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
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and WebP images are supported' },
        { status: 400 }
      );
    }

    // Convert to buffer + base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);
    const base64      = buffer.toString('base64');

    // Upload to Supabase Storage (fashion-items bucket)
    const supabaseAdmin = createSupabaseAdminServerClient();
    const fileExt   = imageFile.name.split('.').pop() ?? 'jpg';
    const storageKey = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('fashion-items')
      .upload(storageKey, buffer, { contentType: imageFile.type, upsert: false });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('fashion-items')
      .getPublicUrl(storageKey);

    // Sanity-check: URL must contain the actual filename
    if (!urlData.publicUrl.includes(storageKey)) {
      return NextResponse.json({ error: 'Storage URL malformed — upload may have failed' }, { status: 500 });
    }

    // Call Gemini 2.5 Flash
    const aiResult = await parseItemWithGemini(base64, imageFile.type, rawDescription);

    // Save as draft
    const itemData = aiResultToFashionItem(
      aiResult,
      urlData.publicUrl,
      rawDescription,
      null
    );

    const { data: savedItem, error: dbError } = await supabaseAdmin
      .from('fashion_items')
      .insert([itemData])
      .select()
      .single();

    if (dbError) {
      console.error('DB insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: savedItem, ai_extracted: aiResult });
  } catch (err) {
    console.error('Ingest error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
