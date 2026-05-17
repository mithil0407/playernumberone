import {
  runClassification,
  runGroomingImageClassification,
  runSection0,
  runSection1,
  runSection2,
  runSection3,
  runSection4,
  runSection5,
  runSection6,
  runSection6Shopping,
  runSection7GroomingSkin,
  repairSection4OutfitsUntilQaPass,
  type ClassificationResult,
  type ReportData,
  type ReportSections,
} from '@/lib/manReportGenerator';
import type { ManIntakeSubmission } from '@/lib/supabaseMan';
import { supabaseAdmin } from '@/lib/supabase';
import { revalidateManReportCache } from '@/lib/manReportCache';

type SectionField = keyof ReportSections;
type PartialSections = Partial<Record<SectionField, string>>;

const SECTION_FIELDS: SectionField[] = [
  's0_snapshot',
  's1_face',
  's2_body',
  's3_colour',
  's4_outfits',
  's4_combo_grids',
  's5_shopping',
  's5_grooming_skin',
  's6_identity',
];

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normaliseReportData(reportData: ReportData | null | undefined): {
  classification: ClassificationResult | null;
  sections: PartialSections;
  qa: ReportData['qa'];
} {
  return {
    classification: reportData?.classification ?? null,
    sections: { ...(reportData?.sections ?? {}) },
    qa: reportData?.qa ?? {},
  };
}

function section4HasBlockingQa(qa: ReportData['qa']): boolean {
  const issues = qa?.section4?.issues ?? [];
  return issues.some(issue => issue.severity === 'error');
}

function section4NeedsQa(reportData: ReportData | null | undefined): boolean {
  return hasText(reportData?.sections?.s4_outfits) && (
    !reportData?.qa?.section4 ||
    section4HasBlockingQa(reportData.qa)
  );
}

export function getCompletedManReportTextSections(reportData: ReportData | null | undefined): SectionField[] {
  return SECTION_FIELDS.filter(field => hasText(reportData?.sections?.[field]));
}

export function getNextManReportTextProgressStage(reportData: ReportData | null | undefined): string | null {
  if (!reportData?.classification) return 'classifying';
  if (!hasText(reportData.sections?.s0_snapshot)) return 'generating_s0';
  if (!hasText(reportData.sections?.s1_face)) return 'generating_s1';
  if (!hasText(reportData.sections?.s2_body)) return 'generating_s2';
  if (!hasText(reportData.sections?.s3_colour)) return 'generating_s3';
  if (!hasText(reportData.sections?.s4_outfits) || section4NeedsQa(reportData)) return 'generating_s4';
  if (!hasText(reportData.sections?.s4_combo_grids)) return 'generating_s4_combo_grids';
  if (!hasText(reportData.sections?.s5_shopping) && !hasText(reportData.sections?.s5_rules)) return 'generating_s5_shopping';
  if (!hasText(reportData.sections?.s5_grooming_skin)) return 'generating_s5_grooming_skin';
  if (!hasText(reportData.sections?.s6_identity)) return 'generating_s6';
  return null;
}

async function updateStage(reportId: string, stage: string, shareToken: string | null) {
  await supabaseAdmin
    .from('man_reports')
    .update({
      status: 'generating',
      progress_stage: stage,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  await revalidateManReportCache(reportId, shareToken);
}

async function writePartialData(
  reportId: string,
  shareToken: string | null,
  classification: ClassificationResult,
  sections: PartialSections,
  nextStage: string,
  qa?: ReportData['qa'],
) {
  await supabaseAdmin
    .from('man_reports')
    .update({
      status: 'generating',
      report_data: {
        classification,
        sections: { ...sections },
        generated_at: new Date().toISOString(),
        ...(qa ? { qa } : {}),
      },
      progress_stage: nextStage,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  await revalidateManReportCache(reportId, shareToken);
}

export async function runManReportTextPipeline(
  reportId: string,
  submission: ManIntakeSubmission,
  shareToken: string | null,
  existingReportData?: ReportData | null,
) {
  let currentStage = getNextManReportTextProgressStage(existingReportData) ?? 'finalising';
  const state = normaliseReportData(existingReportData);
  let classification = state.classification;
  const sections = state.sections;
  let qa = state.qa;

  try {
    if (!classification) {
      currentStage = 'classifying';
      await updateStage(reportId, currentStage, shareToken);
      const groomingProfile = await runGroomingImageClassification(submission);
      classification = await runClassification(submission, groomingProfile);
      await writePartialData(reportId, shareToken, classification, sections, 'generating_s0', qa);
    }

    if (!hasText(sections.s0_snapshot)) {
      currentStage = 'generating_s0';
      await updateStage(reportId, currentStage, shareToken);
      sections.s0_snapshot = await runSection0(classification, submission);
      await writePartialData(reportId, shareToken, classification, sections, 'generating_s1', qa);
    }

    if (!hasText(sections.s1_face)) {
      currentStage = 'generating_s1';
      await updateStage(reportId, currentStage, shareToken);
      sections.s1_face = await runSection1(classification, submission);
      await writePartialData(reportId, shareToken, classification, sections, 'generating_s2', qa);
    }

    if (!hasText(sections.s2_body)) {
      currentStage = 'generating_s2';
      await updateStage(reportId, currentStage, shareToken);
      sections.s2_body = await runSection2(classification, submission);
      await writePartialData(reportId, shareToken, classification, sections, 'generating_s3', qa);
    }

    if (!hasText(sections.s3_colour)) {
      currentStage = 'generating_s3';
      await updateStage(reportId, currentStage, shareToken);
      sections.s3_colour = await runSection3(classification, submission);
      await writePartialData(reportId, shareToken, classification, sections, 'generating_s4', qa);
    }

    if (!hasText(sections.s4_outfits) || section4NeedsQa({ classification, sections: sections as ReportSections, generated_at: new Date().toISOString(), qa })) {
      currentStage = 'generating_s4';
      await updateStage(reportId, currentStage, shareToken);
      if (!hasText(sections.s4_outfits)) {
        sections.s4_outfits = await runSection4(classification, submission);
      }
      const section4Repair = await repairSection4OutfitsUntilQaPass(classification, sections.s4_outfits);
      sections.s4_outfits = section4Repair.section4;
      qa = { ...(qa ?? {}), section4: section4Repair.qa };
      await writePartialData(reportId, shareToken, classification, sections, 'generating_s4_combo_grids', qa);
    }

    if (!hasText(sections.s4_combo_grids)) {
      currentStage = 'generating_s4_combo_grids';
      await updateStage(reportId, currentStage, shareToken);
      sections.s4_combo_grids = await runSection5(classification, submission);
      await writePartialData(reportId, shareToken, classification, sections, 'generating_s5_shopping', qa);
    }

    if (!hasText(sections.s5_shopping) && !hasText(sections.s5_rules)) {
      currentStage = 'generating_s5_shopping';
      await updateStage(reportId, currentStage, shareToken);
      sections.s5_shopping = await runSection6Shopping(classification, submission);
      await writePartialData(reportId, shareToken, classification, sections, 'generating_s5_grooming_skin', qa);
    }

    if (!hasText(sections.s5_grooming_skin)) {
      currentStage = 'generating_s5_grooming_skin';
      await updateStage(reportId, currentStage, shareToken);
      sections.s5_grooming_skin = await runSection7GroomingSkin(classification, submission);
      await writePartialData(reportId, shareToken, classification, sections, 'generating_s6', qa);
    }

    if (!hasText(sections.s6_identity)) {
      currentStage = 'generating_s6';
      await updateStage(reportId, currentStage, shareToken);
      sections.s6_identity = await runSection6(classification, submission);
    }

    const completeSections: ReportSections = {
      s0_snapshot: sections.s0_snapshot,
      s1_face: sections.s1_face!,
      s2_body: sections.s2_body!,
      s3_colour: sections.s3_colour!,
      s4_outfits: sections.s4_outfits!,
      s4_combo_grids: sections.s4_combo_grids,
      s5_rules: sections.s5_rules,
      s5_shopping: sections.s5_shopping ?? sections.s5_rules,
      s5_grooming_skin: sections.s5_grooming_skin,
      s6_identity: sections.s6_identity!,
    };

    await supabaseAdmin
      .from('man_reports')
      .update({
        status: 'draft_ready',
        progress_stage: null,
        error_message: null,
        report_data: {
          classification,
          sections: completeSections,
          generated_at: new Date().toISOString(),
          qa,
        } as ReportData,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    await revalidateManReportCache(reportId, shareToken);
    console.log(`[man-report] Text pipeline complete for reportId=${reportId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[man-report] Text pipeline failed for reportId=${reportId} stage=${currentStage}:`, message);

    await supabaseAdmin
      .from('man_reports')
      .update({
        status: 'error',
        progress_stage: null,
        error_message: `Text generation failed at ${currentStage}: ${message}`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId);

    await revalidateManReportCache(reportId, shareToken);
  }
}
