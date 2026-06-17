import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { parseManualStylistNotes } from '@/lib/stylistManualNotesParser';

const BUCKET = 'stylist-intake-photos';
const REQUIRED_PHOTOS = [
  ['headshot', 'Headshot'] as const,
  ['full_body_front', 'Full body front'] as const,
  ['full_body_side', 'Full body side profile'] as const,
];

function safeSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'client';
}

function extensionFor(file: File) {
  const fromName = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : '';
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  const fromType = file.type.split('/')[1]?.toLowerCase();
  return fromType || 'jpg';
}

function cleanOptional(value: FormDataEntryValue | null) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

async function uploadPhoto(file: File, path: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    });
  if (error) throw error;
  const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(data.path);
  return publicData.publicUrl;
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const rawNotes = cleanOptional(formData.get('raw_notes'));
    if (rawNotes.length < 20) {
      return NextResponse.json({ error: 'Paste the consultation notes before creating a report.' }, { status: 400 });
    }

    for (const [key, label] of REQUIRED_PHOTOS) {
      const file = formData.get(key);
      if (!(file instanceof File) || !file.size) {
        return NextResponse.json({ error: `${label} image is required.` }, { status: 400 });
      }
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: `${label} must be an image file.` }, { status: 400 });
      }
    }

    const parsed = parseManualStylistNotes(rawNotes);
    const fullName = cleanOptional(formData.get('full_name')) || parsed.fullName;
    const customerPhone = cleanOptional(formData.get('customer_phone')) || parsed.customerPhone;
    if (!fullName) {
      return NextResponse.json({ error: 'Client name is required. Add it in the notes title or override field.' }, { status: 400 });
    }
    if (!customerPhone) {
      return NextResponse.json({ error: 'Client phone is required. Add it in the notes or override field.' }, { status: 400 });
    }

    const folder = `manual/${Date.now()}-${safeSegment(fullName)}`;
    const photoUrls: Record<string, string> = {};
    for (const [key] of REQUIRED_PHOTOS) {
      const file = formData.get(key) as File;
      const path = `${folder}/${key}.${extensionFor(file)}`;
      photoUrls[key] = await uploadPhoto(file, path);
    }

    const now = new Date().toISOString();
    const payload = {
      order_id: null,
      lead_id: null,
      customer_email: null,
      customer_phone: customerPhone,
      full_name: fullName,
      age_range: parsed.ageRange || null,
      country: 'India',
      primary_language: 'English',
      body_measurements: parsed.bodyMeasurements,
      photo_urls: photoUrls,
      focus_areas: parsed.focusAreas,
      coverage_requirements: parsed.coverageRequirements,
      lifestyle_context: parsed.lifestyleContext,
      piece_preferences: parsed.piecePreferences,
      selected_moodboard_id: null,
      selected_moodboard_label: parsed.selectedMoodboardLabel,
      secondary_moodboard_elements: parsed.secondaryMoodboardElements,
      hair_context: parsed.hairContext,
      skin_tone_self_description: parsed.skinToneSelfDescription,
      shopping_relationship: parsed.shoppingRelationship,
      prior_styling_experience: parsed.priorStylingExperience,
      one_outfit_description: null,
      one_outfit_image_url: null,
      completion_percentage: 100,
      completed_at: now,
      updated_at: now,
      intake_source: 'manual_admin',
      raw_consultation_notes: parsed.rawConsultationNotes,
    };

    const { data, error } = await supabaseAdmin
      .from('stylist_intake_responses')
      .insert([payload])
      .select('id')
      .single();

    if (error || !data) {
      console.error('[stylist-admin manual-submissions] insert failed:', error);
      return NextResponse.json({ error: error?.message || 'Manual intake creation failed.' }, { status: 500 });
    }

    return NextResponse.json({ submissionId: data.id });
  } catch (error) {
    console.error('[stylist-admin manual-submissions] failed:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Manual intake creation failed.',
    }, { status: 500 });
  }
}
