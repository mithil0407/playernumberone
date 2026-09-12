'use client';

import LandingPageContent from '../LandingPageContent';

export default function PlusSizePage() {
  return (
    <LandingPageContent
      headlineClassName="text-3xl md:text-5xl lg:text-6xl luxury-heading text-luxury-charcoal mb-4 md:mb-6 leading-tight tracking-tight"
      headline={
        <>
          Style Advice That Was <span className="text-luxury-accent">Actually Written</span> For <span className="text-luxury-accent">Your Body</span>.
        </>
      }
      subheadline={
        <>
          Get <span className="font-semibold text-luxury-accent">20 outfits</span> built around your <span className="font-semibold text-luxury-green">proportions</span>, your <span className="font-semibold text-luxury-accent">frame geometry</span>, and your <span className="font-semibold text-luxury-green">colour palette</span>. Delivered in 24 hours.
        </>
      }
    />
  );
}
