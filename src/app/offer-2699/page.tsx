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
            <span className="text-luxury-accent root-serif-moment">Talk to a Stylist</span><span className="root-headline-tail">Who&apos;ll Tell You.</span>
          </span>
        </>
      }
      subheadline={
        <>
          Talk to a real stylist for 30 minutes. Then get <span className="font-semibold text-luxury-accent">20 outfits</span> made for your body, plus the <span className="font-semibold text-luxury-green">colours</span> that suit your skin.
        </>
      }
      checkoutHref={offerCheckoutHref('general', scan)}
      basePrice={INDIA_OFFER_2699_BLUEPRINT_PRICE}
    />
  );
}
