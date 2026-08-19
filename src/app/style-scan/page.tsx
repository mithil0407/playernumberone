import type { Metadata } from 'next';
import { Suspense } from 'react';
import StyleScanClient from './StyleScanClient';

export const metadata: Metadata = {
  title: 'The ICONIK Style Scan — Free Personal Style Analysis',
  description: 'Upload two photos and answer five questions to discover your body geometry, undertone, and the three wardrobe choices working against you.',
  openGraph: {
    title: 'The ICONIK Style Scan',
    description: 'Two photos. Five questions. Your personal style starting point—in minutes.',
    type: 'website',
  },
};

export default async function StyleScanPage({ searchParams }: { searchParams: Promise<{ resume?: string }> }) {
  const params = await searchParams;
  return <Suspense><StyleScanClient resumeToken={params.resume || ''} /></Suspense>;
}

