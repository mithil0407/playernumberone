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
    <div className="iconik-theme min-h-screen" style={{ background: 'var(--luxury-warm-white)' }}>
      <StyleEditIssuePage data={issue.page_data} imageUrls={issue.image_urls} />
      <div className="px-5 md:px-12 py-6 text-center" style={{ background: 'var(--luxury-warm-white)' }}>
        <p className="iconik-micro" style={{ color: 'var(--luxury-charcoal)', opacity: 0.35 }}>Private weekly edit</p>
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
