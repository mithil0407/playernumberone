import type { Metadata } from "next";
import LandingPageContent from './LandingPageContent';
import { buildMetadata } from '@/lib/seo';
import { INDIA_ROOT_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';

export const metadata: Metadata = buildMetadata({
  title: "Scientific Personal Styling for Indian Women",
  description:
    "Iconik's Style Blueprint for Indian women: body analysis, colour mapping, and outfit formulas delivered online.",
  path: "/",
  locale: "en_IN",
  keywords: [
    "personal stylist India",
    "online personal styling India",
    "body type styling India",
    "colour analysis Indian skin tone",
    "style blueprint India",
  ],
});

export default async function Home({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan = '' } = await searchParams;

  return (
    <LandingPageContent
      variant="offer2699"
      trackingEntry="root"
      headline={
        <>
          <span className="block sm:whitespace-nowrap">
            <span className="text-luxury-accent">Stop Guessing</span> What Suits You.
          </span>
          <span className="mt-1 block sm:mt-2 sm:whitespace-nowrap">
            <span className="text-luxury-accent">Talk to a Stylist</span> Who&apos;ll Tell You.
          </span>
        </>
      }
      subheadline={
        <>
          30 minutes with your ICONIK stylist, then a personal Style Blueprint — <span className="font-semibold text-luxury-accent">20 complete outfits</span>, your <span className="font-semibold text-luxury-green">colour palette</span>, and exactly what to avoid. Built for your body, not a body type.
        </>
      }
      checkoutHref={scan ? `/checkout?scan=${encodeURIComponent(scan)}` : '/checkout'}
      basePrice={INDIA_ROOT_BLUEPRINT_PRICE}
    />
  );
}
