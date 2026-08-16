import IndiaBlueprintCheckout from '@/components/IndiaBlueprintCheckout';
import { INDIA_OFFER_2699_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';

export default function Offer2699CheckoutPage() {
  return (
    <IndiaBlueprintCheckout
      basePrice={INDIA_OFFER_2699_BLUEPRINT_PRICE}
      funnelEntry="offer2699"
      checkoutSource="offer_2699_checkout"
      backHref="/offer-2699"
    />
  );
}
