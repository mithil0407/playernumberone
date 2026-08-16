import type { Metadata } from "next";
import LandingPageContent from './LandingPageContent';
import { buildMetadata } from '@/lib/seo';
import { BLUEPRINT_OFFER } from '@/lib/siteFacts';
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

export default function Home() {
  return (
    <LandingPageContent
      checkoutHref="/checkout"
      basePrice={INDIA_ROOT_BLUEPRINT_PRICE}
      headline={
        <>
          Discover Your <span className="text-luxury-green">Signature Style</span>
        </>
      }
      subheadline={
        <>
          Get <span className="font-semibold text-luxury-accent">{BLUEPRINT_OFFER.outfitFormulas} personalised outfit formulas</span>, colour, hairstyle and eyewear guidance, and a <span className="font-semibold text-luxury-accent">{BLUEPRINT_OFFER.consultationMinutes}-minute stylist consultation</span>.
        </>
      }
    />
  );
}
