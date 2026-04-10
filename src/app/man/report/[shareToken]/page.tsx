import { notFound } from 'next/navigation';
import ManReport from '@/components/ManReport';
import type { ReportData } from '@/lib/manReportGenerator';

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

async function getReport(shareToken: string): Promise<ReportData | null> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${baseUrl}/api/man-report/public/${shareToken}`, {
      next: { revalidate: 60 },  // cache for 60s — report content doesn't change after publish
    });
    if (!res.ok) return null;
    const { report } = await res.json();
    return report?.report_data ?? null;
  } catch {
    return null;
  }
}

export default async function PublicReportPage({ params }: PageProps) {
  const { shareToken } = await params;
  const data = await getReport(shareToken);

  if (!data) notFound();

  return (
    <div className="min-h-screen" style={{ background: '#faf9f6' }}>
      <ManReport data={data} />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { shareToken } = await params;
  const data = await getReport(shareToken);
  if (!data) return {};
  const { classification: cls } = data;
  return {
    title:       `Your ICONIK Blueprint — ${cls.body.silhouette_type} · ${cls.colour.season}`,
    description: `Your personalised ICONIK Men's Style Blueprint. ${cls.style_brief.key_aspiration}`,
  };
}
