import type { Metadata } from 'next';
import { Suspense } from 'react';
import StyleScanClient from './StyleScanClient';

export const metadata: Metadata = {
  title: 'Free Colour Analysis for Indian Skin · ICONIK',
  description: 'One selfie and eight quick taps. See your undertone, the shades that make you glow, and the colours quietly making you look tired, tried on your own photo.',
  openGraph: {
    title: 'Free Colour Analysis for Indian Skin · ICONIK',
    description: 'One selfie, eight quick taps. Find the colours that make you glow.',
    type: 'website',
  },
};

export default async function StyleScanPage({ searchParams }: { searchParams: Promise<{ resume?: string }> }) {
  const params = await searchParams;
  return <Suspense><StyleScanClient resumeToken={params.resume || ''} /></Suspense>;
}
