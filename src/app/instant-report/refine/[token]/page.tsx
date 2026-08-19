import type { Metadata } from 'next';
import InstantReportRefinement from './InstantReportRefinement';

export const metadata: Metadata = { title: 'Two-Minute Refinement — ICONIK', robots: { index: false, follow: false }, referrer: 'no-referrer' };

export default async function InstantReportRefinementPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <InstantReportRefinement token={token} />;
}

