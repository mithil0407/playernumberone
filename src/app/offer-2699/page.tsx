import LandingPageContent from '../LandingPageContent';
import { INDIA_OFFER_2699_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';

export default function Offer2699Page() {
  return (
    <LandingPageContent
      variant="offer2699"
      headline={
        <>
          Stop Guessing What Suits You. Talk to a Stylist Who&apos;ll Tell You.
        </>
      }
      subheadline={
        <>
          30 minutes with your ICONIK stylist, then a personal Style Blueprint — <span className="font-semibold text-luxury-accent">20 complete outfits</span>, your <span className="font-semibold text-luxury-green">colour palette</span>, and exactly what to avoid. Built for your body, not a body type.
        </>
      }
      checkoutHref="/offer-2699/checkout"
      basePrice={INDIA_OFFER_2699_BLUEPRINT_PRICE}
    />
  );
}
