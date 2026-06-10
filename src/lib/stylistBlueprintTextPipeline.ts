import { supabaseAdmin } from './supabase';
import { revalidateStylistBlueprintCache } from './stylistBlueprintCache';
import {
  classifyStylistBlueprint,
  createBlueprintShell,
  generateStylistBlueprintPages,
  getStylistBlueprintAuditPage,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintMatrixPage,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintPageCount,
  mergeBlueprintPages,
  validateStylistBlueprintReport,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from './stylistBlueprintGenerator';

const ACT_STAGES: Array<{
  stage: string;
  act: 'opening' | 'diagnosis' | 'prescription' | 'application' | 'closing';
}> = [
  { stage: 'generating_opening_pages', act: 'opening' },
  { stage: 'generating_diagnosis_pages', act: 'diagnosis' },
  { stage: 'generating_prescription_pages', act: 'prescription' },
  { stage: 'generating_application_pages', act: 'application' },
  { stage: 'generating_closing_pages', act: 'closing' },
];

const REPAIR_ACT_STAGES: Array<{
  stage: string;
  act: 'opening' | 'diagnosis' | 'application' | 'closing';
}> = [
  { stage: 'repairing_opening_pages', act: 'opening' },
  { stage: 'repairing_diagnosis_pages', act: 'diagnosis' },
  { stage: 'repairing_application_pages', act: 'application' },
  { stage: 'repairing_closing_pages', act: 'closing' },
];

async function updateReport(reportId: string, patch: Record<string, unknown>, shareToken?: string | null) {
  await supabaseAdmin
    .from('stylist_blueprint_reports')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', reportId);
  await revalidateStylistBlueprintCache(reportId, shareToken);
}

export async function runStylistBlueprintTextPipeline(
  reportId: string,
  submission: StylistIntakeSubmission,
  shareToken: string | null,
  existingReportData?: StylistBlueprintReportData | null,
): Promise<StylistBlueprintReportData | null> {
  let currentStage = 'classifying';
  try {
    await updateReport(reportId, { status: 'generating', progress_stage: currentStage, error_message: null }, shareToken);

    const classification = existingReportData?.classification ?? await classifyStylistBlueprint(submission);
    let reportData = existingReportData ?? createBlueprintShell(submission, classification);

    await updateReport(reportId, { report_data: reportData }, shareToken);

    for (const item of ACT_STAGES) {
      currentStage = item.stage;
      await updateReport(reportId, { progress_stage: currentStage }, shareToken);

      const pages = await generateStylistBlueprintPages(submission, reportData, item.act);
      reportData = {
        ...reportData,
        generated_at: new Date().toISOString(),
        pages: mergeBlueprintPages(reportData.pages, pages),
      };
      await updateReport(reportId, { report_data: reportData }, shareToken);
    }

    validateStylistBlueprintReport(reportData);

    const approvals = Object.fromEntries(
      Array.from({ length: getStylistBlueprintPageCount(reportData) }, (_, index) => [`p${index + 1}`, false]),
    );

    const finalReportData = {
      ...reportData,
      generated_at: new Date().toISOString(),
    };

    await updateReport(reportId, {
      status: 'draft_ready',
      progress_stage: null,
      error_message: null,
      generated_at: new Date().toISOString(),
      section_approvals: approvals,
      report_data: finalReportData,
    }, shareToken);
    return finalReportData;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Blueprint generation failed';
    await updateReport(reportId, {
      status: 'error',
      progress_stage: null,
      error_message: `${currentStage}: ${message}`,
    }, shareToken);
    return null;
  }
}

function repairedApprovalMap(
  existingApprovals: Record<string, unknown> | null | undefined,
  reportData: StylistBlueprintReportData,
) {
  const affected = new Set<number>([
    1, 2, 3, 4, 5, 6, 7, 8,
    ...Array.from(
      { length: getStylistBlueprintOutfitEndPage(reportData) - 13 + 1 },
      (_, index) => 13 + index,
    ),
    getStylistBlueprintMatrixPage(reportData),
    getStylistBlueprintAuditPage(reportData),
    getStylistBlueprintContinuationPage(reportData),
  ]);
  const pageCount = getStylistBlueprintPageCount(reportData);
  return Object.fromEntries(
    Array.from({ length: pageCount }, (_, index) => {
      const pageNumber = index + 1;
      const key = `p${pageNumber}`;
      return [key, affected.has(pageNumber) ? false : Boolean(existingApprovals?.[key])];
    }),
  );
}

export async function runStylistBlueprintRepairPipeline(
  reportId: string,
  submission: StylistIntakeSubmission,
  shareToken: string | null,
  existingReportData: StylistBlueprintReportData,
  existingApprovals?: Record<string, unknown> | null,
): Promise<StylistBlueprintReportData | null> {
  let currentStage = 'repairing';
  try {
    await updateReport(reportId, { status: 'generating', progress_stage: currentStage, error_message: null }, shareToken);

    let reportData = createBlueprintShell(
      submission,
      existingReportData.classification,
      existingReportData.pages,
    );
    reportData = {
      ...reportData,
      generated_at: existingReportData.generated_at,
      client: existingReportData.client,
      analysis: existingReportData.analysis,
    };

    for (const item of REPAIR_ACT_STAGES) {
      currentStage = item.stage;
      await updateReport(reportId, { progress_stage: currentStage }, shareToken);

      const pages = await generateStylistBlueprintPages(submission, reportData, item.act);
      reportData = {
        ...reportData,
        generated_at: new Date().toISOString(),
        pages: mergeBlueprintPages(reportData.pages, pages),
      };
      await updateReport(reportId, { report_data: reportData }, shareToken);
    }

    validateStylistBlueprintReport(reportData);

    const finalReportData = {
      ...reportData,
      generated_at: new Date().toISOString(),
    };

    await updateReport(reportId, {
      status: 'draft_ready',
      progress_stage: null,
      error_message: null,
      generated_at: new Date().toISOString(),
      section_approvals: repairedApprovalMap(existingApprovals, finalReportData),
      report_data: finalReportData,
    }, shareToken);

    return finalReportData;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Blueprint repair failed';
    await updateReport(reportId, {
      status: 'error',
      progress_stage: null,
      error_message: `${currentStage}: ${message}`,
    }, shareToken);
    return null;
  }
}
