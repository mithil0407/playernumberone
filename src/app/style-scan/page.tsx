import type { Metadata } from 'next';
import { Suspense } from 'react';
import StyleScanClient from './StyleScanClient';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Free Colour Analysis for Indian Skin · ICONIK',
  description: 'One selfie and eight quick taps. See your undertone, the shades that make you glow, and the colours quietly making you look tired, tried on your own photo.',
  path: '/style-scan',
  locale: 'en_IN',
});

export default async function StyleScanPage({ searchParams }: { searchParams: Promise<{ resume?: string }> }) {
  const params = await searchParams;
  return <Suspense><StyleScanClient resumeToken={params.resume || ''} /></Suspense>;
}
