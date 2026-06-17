import { notFound } from 'next/navigation';
import StylistBlueprintReport from '@/components/StylistBlueprintReport';
import { getPublicStylistBlueprintByShareToken } from '@/lib/stylistBlueprintLoader';
import { isManualStylistBlueprintSubmission, isVersionedStylistBlueprintReportData } from '@/lib/stylistBlueprintGenerator';

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

export default async function StylistPublicReportPage({ params }: PageProps) {
  const { shareToken } = await params;
  const report = await getPublicStylistBlueprintByShareToken(shareToken);

  if (!report?.report_data) notFound();
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
  if (!report?.report_data) return {};
  const titleSuffix = isVersionedStylistBlueprintReportData(report.report_data)
    ? report.report_data.analysis.style_direction
    : report.report_data.classification.taste.style_archetype;
  return {
    title: `Your ICONIK Blueprint — ${titleSuffix}`,
    description: `Your personalised ICONIK women Style Blueprint.`,
    robots: { index: false, follow: false },
  };
}
