import IndiaBlueprintCheckout from '@/components/IndiaBlueprintCheckout';
import { INDIA_ROOT_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';
import type { RootDesignVariant } from '@/lib/rootDesign';

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ scan?: string; restore?: string }> }) {
  const { scan = '', restore } = await searchParams;
  const designVariant: RootDesignVariant = 'precision';

  return (
    <IndiaBlueprintCheckout
      basePrice={INDIA_ROOT_BLUEPRINT_PRICE}
      funnelEntry="root"
      checkoutSource="root_checkout"
      backHref="/"
      scanToken={scan}
      designVariant={designVariant}
      restoreSavedCart={restore === '1'}
    />
  );
}
