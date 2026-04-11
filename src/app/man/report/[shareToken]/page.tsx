import { notFound } from 'next/navigation';
import ManReport from '@/components/ManReport';
import type { ReportData } from '@/lib/manReportGenerator';
import type { ResolvedImageUrls } from '@/lib/manImageGenerator';

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

interface ReportResult {
  data:      ReportData;
  imageUrls: ResolvedImageUrls | null;
}

async function getReport(shareToken: string): Promise<ReportResult | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/man-report/public/${shareToken}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const { report } = await res.json();
    if (!report?.report_data) return null;
    return {
      data:      report.report_data,
      imageUrls: report.image_urls ?? null,
    };
  } catch {
    return null;
  }
}

export default async function PublicReportPage({ params }: PageProps) {
  const { shareToken } = await params;
  const result = await getReport(shareToken);

  if (!result) notFound();

  return (
    <div className="min-h-screen" style={{ background: '#faf9f6' }}>
      <ManReport data={result.data} imageUrls={result.imageUrls} />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { shareToken } = await params;
  const result = await getReport(shareToken);
  if (!result) return {};
  const { classification: cls } = result.data;
  return {
    title:       `Your ICONIK Blueprint — ${cls.body.silhouette_type} · ${cls.colour.season}`,
    description: `Your personalised ICONIK Men's Style Blueprint. ${cls.style_brief.key_aspiration}`,
  };
}
