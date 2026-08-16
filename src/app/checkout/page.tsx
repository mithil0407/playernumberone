import IndiaBlueprintCheckout from '@/components/IndiaBlueprintCheckout';
import { INDIA_ROOT_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';

export default function CheckoutPage() {
  return (
    <IndiaBlueprintCheckout
      basePrice={INDIA_ROOT_BLUEPRINT_PRICE}
      funnelEntry="root"
      checkoutSource="root_checkout"
      backHref="/"
    />
  );
}
