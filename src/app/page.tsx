import type { Metadata } from "next";
import LandingPageContent from './LandingPageContent';
import { buildMetadata } from '@/lib/seo';

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
      headline={
        <>
          Discover Your <span className="text-luxury-green">Signature Style</span> in <span className="text-luxury-charcoal">24 hours</span>
        </>
      }
      subheadline={
        <>
          Get <span className="font-semibold text-luxury-accent">20 personalized outfits</span>, your <span className="font-semibold text-luxury-green">color palette</span>, and a <span className="font-semibold text-luxury-accent">1-on-1 stylist call</span>
        </>
      }
    />
  );
}
