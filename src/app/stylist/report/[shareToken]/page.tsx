import { notFound } from 'next/navigation';
import StylistBlueprintReport from '@/components/StylistBlueprintReport';
import { getPublicStylistBlueprintByShareToken } from '@/lib/stylistBlueprintLoader';
import { isManualStylistBlueprintSubmission, isVersionedStylistBlueprintReportData } from '@/lib/stylistBlueprintGenerator';

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

function formatStage(stage: string | null) {
  if (!stage) return 'Preparing your report';
  return stage.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function PublicReportPendingPage({
  status,
  progressStage,
  errorMessage,
}: {
  status: string;
  progressStage: string | null;
  errorMessage: string | null;
}) {
  const isError = status === 'error';

  return (
    <>
      <meta httpEquiv="refresh" content="20" />
      <div
        className="iconik-theme min-h-screen min-h-dvh flex items-center justify-center px-6"
        style={{ background: 'var(--luxury-warm-white)', color: 'var(--luxury-charcoal)' }}
      >
        <div className="w-full max-w-xl text-center">
          <p className="iconik-micro mb-4" style={{ color: 'var(--luxury-gold)' }}>ICONIK Blueprint</p>
          <h1 className="luxury-heading text-3xl md:text-5xl mb-5">
            {isError ? 'This report is not ready yet' : 'Your report is being prepared'}
          </h1>
          <p className="luxury-body text-sm md:text-base" style={{ color: 'rgba(20, 20, 20, 0.62)' }}>
            {isError
              ? (errorMessage || 'The report link exists, but generation did not finish successfully. Please check back after the report is regenerated.')
              : `${formatStage(progressStage)}. This page refreshes automatically.`}
          </p>
        </div>
      </div>
    </>
  );
}

export default async function StylistPublicReportPage({ params }: PageProps) {
  const { shareToken } = await params;
  const report = await getPublicStylistBlueprintByShareToken(shareToken);

  if (!report) notFound();
  if (!report.report_data) {
    return (
      <PublicReportPendingPage
        status={report.status}
        progressStage={report.progress_stage}
        errorMessage={report.error_message}
      />
    );
  }

  const hideContinuationPage = isManualStylistBlueprintSubmission(report.stylist_intake_responses);

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
        body { overscroll-behavior-y: none; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
      <div
        className="iconik-theme min-h-screen min-h-dvh"
        style={{ background: 'var(--luxury-warm-white)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <StylistBlueprintReport
          data={report.report_data}
          imageUrls={report.image_urls}
          deferPages
          hideContinuationPage={hideContinuationPage}
        />
        <div className="px-5 md:px-12 py-6 text-center" style={{ background: 'var(--luxury-warm-white)' }}>
          <p className="iconik-micro" style={{ color: 'var(--luxury-charcoal)', opacity: 0.35 }}>For your eyes only</p>
        </div>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { shareToken } = await params;
  const report = await getPublicStylistBlueprintByShareToken(shareToken);
  if (!report) return {};
  if (!report.report_data) {
    return {
      title: 'Your ICONIK Blueprint is being prepared',
      description: 'Your personalised ICONIK women Style Blueprint is being prepared.',
      robots: { index: false, follow: false },
    };
  }

  const titleSuffix = isVersionedStylistBlueprintReportData(report.report_data)
    ? report.report_data.analysis.style_direction
    : report.report_data.classification.taste.style_archetype;
  return {
    title: `Your ICONIK Blueprint — ${titleSuffix}`,
    description: `Your personalised ICONIK women Style Blueprint.`,
    robots: { index: false, follow: false },
  };
}
