import LandingPageContent from '../../LandingPageContent';
import { buildMetadata } from '@/lib/seo';
import { INDIA_OFFER_2699_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';
import { offerCheckoutHref } from '@/lib/offerTopics';
import type { RootDesignVariant } from '@/lib/rootDesign';

export const metadata = buildMetadata({
  title: 'Modest Outfits That Look Stylish | ICONIK',
  description:
    'Dress modestly and look stylish every day. A 30-minute call with an ICONIK stylist, then 20 modest outfits made for your body and colours.',
  path: '/offer-2699/modest',
  locale: 'en_IN',
  noIndex: true,
});

export default async function Offer2699ModestPage({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan = '' } = await searchParams;
  const designVariant: RootDesignVariant = 'precision';

  return (
    <LandingPageContent
      variant="offer2699"
      topic="modest"
      designVariant={designVariant}
      headline={
        <>
          <span className="block">
            <span className="text-luxury-accent">Dress Modestly.</span>
          </span>
          <span className="mt-1 block sm:mt-2">
            <span className="text-luxury-accent root-serif-moment">Look Stylish</span><span className="root-headline-tail">Every Day.</span>
          </span>
        </>
      }
      subheadline={
        <>
          Talk to a real stylist for 30 minutes. Then get <span className="font-semibold text-luxury-accent">20 modest outfits</span> made for your body and your <span className="font-semibold text-luxury-green">colours</span> — covered, neat and never boring.
        </>
      }
      checkoutHref={offerCheckoutHref('modest', scan)}
      basePrice={INDIA_OFFER_2699_BLUEPRINT_PRICE}
    />
  );
}
