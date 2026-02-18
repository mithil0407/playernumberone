import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = process.env.NEXT_PUBLIC_UAE_QUIZ_BUCKET || 'uae-style-quiz';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const fullBody = formData.get('full_body') as File | null;
    const headshot = formData.get('headshot') as File | null;
    const quizDataRaw = formData.get('quiz_data');
    const customerEmail = formData.get('customer_email') as string | null;
    const customerPhone = formData.get('customer_phone') as string | null;
    const customerName = formData.get('customer_name') as string | null;
    const orderId = formData.get('order_id') as string | null;

    if (!fullBody || !headshot || !quizDataRaw || !customerEmail || !customerPhone || !customerName || !orderId) {
      return NextResponse.json({ success: false, error: 'Missing required data' }, { status: 400 });
    }

    const quizData = JSON.parse(quizDataRaw.toString());

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const timestamp = Date.now();
    const safeEmail = customerEmail.replace(/[^a-z0-9@._-]/gi, '-');
    const basePath = `uae/${safeEmail}/${orderId}/${timestamp}`;

    const fullBodyPath = `${basePath}/full-body-${fullBody.name}`;
    const headshotPath = `${basePath}/headshot-${headshot.name}`;

    const { error: fullBodyError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fullBodyPath, fullBody, {
        cacheControl: '3600',
        upsert: true,
        contentType: fullBody.type || 'image/jpeg'
      });

    if (fullBodyError) {
      return NextResponse.json({ success: false, error: 'Failed to upload full body photo' }, { status: 500 });
    }

    const { error: headshotError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(headshotPath, headshot, {
        cacheControl: '3600',
        upsert: true,
        contentType: headshot.type || 'image/jpeg'
      });

    if (headshotError) {
      return NextResponse.json({ success: false, error: 'Failed to upload headshot' }, { status: 500 });
    }

    const fullBodyUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(fullBodyPath).data.publicUrl;
    const headshotUrl = supabase.storage.from(BUCKET_NAME).getPublicUrl(headshotPath).data.publicUrl;

    const { error: insertError } = await supabase
      .from('uae_quiz_submissions')
      .insert([
        {
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          order_id: orderId,
          quiz_data: quizData,
          full_body_path: fullBodyUrl || fullBodyPath,
          headshot_path: headshotUrl || headshotPath
        }
      ]);

    if (insertError) {
      return NextResponse.json({ success: false, error: 'Failed to save quiz data' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('UAE quiz upload error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
