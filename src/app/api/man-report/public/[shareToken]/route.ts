import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveManReportImageUrls, type ManReportImagePaths } from '@/lib/manImageGenerator';

// GET — fetch report by share token (no auth required)
// Returns any report that has content — the share token itself is the access gate.
// Statuses 'generating' and 'error' are excluded (no content to show).

const VIEWABLE_STATUSES = ['sent', 'draft_ready', 'in_review', 'approved'];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  const { data, error } = await supabaseAdmin
    .from('man_reports')
    .select('id, status, report_data, image_urls, share_token, sent_at')
    .eq('share_token', shareToken)
    .in('status', VIEWABLE_STATUSES)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Report not found or not yet published' }, { status: 404 });
  }

  // Resolve storage paths → fresh signed URLs before sending to client
  const imageUrls = await resolveManReportImageUrls(
    data.image_urls as ManReportImagePaths | null
  );

  return NextResponse.json({
    report: {
      ...data,
      image_urls: imageUrls,
    },
  });
}
