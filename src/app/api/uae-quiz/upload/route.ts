import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'uae-style-quiz';

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

    if (!supabase || !(supabase as { storage?: { from?: unknown } }).storage?.from) {
      return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
    }

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

    const { error: insertError } = await supabase
      .from('uae_quiz_submissions')
      .insert([
        {
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          order_id: orderId,
          quiz_data: quizData,
          full_body_path: fullBodyPath,
          headshot_path: headshotPath
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
