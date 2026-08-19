import type { Metadata } from 'next';
import InstantReportPublicClient from './InstantReportPublicClient';

export const metadata: Metadata = { title: 'Your ICONIK Instant Report', robots: { index: false, follow: false, noarchive: true, noimageindex: true }, referrer: 'no-referrer' };
export default async function InstantReportPage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; return <InstantReportPublicClient token={token} />; }

