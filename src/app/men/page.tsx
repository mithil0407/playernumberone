'use client';

import MenLandingPageContent from './MenLandingPageContent';

export default function MenHome() {
  return (
    <MenLandingPageContent
      headline={
        <>
          Build Your <span className="text-luxury-green">Signature Style</span> in <span className="text-luxury-charcoal">24 hours</span>
        </>
      }
      subheadline={
        <>
          Get <span className="font-semibold text-luxury-accent">16 personalised outfits</span>, your <span className="font-semibold text-luxury-green">colour palette</span>, and a <span className="font-semibold text-luxury-accent">1-on-1 stylist call</span> — built for how men actually dress
        </>
      }
    />
  );
}
