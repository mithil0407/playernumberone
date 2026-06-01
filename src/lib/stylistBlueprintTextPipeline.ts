import { supabaseAdmin } from './supabase';
import { revalidateStylistBlueprintCache } from './stylistBlueprintCache';
import {
  classifyStylistBlueprint,
  createBlueprintShell,
  generateStylistBlueprintPages,
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
      Array.from({ length: 28 }, (_, index) => [`p${index + 1}`, false]),
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
