import { notFound } from 'next/navigation';
import GlobeReport from '@/components/GlobeReport';
import { getPublicGlobeReportByShareToken, type PublicLoadedGlobeReport } from '@/lib/globeReportLoader';

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

type LoadedPublicReport = PublicLoadedGlobeReport & {
  report_data: NonNullable<PublicLoadedGlobeReport['report_data']>;
};

async function getReport(shareToken: string): Promise<LoadedPublicReport | null> {
  const report = await getPublicGlobeReportByShareToken(shareToken);
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
        style={{ background: '#faf9f6', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <GlobeReport
          data={result.report_data}
          imageUrls={result.image_urls}
          viewerMode="public"
          motionMode="standard"
          deferSections
        />

        {/* Footer */}
        <div className="bg-white border-t px-5 md:px-10 py-8 text-center" style={{ borderColor: '#f0ede8' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-5 h-5 bg-black flex items-center justify-center">
              <span className="text-[8px] font-black" style={{ color: '#b58e4d' }}>I</span>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-black">
              Iconik <span style={{ color: '#b58e4d' }}>Blueprint</span>
            </span>
          </div>
          <p className="text-[9px] text-gray-300 uppercase tracking-widest">
            Personal · Confidential · For Your Eyes Only
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
    description: `Your personalised ICONIK Globe Style Blueprint. ${cls.style_brief.key_aspiration}`,
    robots:      { index: false, follow: false },
    viewport:    'width=device-width, initial-scale=1, viewport-fit=cover',
  };
}
