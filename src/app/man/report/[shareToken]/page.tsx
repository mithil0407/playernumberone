import { notFound } from 'next/navigation';
import PublicManReportExperience from '@/components/PublicManReportExperience';
import { getPublicManReportByShareToken, type PublicLoadedManReport } from '@/lib/manReportLoader';
import {
  applyManReportGoldCopy,
  MAN_REPORT_GOLD_COPY_SAMPLE_TOKEN,
} from '@/lib/manReportGoldCopy';
import { isManReportStylistReviewed } from '@/lib/manReportPresentation';

interface PageProps {
  params: Promise<{ shareToken: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type LoadedPublicReport = PublicLoadedManReport & {
  report_data: NonNullable<PublicLoadedManReport['report_data']>;
};

async function getReport(shareToken: string): Promise<LoadedPublicReport | null> {
  const report = await getPublicManReportByShareToken(shareToken);
  if (!report?.report_data) return null;
  return report as LoadedPublicReport;
}

export default async function PublicReportPage({ params, searchParams }: PageProps) {
  const { shareToken } = await params;
  const query = (await searchParams) ?? {};
  const result = await getReport(shareToken);

  if (!result) notFound();

  const useGoldCopy = process.env.NODE_ENV !== 'production'
    && shareToken === MAN_REPORT_GOLD_COPY_SAMPLE_TOKEN
    && query.copy === 'gold';
  const useCinematicPrototype = process.env.NODE_ENV !== 'production'
    && shareToken === MAN_REPORT_GOLD_COPY_SAMPLE_TOKEN
    && query.experience === 'cinematic';
  const forceMobileV2 = process.env.NODE_ENV !== 'production'
    && query.experience === 'v2';
  const reportData = useGoldCopy ? applyManReportGoldCopy(result.report_data) : result.report_data;
  const stylistReviewed = isManReportStylistReviewed(result.status, result.sent_at);

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
        style={{ background: '#FBF8F4' }}
      >
        <PublicManReportExperience
          shareToken={shareToken}
          data={reportData}
          imageUrls={result.image_urls}
          shopping={result.shopping_data}
          forceDeck={query.view === 'deck'}
          forceLegacyMobile={query.experience === 'legacy'}
          cinematic={useCinematicPrototype}
          mobileV2={forceMobileV2}
          stylistReviewed={stylistReviewed}
        />
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
  };
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover' as const,
  };
}
