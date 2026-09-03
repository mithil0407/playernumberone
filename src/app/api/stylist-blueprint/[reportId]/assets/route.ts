import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import {
  STYLIST_BLUEPRINT_VISIBLE_IMAGE_SLOTS,
  buildStylistBlueprintManualImagePrompt,
  isStylistBlueprintImageSlotKey,
  resolveStylistBlueprintImageUrls,
  uploadStylistBlueprintManualImage,
  type StylistBlueprintImagePaths,
  type StylistBlueprintImageSlotKey,
} from '@/lib/stylistBlueprintImageGenerator';
import {
  getStylistBlueprintBodyGeometryPage,
  getStylistBlueprintChromaticPage,
  getStylistBlueprintColourDrapePage,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintEyeframePage,
  getStylistBlueprintFaceArchitecturePage,
  getStylistBlueprintHairColourPage,
  getStylistBlueprintHairstylePage,
  getStylistBlueprintMakeupPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintRulesStartPage,
  getStylistBlueprintTransformationPage,
  isVersionedStylistBlueprintReportData,
  type StylistBlueprintReportData,
} from '@/lib/stylistBlueprintGenerator';

export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function labelForSlot(slot: StylistBlueprintImageSlotKey) {
  const index = Number(slot.split('.').at(-1));
  if (slot.startsWith('application.outfitFlatlays.') && Number.isInteger(index)) return `Outfit ${index + 1}`;
  if (slot.startsWith('application.transformationLooks.') && Number.isInteger(index)) return `Transformation look ${index + 1}`;
  if (slot.startsWith('application.silhouetteProofs.') && Number.isInteger(index)) return `Silhouette proof ${index + 1}`;
  return slot.split('.').at(-1)?.replace(/([A-Z])/g, ' $1').replace(/^./, value => value.toUpperCase()) ?? slot;
}

function currentImageForSlot(paths: StylistBlueprintImagePaths | null | undefined, slot: StylistBlueprintImageSlotKey): string | null {
  const parts = slot.split('.');
  let current: unknown = paths;
  for (const part of parts) {
    if (current == null) return null;
    if (Array.isArray(current)) current = current[Number(part)];
    else if (typeof current === 'object') current = (current as Record<string, unknown>)[part];
    else return null;
  }
  return typeof current === 'string' ? current : null;
}

function pageForSlot(slot: StylistBlueprintImageSlotKey, data: StylistBlueprintReportData) {
  if (slot === 'diagnosis.silhouetteFront' || slot === 'diagnosis.silhouetteSide') return getStylistBlueprintBodyGeometryPage(data);
  if (slot === 'diagnosis.undertoneMap') return getStylistBlueprintChromaticPage(data);
  if (slot === 'diagnosis.faceShapeDiagram') return getStylistBlueprintFaceArchitecturePage(data);
  if (slot === 'prescription.colourDrapeComparison') return getStylistBlueprintColourDrapePage(data);
  if (slot === 'prescription.hairDirections') return getStylistBlueprintHairstylePage(data);
  if (slot === 'prescription.hairColourDirections') return getStylistBlueprintHairColourPage(data);
  if (slot === 'prescription.eyewearFrames') return getStylistBlueprintEyeframePage(data);
  if (slot === 'prescription.makeupLook') return getStylistBlueprintMakeupPage(data);
  if (slot.startsWith('application.transformationLooks.')) return getStylistBlueprintTransformationPage(data);
  if (slot.startsWith('application.silhouetteProofs.')) return getStylistBlueprintRulesStartPage(data);
  if (slot.startsWith('application.outfitFlatlays.')) return getStylistBlueprintOutfitStartPage(data) + Number(slot.split('.').at(-1));
  if (slot === 'closing.editTeaser') return getStylistBlueprintContinuationPage(data);
  return null;
}

async function loadReport(reportId: string) {
  const { data, error } = await supabaseAdmin
    .from('stylist_blueprint_reports')
    .select('id, report_data, image_urls, share_token, section_approvals')
    .eq('id', reportId)
    .single();
  if (error || !data || !isVersionedStylistBlueprintReportData(data.report_data)) return null;
  return { ...data, report_data: data.report_data as StylistBlueprintReportData };
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const report = await loadReport(reportId);
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  const resolved = await resolveStylistBlueprintImageUrls(report.image_urls as StylistBlueprintImagePaths | null);
  const prompts = STYLIST_BLUEPRINT_VISIBLE_IMAGE_SLOTS.flatMap(slotKey => {
    try {
      const plan = buildStylistBlueprintManualImagePrompt(slotKey, report.report_data);
      return [{ slotKey, label: labelForSlot(slotKey), ...plan, currentUrl: currentImageForSlot(resolved, slotKey) }];
    } catch {
      return [];
    }
  });
  return NextResponse.json({ prompts, imageUrls: resolved });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  if (!(await canAccessBlueprintReport(reportId))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const report = await loadReport(reportId);
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  const form = await request.formData();
  const slotKey = form.get('slotKey');
  const file = form.get('file');
  if (!isStylistBlueprintImageSlotKey(slotKey)) return NextResponse.json({ error: 'Invalid image slot' }, { status: 400 });
  if (!(file instanceof File) || !file.type.startsWith('image/')) return NextResponse.json({ error: 'Choose a JPG, PNG or WebP image' }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'Image must be smaller than 8 MB' }, { status: 400 });
  try {
    const result = await uploadStylistBlueprintManualImage({
      reportId,
      reportData: report.report_data,
      slotKey,
      buffer: Buffer.from(await file.arrayBuffer()),
      shareToken: report.share_token,
    });
    const pageNumber = pageForSlot(slotKey, report.report_data);
    if (pageNumber) {
      await supabaseAdmin
        .from('stylist_blueprint_reports')
        .update({
          section_approvals: { ...((report.section_approvals as Record<string, boolean> | null) ?? {}), [`p${pageNumber}`]: false },
          published_at: null,
          delivered_at: null,
          status: 'in_review',
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId);
    }
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Image upload failed' }, { status: 500 });
  }
}
