import IndiaBlueprintCheckout from '@/components/IndiaBlueprintCheckout';
import { INDIA_OFFER_2699_BLUEPRINT_PRICE } from '@/lib/indiaBlueprintPricing';
import { OFFER_TOPICS, parseOfferTopicKey } from '@/lib/offerTopics';
import type { RootDesignVariant } from '@/lib/rootDesign';

export default async function Offer2699CheckoutPage({ searchParams }: { searchParams: Promise<{ scan?: string; topic?: string }> }) {
  const { scan = '', topic: topicParam } = await searchParams;
  const topic = OFFER_TOPICS[parseOfferTopicKey(topicParam) ?? 'general'];
  const designVariant: RootDesignVariant = 'precision';

  return (
    <IndiaBlueprintCheckout
      basePrice={INDIA_OFFER_2699_BLUEPRINT_PRICE}
      funnelEntry="offer2699"
      checkoutSource="offer_2699_checkout"
      backHref={topic.path}
      scanToken={scan}
      designVariant={designVariant}
      topicNote={topic.checkoutNote}
    />
  );
}
