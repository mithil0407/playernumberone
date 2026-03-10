'use client';

import LandingPageContent from '../LandingPageContent';

export default function TummyPage() {
  return (
    <LandingPageContent
      headlineClassName="text-3xl md:text-5xl lg:text-6xl luxury-heading text-luxury-charcoal mb-4 md:mb-6 leading-tight tracking-tight"
      headline={
        <>
          Stop Hiding Your <span className="text-luxury-accent">Tummy</span>. Start Dressing Around It — <span className="text-luxury-accent">Scientifically</span>.
        </>
      }
      subheadline={
        <>
          Get <span className="font-semibold text-luxury-accent">16 outfits</span> built around your <span className="font-semibold text-luxury-green">midsection geometry</span>, your <span className="font-semibold text-luxury-accent">body frame</span>, and your <span className="font-semibold text-luxury-green">colour palette</span>. Delivered in 24 hours.
        </>
      }
    />
  );
}
