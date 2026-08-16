export const INDIA_ROOT_BLUEPRINT_PRICE = 2499;
export const INDIA_OFFER_2699_BLUEPRINT_PRICE = 2699;

export const INDIA_BLUEPRINT_ADDON_PRICES = {
  outfitPreview: 999,
  wardrobeDetox: 1499,
  smartShopper: 499,
} as const;

export type IndiaBlueprintCheckoutSource = 'root_checkout' | 'offer_2699_checkout';

export interface IndiaBlueprintSelectedAddons {
  outfitPreview?: boolean;
  wardrobeDetox?: boolean;
  smartShopper?: boolean;
}

export function indiaBlueprintBasePriceForCheckout(source: IndiaBlueprintCheckoutSource) {
  return source === 'root_checkout'
    ? INDIA_ROOT_BLUEPRINT_PRICE
    : INDIA_OFFER_2699_BLUEPRINT_PRICE;
}

export function calculateIndiaBlueprintTotal(
  basePrice: number,
  addons: IndiaBlueprintSelectedAddons = {},
) {
  return basePrice
    + (addons.outfitPreview ? INDIA_BLUEPRINT_ADDON_PRICES.outfitPreview : 0)
    + (addons.wardrobeDetox ? INDIA_BLUEPRINT_ADDON_PRICES.wardrobeDetox : 0)
    + (addons.smartShopper ? INDIA_BLUEPRINT_ADDON_PRICES.smartShopper : 0);
}
