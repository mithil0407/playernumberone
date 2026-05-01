import { notFound } from 'next/navigation';
import ManReport from '@/components/ManReport';
import { getPublicManReportByShareToken, type PublicLoadedManReport } from '@/lib/manReportLoader';

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

type LoadedPublicReport = PublicLoadedManReport & {
  report_data: NonNullable<PublicLoadedManReport['report_data']>;
};

async function getReport(shareToken: string): Promise<LoadedPublicReport | null> {
  const report = await getPublicManReportByShareToken(shareToken);
  if (!report?.report_data) return null;
  return report as LoadedPublicReport;
}

export default async function PublicReportPage({ params }: PageProps) {
  const { shareToken } = await params;
  const result = await getReport(shareToken);

  if (!result) notFound();

  return (
    <>
      {/* Mobile viewport & scroll optimisations */}
      <style>{`
        html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
        body { overscroll-behavior-y: none; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>

      <div
        className="min-h-screen min-h-dvh"
        style={{ background: '#FBF8F4', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ManReport
          data={result.report_data}
          imageUrls={result.image_urls}
          viewerMode="public"
          motionMode="standard"
          deferSections
        />

        {/* Confidentiality footnote — the rebuilt ManReport now renders its own
            branded footer, so this strip is just a quiet sign-off. */}
        <div className="px-5 md:px-12 py-6 text-center" style={{ background: '#FBF8F4' }}>
          <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: '#5A524A' }}>
            For your eyes only
          </p>
        </div>
      </div>
    </>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { shareToken } = await params;
  const result = await getReport(shareToken);
  if (!result) return {};
  const { classification: cls } = result.report_data;
  return {
    title:       `Your ICONIK Blueprint — ${cls.body.silhouette_type} · ${cls.colour.season}`,
    description: `Your personalised ICONIK Men's Style Blueprint. ${cls.style_brief.key_aspiration}`,
    robots:      { index: false, follow: false },
    viewport:    'width=device-width, initial-scale=1, viewport-fit=cover',
  };
}
