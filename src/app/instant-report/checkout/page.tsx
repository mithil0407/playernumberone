import type { Metadata } from 'next';
import InstantReportCheckout from './InstantReportCheckout';

export const metadata: Metadata = { title: 'Secure Checkout — ICONIK Instant Report', robots: { index: false, follow: false } };

export default async function InstantReportCheckoutPage({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan = '' } = await searchParams;
  return <InstantReportCheckout scanToken={scan} />;
}

