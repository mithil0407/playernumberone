import LandingPageContent from '../LandingPageContent';
import { INDIA_OFFER_2699_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';
import { offerCheckoutHref } from '@/lib/offerTopics';
import type { RootDesignVariant } from '@/lib/rootDesign';

export default async function Offer2699Page({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan = '' } = await searchParams;
  const designVariant: RootDesignVariant = 'precision';

  return (
    <LandingPageContent
      variant="offer2699"
      topic="general"
      designVariant={designVariant}
      headline={
        <>
          <span className="block">
            <span className="text-luxury-accent">Stop Guessing</span> What Suits You.
          </span>
          <span className="mt-1 block sm:mt-2">
            <span className="text-luxury-accent root-serif-moment">Ask a Real Stylist.</span>
          </span>
        </>
      }
      subheadline={
        <>
          One 30-minute call. Then <span className="font-semibold text-luxury-accent">20 outfits</span> made for your body, plus the <span className="font-semibold text-luxury-green">colours</span> that suit your skin.
        </>
      }
      checkoutHref={offerCheckoutHref('general', scan)}
      basePrice={INDIA_OFFER_2699_BLUEPRINT_PRICE}
    />
  );
}
