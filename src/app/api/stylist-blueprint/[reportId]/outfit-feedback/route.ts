import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  buildLearnedOutfitPayload,
  isOutfitPageNumber,
} from '@/lib/stylistOutfitLearning';
import {
  isVersionedStylistBlueprintReportData,
  type StylistBlueprintReportData,
} from '@/lib/stylistBlueprintGenerator';

type Vote = 'like' | 'dislike';

interface FeedbackRow {
  id: string;
  report_id: string;
  page_number: number;
  library_entry_id: string | null;
  vote: Vote;
  reason: string | null;
  signature: string;
  created_at: string;
  updated_at: string;
}

interface LearnedEntryRow {
  id: string;
  status: string;
  like_count: number | null;
  dislike_count: number | null;
}

function authed(cookieValue: string | undefined) {
  return isAdminAuthenticatedFromCookieValue(cookieValue);
}

async function loadReport(reportId: string): Promise<StylistBlueprintReportData | null> {
  const { data, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('report_data')
    .eq('id', reportId)
    .single();

  if (error || !isVersionedStylistBlueprintReportData(data?.report_data)) return null;
  return data.report_data;
}

async function getCurrentFeedback(reportId: string, pageNumber: number) {
  const { data, error } = await supabaseAdmin
    .from('stylist_outfit_feedback')
    .select('id,report_id,page_number,library_entry_id,vote,reason,signature,created_at,updated_at')
    .eq('report_id', reportId)
    .eq('page_number', pageNumber)
    .maybeSingle();

  if (error) {
    console.error('[stylist outfit feedback GET] error:', error);
    return null;
  }
  return data as FeedbackRow | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  if (!authed(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const pageNumber = Number(request.nextUrl.searchParams.get('pageNumber'));
  if (!Number.isInteger(pageNumber)) {
    return NextResponse.json({ error: 'pageNumber is required' }, { status: 400 });
  }

  const feedback = await getCurrentFeedback(reportId, pageNumber);
  return NextResponse.json({ feedback });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  if (!authed(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json().catch(() => ({}));
  const pageNumber = Number(body.pageNumber);
  const vote = body.vote === 'like' || body.vote === 'dislike' ? body.vote as Vote : null;
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

  if (!Number.isInteger(pageNumber) || !vote) {
    return NextResponse.json({ error: 'Valid pageNumber and vote are required' }, { status: 400 });
  }
  if (vote === 'dislike' && reason.length < 6) {
    return NextResponse.json({ error: 'Please add a short reason for the dislike' }, { status: 400 });
  }

  const reportData = await loadReport(reportId);
  if (!reportData) return NextResponse.json({ error: 'Report not found or not versioned' }, { status: 404 });
  if (!isOutfitPageNumber(pageNumber, reportData)) {
    return NextResponse.json({ error: 'Feedback is only available for outfit pages' }, { status: 400 });
  }

  const page = reportData.pages.find(item => item.page_number === pageNumber);
  if (!page) return NextResponse.json({ error: 'Outfit page not found' }, { status: 404 });

  const payload = buildLearnedOutfitPayload(page, reportData);
  if (!payload.signature) {
    return NextResponse.json({ error: 'Could not compute an outfit signature' }, { status: 400 });
  }

  const currentFeedback = await getCurrentFeedback(reportId, pageNumber);
  if (
    currentFeedback?.vote === vote &&
    currentFeedback.signature === payload.signature &&
    (vote === 'like' || currentFeedback.reason === reason)
  ) {
    return NextResponse.json({
      feedback: currentFeedback,
      libraryEntry: currentFeedback.library_entry_id ? { id: currentFeedback.library_entry_id } : null,
      summary: vote === 'like'
        ? 'This outfit is already promoted.'
        : 'This dislike reason is already saved.',
    });
  }

  const now = new Date().toISOString();
  const { data: existingEntryRaw, error: existingEntryError } = await supabaseAdmin
    .from('stylist_outfit_library_entries')
    .select('id,status,like_count,dislike_count')
    .eq('signature', payload.signature)
    .maybeSingle();

  if (existingEntryError) {
    console.error('[stylist outfit feedback] entry lookup error:', existingEntryError);
    return NextResponse.json({ error: 'Failed to check outfit library' }, { status: 500 });
  }

  let libraryEntry = existingEntryRaw as LearnedEntryRow | null;

  if (vote === 'like') {
    if (libraryEntry) {
      const { data, error } = await supabaseAdmin
        .from('stylist_outfit_library_entries')
        .update({
          status: 'active',
          source_report_id: reportId,
          source_page_number: pageNumber,
          title: payload.title,
          capsule: payload.capsule,
          fields: payload.fields,
          normalised_slots: payload.normalised_slots,
          outfit_snapshot: payload.outfit_snapshot,
          like_count: (libraryEntry.like_count ?? 0) + 1,
          updated_at: now,
        })
        .eq('id', libraryEntry.id)
        .select('id,status,like_count,dislike_count')
        .single();
      if (error || !data) {
        console.error('[stylist outfit feedback] entry update error:', error);
        return NextResponse.json({ error: 'Failed to update learned outfit' }, { status: 500 });
      }
      libraryEntry = data as LearnedEntryRow;
    } else {
      const { data, error } = await supabaseAdmin
        .from('stylist_outfit_library_entries')
        .insert({
          status: 'active',
          source: 'admin_feedback',
          source_report_id: reportId,
          source_page_number: pageNumber,
          title: payload.title,
          capsule: payload.capsule,
          fields: payload.fields,
          normalised_slots: payload.normalised_slots,
          signature: payload.signature,
          outfit_snapshot: payload.outfit_snapshot,
          like_count: 1,
          dislike_count: 0,
        })
        .select('id,status,like_count,dislike_count')
        .single();
      if (error || !data) {
        console.error('[stylist outfit feedback] entry insert error:', error);
        return NextResponse.json({ error: 'Failed to promote learned outfit' }, { status: 500 });
      }
      libraryEntry = data as LearnedEntryRow;
    }
  } else if (libraryEntry) {
    const { data, error } = await supabaseAdmin
      .from('stylist_outfit_library_entries')
      .update({
        status: 'blocked',
        dislike_count: (libraryEntry.dislike_count ?? 0) + 1,
        updated_at: now,
      })
      .eq('id', libraryEntry.id)
      .select('id,status,like_count,dislike_count')
      .single();
    if (error || !data) {
      console.error('[stylist outfit feedback] entry block error:', error);
      return NextResponse.json({ error: 'Failed to block learned outfit' }, { status: 500 });
    }
    libraryEntry = data as LearnedEntryRow;
  }

  const { data: feedback, error: feedbackError } = await supabaseAdmin
    .from('stylist_outfit_feedback')
    .upsert({
      report_id: reportId,
      page_number: pageNumber,
      library_entry_id: libraryEntry?.id ?? null,
      vote,
      reason: vote === 'dislike' ? reason : null,
      signature: payload.signature,
      outfit_snapshot: payload.outfit_snapshot,
      updated_at: now,
    }, { onConflict: 'report_id,page_number' })
    .select('id,report_id,page_number,library_entry_id,vote,reason,signature,created_at,updated_at')
    .single();

  if (feedbackError || !feedback) {
    console.error('[stylist outfit feedback] feedback upsert error:', feedbackError);
    return NextResponse.json({ error: 'Failed to save outfit feedback' }, { status: 500 });
  }

  return NextResponse.json({
    feedback,
    libraryEntry,
    summary: vote === 'like'
      ? 'Promoted as an active learned outfit.'
      : 'Saved dislike reason and blocked this signature from future selection.',
  });
}
