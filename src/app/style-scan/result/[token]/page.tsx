import type { Metadata } from 'next';
import StyleScanResultClient from './StyleScanResultClient';

export const metadata: Metadata = {
  title: 'Your ICONIK Style Scan',
  robots: { index: false, follow: false, noarchive: true, noimageindex: true },
  referrer: 'no-referrer',
};

export default async function StyleScanResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <StyleScanResultClient token={token} />;
}

