'use client';

import LandingPageContent from '../LandingPageContent';

export default function ArmsPage() {
  return (
    <LandingPageContent
      headlineClassName="text-3xl md:text-5xl lg:text-6xl luxury-heading text-luxury-charcoal mb-4 md:mb-6 leading-tight tracking-tight"
      headline={
        <>
          Finally Understand Why Your <span className="text-luxury-accent">Arms Look Heavy</span> — And Exactly <span className="text-luxury-accent">How To Fix It</span>
        </>
      }
      subheadline={
        <>
          Get <span className="font-semibold text-luxury-accent">16 outfits</span> built around your <span className="font-semibold text-luxury-green">arm structure</span>, your <span className="font-semibold text-luxury-accent">sleeve geometry</span>, and your <span className="font-semibold text-luxury-green">colour palette</span>. Delivered in 24 hours.
        </>
      }
    />
  );
}
