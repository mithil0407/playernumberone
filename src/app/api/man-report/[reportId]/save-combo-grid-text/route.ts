import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { ADMIN_COOKIE, isAdminAuthenticatedFromCookieValue } from '@/lib/adminAuth';
import type { ReportData } from '@/lib/manReportGenerator';
import {
  mergeComboGridGroupText,
  normaliseComboGridText,
  type ComboGridKind,
} from '@/lib/manComboGridSection';
import { revalidateManReportCache } from '@/lib/manReportCache';

const COMBO_GRID_KINDS = new Set<ComboGridKind>(['office', 'evening', 'relaxed']);

function parseComboGridKind(value: unknown): ComboGridKind | null {
  return typeof value === 'string' && COMBO_GRID_KINDS.has(value as ComboGridKind)
    ? value as ComboGridKind
    : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!isAdminAuthenticatedFromCookieValue(cookieValue)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reportId } = await params;
  const body = await request.json();
  const comboGridText = String(body?.comboGridText ?? '').trim();
  const kind = parseComboGridKind(body?.kind);
  if (body?.kind !== undefined && !kind) {
    return NextResponse.json({ error: 'Invalid combo grid kind' }, { status: 400 });
  }
  if (!comboGridText) {
    return NextResponse.json({ error: 'comboGridText is required' }, { status: 400 });
  }

  const { data: report, error } = await supabaseAdmin
    .from('man_reports')
    .select('report_data, share_token')
    .eq('id', reportId)
    .single();

  if (error || !report?.report_data) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const reportData = report.report_data as ReportData;
  const existingComboText = reportData.sections.s4_combo_grids ?? '';
  const normalised = kind
    ? mergeComboGridGroupText(existingComboText, kind, comboGridText)
    : normaliseComboGridText(comboGridText);
  if (!normalised.ok) {
    return NextResponse.json({ error: normalised.error }, { status: 400 });
  }

  const nextReportData: ReportData = {
    ...reportData,
    sections: {
      ...reportData.sections,
      s4_combo_grids: normalised.text,
    },
  };

  const { error: saveError } = await supabaseAdmin
    .from('man_reports')
    .update({
      report_data: nextReportData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  await revalidateManReportCache(reportId, report.share_token ?? null);

  return NextResponse.json({ updatedComboGridText: normalised.text, kind });
}
