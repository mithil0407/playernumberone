import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { generateEditorialOutfitVisual } from '@/lib/styleScanGeneration';
import type { InstantReportV1 } from '@/lib/styleScan';

export const maxDuration = 120;

export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  if (!isAdminAuthenticated(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { reportId } = await params;
  const { index } = await request.json();
  if (!Number.isInteger(index) || index < 0 || index > 9) return NextResponse.json({ error: 'Invalid outfit index.' }, { status: 400 });
  const { data: report, error } = await supabaseAdmin.from('instant_reports').select('report_data, image_paths').eq('id', reportId).single();
  if (error || !report) return NextResponse.json({ error: 'Report not found.' }, { status: 404 });
  const data = report.report_data as InstantReportV1;
  const path = await generateEditorialOutfitVisual({ ownerId: reportId, slot: `outfit-${String(index + 1).padStart(2, '0')}`, outfit: data.outfits[index], palette: data.palette.slice(0, 5) });
  const paths = report.image_paths && typeof report.image_paths === 'object' ? (report.image_paths as { outfits?: string[] }).outfits || [] : [];
  paths[index] = path;
  await supabaseAdmin.from('instant_reports').update({ image_paths: { outfits: paths }, updated_at: new Date().toISOString() }).eq('id', reportId);
  return NextResponse.json({ success: true });
}
