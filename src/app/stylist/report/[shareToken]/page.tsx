import { notFound } from 'next/navigation';
import StylistBlueprintReport from '@/components/StylistBlueprintReport';
import StylistBlueprintViewerChrome, { type BlueprintOutlineEntry } from '@/components/StylistBlueprintViewerChrome';
import StylistBlueprintPreviewBanner from '@/components/StylistBlueprintPreviewBanner';
import StyledJsxRegistry from '@/components/StyledJsxRegistry';
import StylistBlueprintReportIntro from '@/components/StylistBlueprintReportIntro';
import { getPublicStylistBlueprintByShareToken, getStylistBlueprintClientPreviewByShareToken } from '@/lib/stylistBlueprintLoader';
import { canAccessBlueprintReport } from '@/lib/stylistWorkspaceAuth';
import { isManualStylistBlueprintSubmission, isVersionedStylistBlueprintReportData } from '@/lib/stylistBlueprintGenerator';
import {
  getStylistBlueprintOutfitEndPage,
  getStylistBlueprintOutfitStartPage,
  getStylistBlueprintSectionLabel,
  getVisibleStylistBlueprintPages,
} from '@/lib/stylistBlueprintSchema';

const INK = '#2C2622';
const IVORY = '#F4EFE5';
const GOLD = '#C9A96E';

interface PageProps {
  params: Promise<{ shareToken: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
}

/**
 * `?preview=1` lets the report's own stylist (or an admin) see the client view
 * before it is published. Anyone else gets exactly the public behaviour, so a
 * forwarded preview link is no more revealing than the plain share link.
 */
async function loadReportForViewer(shareToken: string, wantsPreview: boolean) {
  if (wantsPreview) {
    const loaded = await getStylistBlueprintClientPreviewByShareToken(shareToken);
    if (loaded && await canAccessBlueprintReport(loaded.report.id)) return { report: loaded.report, preview: { live: loaded.live } };
  }
  const report = await getPublicStylistBlueprintByShareToken(shareToken);
  return report ? { report, preview: null } : null;
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
      <meta name="referrer" content="no-referrer" />
      <style>{`
        body { background: ${INK}; }
        @keyframes blueprint-pending-pulse {
          0%, 100% { opacity: 0.35; transform: scaleX(0.6); }
          50% { opacity: 1; transform: scaleX(1); }
        }
        .blueprint-pending-line {
          width: 64px;
          height: 2px;
          margin: 0 auto 28px;
          border-radius: 999px;
          background: ${GOLD};
          transform-origin: center;
          animation: blueprint-pending-pulse 2.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .blueprint-pending-line { animation: none; }
        }
      `}</style>
      <div
        className="min-h-screen min-h-dvh flex items-center justify-center px-6"
        style={{
          background: `radial-gradient(ellipse 120% 80% at 25% 10%, #A0B2B9 0%, #94A6AD 45%, #7E9098 100%)`,
          color: IVORY,
          fontFamily: 'var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div className="w-full max-w-xl text-center">
          <p style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 600, opacity: 0.7, marginBottom: 28 }}>ICONIK Blueprint</p>
          {!isError && <div className="blueprint-pending-line" aria-hidden="true" />}
          <h1 style={{ fontSize: 'clamp(30px, 6vw, 52px)', fontWeight: 550, letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 18px', textWrap: 'balance' }}>
            {isError ? 'This report is not ready yet' : 'Your report is being prepared'}
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.78, maxWidth: 420, margin: '0 auto' }}>
            {isError
              ? (errorMessage || 'The report link exists, but generation did not finish successfully. Please check back after the report is regenerated.')
              : `${formatStage(progressStage)}. This page refreshes automatically.`}
          </p>
        </div>
      </div>
    </>
  );
}

export default async function StylistPublicReportPage({ params, searchParams }: PageProps) {
  const [{ shareToken }, { preview: previewParam }] = await Promise.all([params, searchParams]);
  const loaded = await loadReportForViewer(shareToken, previewParam === '1');

  if (!loaded) notFound();
  const { report, preview } = loaded;
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
  const reportData = report.report_data;
  const versioned = isVersionedStylistBlueprintReportData(reportData) ? reportData : null;
  const outfitStart = getStylistBlueprintOutfitStartPage(versioned);
  const outfitEnd = getStylistBlueprintOutfitEndPage(versioned);
  const outline: BlueprintOutlineEntry[] = versioned
    ? getVisibleStylistBlueprintPages(versioned, { hideContinuationPage }).map((page, index) => ({
      pageNumber: page.page_number,
      display: index + 1,
      title: page.page_number === 1 ? 'Cover' : page.title,
      section: getStylistBlueprintSectionLabel(page.page_number, versioned),
      outfitNumber: page.page_number >= outfitStart && page.page_number <= outfitEnd
        ? page.page_number - outfitStart + 1
        : undefined,
    }))
    : [];
  const clientName = versioned?.client.display_name ?? '';

  return (
    <>
      <meta name="referrer" content="no-referrer" />
      <style>{`
        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
        body { overscroll-behavior-y: none; background: #2C2622; }
        * { -webkit-tap-highlight-color: transparent; }
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
        }
        .blueprint-footer {
          background: ${INK};
          color: ${IVORY};
          font-family: var(--font-manrope), Manrope, ui-sans-serif, system-ui, sans-serif;
        }
        .blueprint-footer-mark {
          font-size: 13px;
          letter-spacing: 0.42em;
          opacity: 0.6;
        }
        .blueprint-footer-note {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-weight: 600;
          opacity: 0.35;
          margin-top: 12px;
        }
        .blueprint-footer-shop {
          font-size: 13px;
          line-height: 1.6;
          opacity: 0.55;
          max-width: 46ch;
          margin: 26px auto 0;
        }
        /* Room for the floating contents pill so it never covers the last line. */
        .blueprint-footer { padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
      `}</style>
      <StyledJsxRegistry>
      <div
        className="iconik-theme min-h-screen min-h-dvh"
        style={{ background: '#2C2622', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <StylistBlueprintReport
          data={report.report_data}
          imageUrls={report.image_urls}
          deferPages
          hideContinuationPage={hideContinuationPage}
        />
        <div className="blueprint-footer px-5 md:px-12 pt-12 text-center">
          <p className="blueprint-footer-mark">I C O N I K</p>
          <p className="blueprint-footer-note">Prepared privately for you · For your eyes only</p>
          <p className="blueprint-footer-shop">
            Every outfit page links each piece to a live shopping search in your colour.
            Use the Contents button below to jump between sections, or save the report as a PDF.
          </p>
        </div>
      </div>
      {outline.length > 0 && <StylistBlueprintViewerChrome outline={outline} clientName={clientName} />}
      {preview && <StylistBlueprintPreviewBanner live={preview.live} />}
      <StylistBlueprintReportIntro clientName={clientName} />
      </StyledJsxRegistry>
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { shareToken } = await params;
  const report = await getPublicStylistBlueprintByShareToken(shareToken);
  if (!report) return { robots: { index: false, follow: false }, referrer: 'no-referrer' as const };
  if (!report.report_data) {
    return {
      title: 'Your ICONIK Blueprint is being prepared',
      description: 'Your personalised ICONIK women Style Blueprint is being prepared.',
      robots: { index: false, follow: false },
      referrer: 'no-referrer',
    };
  }

  const titleSuffix = isVersionedStylistBlueprintReportData(report.report_data)
    ? report.report_data.analysis.style_direction
    : report.report_data.classification.taste.style_archetype;
  return {
    title: `Your ICONIK Blueprint — ${titleSuffix}`,
    description: `Your personalised ICONIK women Style Blueprint.`,
    robots: { index: false, follow: false },
    referrer: 'no-referrer',
  };
}
