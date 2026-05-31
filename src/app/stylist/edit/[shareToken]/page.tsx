import { notFound } from 'next/navigation';
import StyleEditIssuePage from '@/components/StyleEditIssuePage';
import { loadPublicStyleEditIssue } from '@/lib/styleEditLoader';

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

export default async function PublicStyleEditIssuePage({ params }: PageProps) {
  const { shareToken } = await params;
  const issue = await loadPublicStyleEditIssue(shareToken);
  if (!issue?.page_data) notFound();

  return (
    <div className="min-h-screen" style={{ background: '#FBF8F4' }}>
      <StyleEditIssuePage data={issue.page_data} imageUrls={issue.image_urls} />
      <div className="px-5 md:px-12 py-6 text-center" style={{ background: '#FBF8F4' }}>
        <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: '#5A524A' }}>Private weekly edit</p>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { shareToken } = await params;
  const issue = await loadPublicStyleEditIssue(shareToken);
  if (!issue?.page_data) return {};
  return {
    title: `${issue.page_data.issueTitle} — THE ICONIK EDIT`,
    description: issue.page_data.subtitle,
    robots: { index: false, follow: false },
  };
}
