import LandingPageContent from '../../LandingPageContent';
import { buildMetadata } from '@/lib/seo';
import { INDIA_OFFER_2699_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';
import { offerCheckoutHref } from '@/lib/offerTopics';
import type { RootDesignVariant } from '@/lib/rootDesign';

export const metadata = buildMetadata({
  title: 'Stylish Outfits With Sleeves | ICONIK',
  description:
    'Keep your arms covered and still look stylish. A 30-minute call with an ICONIK stylist, then 20 outfits with sleeves you are comfortable in.',
  path: '/offer-2699/sleeves',
  locale: 'en_IN',
  noIndex: true,
});

export default async function Offer2699SleevesPage({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan = '' } = await searchParams;
  const designVariant: RootDesignVariant = 'precision';

  return (
    <LandingPageContent
      variant="offer2699"
      topic="sleeves"
      designVariant={designVariant}
      headline={
        <>
          <span className="block">
            Keep Your <span className="text-luxury-accent">Arms Covered.</span>
          </span>
          <span className="mt-1 block sm:mt-2">
            <span className="text-luxury-accent root-serif-moment">Still Look</span><span className="root-headline-tail">Stylish.</span>
          </span>
        </>
      }
      subheadline={
        <>
          Talk to a real stylist for 30 minutes. Then get <span className="font-semibold text-luxury-accent">20 outfits</span> with sleeves you are comfortable in — full, three-quarter or elbow length. <span className="font-semibold text-luxury-green">Nothing sleeveless.</span>
        </>
      }
      checkoutHref={offerCheckoutHref('sleeves', scan)}
      basePrice={INDIA_OFFER_2699_BLUEPRINT_PRICE}
    />
  );
}
