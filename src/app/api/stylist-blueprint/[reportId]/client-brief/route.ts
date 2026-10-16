import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/**
 * The client's own answers for the report editor. Stylists lost sight of them,
 * above all the Western/Indian mix, once they moved from the client page into
 * the report, and read that as the dashboard wiping the client's data.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: report } = await supabaseAdmin.from('stylist_blueprint_reports').select('submission_id').eq('id', reportId).maybeSingle();
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  const { data: intake } = await supabaseAdmin
    .from('stylist_intake_responses')
    .select('piece_preferences, coverage_requirements, lifestyle_context, raw_consultation_notes')
    .eq('id', report.submission_id)
    .maybeSingle();
  const prefs = record(intake?.piece_preferences);
  const coverage = record(intake?.coverage_requirements);
  const lifestyle = record(intake?.lifestyle_context);
  return NextResponse.json({
    brief: {
      westernIndian: prefs.outfit_ratio ?? null,
      goToOutfits: prefs.go_to_outfits ?? null,
      loved: prefs.loved ?? null,
      avoided: prefs.avoided ?? null,
      footwear: prefs.footwear ?? null,
      colour: prefs.colour_family ?? null,
      metal: prefs.metal_preference ?? null,
      boundaries: coverage.boundaries ?? null,
      fit: coverage.fit_restrictions ?? null,
      occasions: lifestyle.occasions ?? null,
      notes: intake?.raw_consultation_notes ?? null,
    },
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
