import IndiaBlueprintCheckout from '@/components/IndiaBlueprintCheckout';
import { INDIA_OFFER_2699_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';

export default async function Offer2699CheckoutPage({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan = '' } = await searchParams;
  return (
    <IndiaBlueprintCheckout
      basePrice={INDIA_OFFER_2699_BLUEPRINT_PRICE}
      funnelEntry="offer2699"
      checkoutSource="offer_2699_checkout"
      backHref="/offer-2699"
      scanToken={scan}
    />
  );
}
