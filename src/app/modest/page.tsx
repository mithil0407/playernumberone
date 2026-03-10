'use client';

import LandingPageContent from '../LandingPageContent';

export default function ModestPage() {
  return (
    <LandingPageContent
      headlineClassName="text-3xl md:text-5xl lg:text-6xl luxury-heading text-luxury-charcoal mb-4 md:mb-6 leading-tight tracking-tight"
      headline={
        <>
          Full Coverage. <span className="text-luxury-accent">Zero Compromise</span> on <span className="text-luxury-accent">How You Look</span>.
        </>
      }
      subheadline={
        <>
          Get <span className="font-semibold text-luxury-accent">16 full-coverage outfits</span> built around your <span className="font-semibold text-luxury-green">frame</span>, your <span className="font-semibold text-luxury-accent">colour palette</span>, and your <span className="font-semibold text-luxury-green">lifestyle</span>. Delivered in 24 hours.
        </>
      }
    />
  );
}
