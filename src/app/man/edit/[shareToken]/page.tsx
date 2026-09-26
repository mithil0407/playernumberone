import { notFound } from 'next/navigation';
import ManEditIssue from '@/components/ManEditIssue';
import { loadManEditIssueByShareToken } from '@/lib/manEditIssueLoader';

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

// Signed image URLs expire, so every view resolves them fresh.
export const dynamic = 'force-dynamic';

export default async function ManEditIssuePage({ params }: PageProps) {
  const { shareToken } = await params;
  const issue = await loadManEditIssueByShareToken(shareToken);
  if (!issue) notFound();

  return (
    <ManEditIssue
      shareToken={issue.shareToken}
      status={issue.status}
      edit={issue.edit}
      s4Outfits={issue.s4Outfits}
      classification={issue.classification}
      outfitImages={issue.outfitImages}
      shopping={issue.shopping}
      initialVotes={issue.votes}
      otherIssues={issue.otherIssues}
    />
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { shareToken } = await params;
  const issue = await loadManEditIssueByShareToken(shareToken);
  if (!issue) return {};
  return {
    title: `The Iconik Edit — Issue ${String(issue.edit.issueNumber).padStart(2, '0')} · ${issue.edit.periodLabel}`,
    description: issue.edit.dek || issue.edit.title,
    robots: { index: false, follow: false },
  };
}

export function generateViewport() {
  return { width: 'device-width', initialScale: 1, viewportFit: 'cover' as const, themeColor: '#16120F' };
}
