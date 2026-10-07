import type { Metadata } from "next";
import LandingPageContent from './LandingPageContent';
import { buildMetadata } from '@/lib/seo';
import { INDIA_ROOT_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';
import type { RootDesignVariant } from '@/lib/rootDesign';

export const metadata: Metadata = buildMetadata({
  title: "Scientific Personal Styling for Indian Women",
  description:
    "Talk to an ICONIK stylist for 30 minutes, then get your Style Blueprint: 20 outfits, your colour palette and what to avoid. ₹2,699, delivered online.",
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

// Static on purpose: reading the query string on the server made the homepage
// dynamic, which streamed its title and canonical into <body> for crawlers and
// bypassed the edge cache. The style-scan token is forwarded to checkout in the browser.
export default function Home() {
  const designVariant: RootDesignVariant = 'precision';

  return (
    <LandingPageContent
      variant="offer2699"
      trackingEntry="root"
      designVariant={designVariant}
      headline={
        <>
          <span className="block">
            <span className="text-luxury-accent">Stop Guessing</span> What Suits You.{' '}
          </span>
          <span className="mt-1 block sm:mt-2">
            <span className="text-luxury-accent root-serif-moment">Talk to a Stylist</span>{' '}<span className="root-headline-tail">Who&apos;ll Tell You.</span>
          </span>
        </>
      }
      subheadline={
        <>
          30 minutes with your ICONIK stylist, then a personal Style Blueprint — <span className="font-semibold text-luxury-accent">20 complete outfits</span>, your <span className="font-semibold text-luxury-green">colour palette</span>, and exactly what to avoid. Built for your body, not a body type.
        </>
      }
      checkoutHref="/checkout"
      forwardScanToCheckout
      basePrice={INDIA_ROOT_BLUEPRINT_PRICE}
    />
  );
}
