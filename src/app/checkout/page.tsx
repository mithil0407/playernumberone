import IndiaBlueprintCheckout from '@/components/IndiaBlueprintCheckout';
import { INDIA_ROOT_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ scan?: string }> }) {
  const { scan = '' } = await searchParams;

  return (
    <IndiaBlueprintCheckout
      basePrice={INDIA_ROOT_BLUEPRINT_PRICE}
      funnelEntry="root"
      checkoutSource="root_checkout"
      backHref="/"
      scanToken={scan}
    />
  );
}
