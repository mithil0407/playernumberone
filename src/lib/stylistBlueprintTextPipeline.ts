import { supabaseAdmin } from './supabase';
import { revalidateStylistBlueprintCache } from './stylistBlueprintCache';
import {
  classifyStylistBlueprint,
  attachSilhouetteRuleOutfitExamples,
  createBlueprintShell,
  generateStylistBlueprintPages,
  getStylistOutfitCulturalMode,
  getStylistBlueprintAuditPage,
  getStylistBlueprintAvoidancePage,
  getStylistBlueprintBodyGeometryPage,
  getStylistBlueprintChromaticPage,
  getStylistBlueprintColourDrapePage,
  getStylistBlueprintContinuationPage,
  getStylistBlueprintEyeframePage,
  getStylistBlueprintFabricPage,
  getStylistBlueprintFaceArchitecturePage,
  getStylistBlueprintHairColourPage,
  getStylistBlueprintHairFaceAccessoriesPage,
  getStylistBlueprintHairstylePage,
  getStylistBlueprintMakeupPage,
  getStylistBlueprintMatrixPage,
  getStylistBlueprintOutfitSystemPage,
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintPageCount,
  getStylistBlueprintPalettePage,
  getStylistBlueprintProportionPage,
  getStylistBlueprintReadingGuidePage,
  getStylistBlueprintRulesStartPage,
  getStylistBlueprintSummaryPage,
  getStylistBlueprintTransformationPage,
  mergeBlueprintPages,
  validateStylistBlueprintReport,
  type StylistBlueprintReportData,
  type StylistIntakeSubmission,
} from './stylistBlueprintGenerator';

type StylistBlueprintAct = 'opening' | 'diagnosis' | 'prescription' | 'application' | 'closing';

const ACT_STAGES: Array<{
  stage: string;
  act: StylistBlueprintAct;
}> = [
  { stage: 'generating_opening_pages', act: 'opening' },
  { stage: 'generating_diagnosis_pages', act: 'diagnosis' },
  { stage: 'generating_prescription_pages', act: 'prescription' },
  { stage: 'generating_application_pages', act: 'application' },
  { stage: 'generating_closing_pages', act: 'closing' },
];

const REPAIR_ACT_STAGES: Array<{
  stage: string;
  act: StylistBlueprintAct;
}> = [
  { stage: 'repairing_opening_pages', act: 'opening' },
  { stage: 'repairing_diagnosis_pages', act: 'diagnosis' },
  { stage: 'repairing_prescription_pages', act: 'prescription' },
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

function expectedPagesForAct(reportData: StylistBlueprintReportData, act: StylistBlueprintAct): number[] {
  const transformationPage = getStylistBlueprintTransformationPage(reportData);
  const outfitPages = Array.from(
    { length: getStylistBlueprintOutfitEndPage(reportData) - getStylistBlueprintOutfitStartPage(reportData) + 1 },
    (_, index) => getStylistBlueprintOutfitStartPage(reportData) + index,
  );

  const pages: Record<StylistBlueprintAct, Array<number | null>> = {
    opening: [1, getStylistBlueprintSummaryPage(reportData), getStylistBlueprintReadingGuidePage(reportData)],
    diagnosis: [
      getStylistBlueprintBodyGeometryPage(reportData),
      getStylistBlueprintChromaticPage(reportData),
      getStylistBlueprintFaceArchitecturePage(reportData),
      getStylistBlueprintProportionPage(reportData),
      getStylistBlueprintAvoidancePage(reportData),
    ],
    prescription: [
      getStylistBlueprintPalettePage(reportData),
      getStylistBlueprintColourDrapePage(reportData),
      getStylistBlueprintRulesStartPage(reportData),
      getStylistBlueprintHairstylePage(reportData) ?? getStylistBlueprintHairFaceAccessoriesPage(reportData),
      getStylistBlueprintHairColourPage(reportData),
      getStylistBlueprintEyeframePage(reportData),
      getStylistBlueprintMakeupPage(reportData),
      getStylistBlueprintFabricPage(reportData),
    ],
    application: [
      transformationPage,
      getStylistBlueprintOutfitSystemPage(reportData),
      ...outfitPages,
    ],
    closing: [
      getStylistBlueprintMatrixPage(reportData),
      getStylistBlueprintAuditPage(reportData),
      getStylistBlueprintContinuationPage(reportData),
    ],
  };

  return pages[act].filter((pageNumber): pageNumber is number => typeof pageNumber === 'number');
}

function hasAllPages(reportData: StylistBlueprintReportData, pageNumbers: number[]) {
  const existing = new Set(reportData.pages.map(page => page.page_number));
  return pageNumbers.every(pageNumber => existing.has(pageNumber));
}

export function getCompletedStylistBlueprintTextActs(
  reportData: StylistBlueprintReportData | null | undefined,
): StylistBlueprintAct[] {
  if (!reportData) return [];
  return ACT_STAGES
    .filter(item => hasAllPages(reportData, expectedPagesForAct(reportData, item.act)))
    .map(item => item.act);
}

export function getNextStylistBlueprintTextProgressStage(
  reportData: StylistBlueprintReportData | null | undefined,
): string | null {
  if (!reportData?.classification) return 'classifying';
  const next = ACT_STAGES.find(item => !hasAllPages(reportData, expectedPagesForAct(reportData, item.act)));
  return next?.stage ?? null;
}

export async function runStylistBlueprintTextPipeline(
  reportId: string,
  submission: StylistIntakeSubmission,
  shareToken: string | null,
  existingReportData?: StylistBlueprintReportData | null,
): Promise<StylistBlueprintReportData | null> {
  let currentStage = getNextStylistBlueprintTextProgressStage(existingReportData) ?? 'finalising';
  try {
    await updateReport(reportId, { status: 'generating', progress_stage: currentStage, error_message: null }, shareToken);

    const classification = existingReportData?.classification ?? await classifyStylistBlueprint(submission);
    let reportData = existingReportData ?? createBlueprintShell(submission, classification);

    await updateReport(reportId, { report_data: reportData }, shareToken);

    for (const item of ACT_STAGES) {
      if (hasAllPages(reportData, expectedPagesForAct(reportData, item.act))) continue;
      currentStage = item.stage;
      await updateReport(reportId, { progress_stage: currentStage }, shareToken);

      const pages = await generateStylistBlueprintPages(submission, reportData, item.act);
      reportData = {
        ...reportData,
        generated_at: new Date().toISOString(),
        pages: mergeBlueprintPages(reportData.pages, pages),
      };
      if (item.act === 'application') {
        reportData = await attachSilhouetteRuleOutfitExamples(reportData, submission);
      }
      await updateReport(reportId, { report_data: reportData }, shareToken);
    }

    validateStylistBlueprintReport(reportData, { culturalMode: getStylistOutfitCulturalMode(submission) });

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
  const outfitStart = getStylistBlueprintOutfitStartPage(reportData);
  const outfitEnd = getStylistBlueprintOutfitEndPage(reportData);
  const affected = new Set<number>([
    ...Array.from({ length: Math.min(outfitStart - 1, getStylistBlueprintPageCount(reportData)) }, (_, index) => index + 1),
    ...Array.from(
      { length: outfitEnd - outfitStart + 1 },
      (_, index) => outfitStart + index,
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
      version: existingReportData.version,
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
      if (item.act === 'application') {
        reportData = await attachSilhouetteRuleOutfitExamples(reportData, submission);
      }
      await updateReport(reportId, { report_data: reportData }, shareToken);
    }

    validateStylistBlueprintReport(reportData, { culturalMode: getStylistOutfitCulturalMode(submission) });

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
