import type { Metadata } from 'next';
import { Suspense } from 'react';
import StyleScanClient from './StyleScanClient';

export const metadata: Metadata = {
  title: 'The ICONIK Style Scan — Find Your Style Blocker',
  description: 'Upload two private photos and answer five quick questions. Find the main reason your outfits do not feel right.',
  openGraph: {
    title: 'The ICONIK Style Scan',
    description: 'Two photos. Five questions. Find the main reason your outfits feel wrong.',
    type: 'website',
  },
};

export default async function StyleScanPage({ searchParams }: { searchParams: Promise<{ resume?: string }> }) {
  const params = await searchParams;
  return <Suspense><StyleScanClient resumeToken={params.resume || ''} /></Suspense>;
}
