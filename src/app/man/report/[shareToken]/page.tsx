import { notFound } from 'next/navigation';
import PublicManReportExperience from '@/components/PublicManReportExperience';
import { getPublicManReportByShareToken, type PublicLoadedManReport } from '@/lib/manReportLoader';

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
          data={result.report_data}
          imageUrls={result.image_urls}
          shopping={result.shopping_data}
          forceDeck={query.view === 'deck'}
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
    viewport:    'width=device-width, initial-scale=1, viewport-fit=cover',
  };
}
