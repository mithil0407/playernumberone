import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import { generateStyleEditImages } from '@/lib/styleEditImageGenerator';
import type { StyleEditPageData } from '@/lib/styleEditTypes';

export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> },
) {
  const cookieStore = await cookies();
  if (!isAdminAuthenticatedFromCookieValue(cookieStore.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { issueId } = await params;
  const { data: issue, error } = await supabaseAdmin
    .from('style_edit_issues')
    .select('page_data')
    .eq('id', issueId)
    .single();

  if (error || !issue?.page_data) {
    return NextResponse.json({ error: 'Issue page data not found' }, { status: 404 });
  }

  try {
    const imagePaths = await generateStyleEditImages(issueId, issue.page_data as StyleEditPageData);
    return NextResponse.json({ success: true, imagePaths });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed';
    await supabaseAdmin
      .from('style_edit_issues')
      .update({ status: 'error', progress_stage: null, error_message: message, updated_at: new Date().toISOString() })
      .eq('id', issueId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
