import LandingPageContent from '../LandingPageContent';
import { INDIA_OFFER_2699_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';

export default async function Offer2699Page({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan = '' } = await searchParams;
  return (
    <LandingPageContent
      variant="offer2699"
      headline={
        <>
          <span className="block whitespace-nowrap">
            <span className="text-luxury-accent">Stop Guessing</span> What Suits You.
          </span>
          <span className="mt-2 block whitespace-nowrap">
            <span className="text-luxury-accent">Talk to a Stylist</span> Who&apos;ll Tell You.
          </span>
        </>
      }
      subheadline={
        <>
          30 minutes with your ICONIK stylist, then a personal Style Blueprint — <span className="font-semibold text-luxury-accent">20 complete outfits</span>, your <span className="font-semibold text-luxury-green">colour palette</span>, and exactly what to avoid. Built for your body, not a body type.
        </>
      }
      checkoutHref={scan ? `/offer-2699/checkout?scan=${encodeURIComponent(scan)}` : '/offer-2699/checkout'}
      basePrice={INDIA_OFFER_2699_BLUEPRINT_PRICE}
    />
  );
}
