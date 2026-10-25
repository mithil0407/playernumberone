import { calculateIndiaBlueprintTotal, indiaBlueprintBasePriceForCheckout } from './indiaBlueprintPricing';
import { MAN_PRICING } from './manPricing';

type Checkout = Record<string, unknown>;
const selected = (value: unknown) => value === true;

export function priceForCheckout(body: Checkout): { amount: number; currency: string } | null {
  const addons = (body.add_ons && typeof body.add_ons === 'object' && !Array.isArray(body.add_ons))
    ? body.add_ons as Record<string, unknown> : {};
  if (body.checkout_source === 'root_checkout' || body.checkout_source === 'offer_2699_checkout') {
    if (body.base_product !== 'Iconik Style Consultation' || Object.keys(addons).some(key => selected(addons[key]) && !['outfit_preview', 'wardrobe_detox', 'smart_shoppers_guide'].includes(key))) return null;
    const source = body.checkout_source;
    return { amount: calculateIndiaBlueprintTotal(indiaBlueprintBasePriceForCheckout(source), {
      outfitPreview: selected(addons.outfit_preview), wardrobeDetox: selected(addons.wardrobe_detox),
      smartShopper: selected(addons.smart_shoppers_guide),
    }), currency: 'INR' };
  }
  if (body.checkout_source != null) return null;
  const allowed: Record<string, string[]> = {
    'Iconik Man Style Blueprint': ['outfit_preview', 'iconik_edit_subscription'],
    'Iconik Style Consultation': ['diva_diet_plan', 'smart_shoppers_guide'],
    'UAE Style Blueprint': ['outfit_preview'],
    'Style Refresh Club - 3 Months': [],
    'ICONIK Monthly Subscription': ['consultation'],
  };
  const product = typeof body.base_product === 'string' ? body.base_product : '';
  if (Object.keys(addons).some(key => selected(addons[key]) && !(allowed[product]?.includes(key)))) return null;
  switch (body.base_product) {
    case 'Iconik Man Style Blueprint': return { amount: MAN_PRICING.IN.basePrice + (selected(addons.outfit_preview) ? MAN_PRICING.IN.addonPrice : 0), currency: 'INR' };
    case 'Iconik Style Consultation': return { amount: 119 + (selected(addons.diva_diet_plan) ? 29 : 0) + (selected(addons.smart_shoppers_guide) ? 49 : 0), currency: 'USD' };
    case 'UAE Style Blueprint': return { amount: 179 + (selected(addons.outfit_preview) ? 99 : 0), currency: 'AED' };
    case 'Style Refresh Club - 3 Months': return { amount: 349, currency: 'AED' };
    case 'ICONIK Monthly Subscription': return { amount: body.plan_type === 'with-consultation' ? 2098 : body.plan_type === 'base' ? 99 : -1, currency: 'INR' };
    case 'ICONIK Style Starter': return { amount: 99, currency: 'USD' };
    case 'ICONIK Seasonal Transformation': return { amount: 237, currency: 'USD' };
    case 'ICONIK VIP Year-Round Style': return { amount: 354, currency: 'USD' };
    case 'ICONIK Essentials (India)': return { amount: body.billing_frequency === 'quarterly' ? 2697 : 999, currency: 'INR' };
    case 'ICONIK Signature (India)': return { amount: body.billing_frequency === 'quarterly' ? 4047 : 1499, currency: 'INR' };
    case 'ICONIK VIP (India)': return { amount: body.billing_frequency === 'quarterly' ? 6747 : 2499, currency: 'INR' };
    default: return null;
  }
}

export function priceForDedicatedCheckout(kind: 'stylist' | 'au' | 'globe' | 'global' | 'man-intl', addon: boolean): { amount: number; currency: string } {
  switch (kind) {
    case 'stylist': return { amount: addon ? 110 : 149, currency: 'USD' };
    case 'au': return { amount: 97 + (addon ? 47 : 0), currency: 'AUD' };
    case 'globe': return { amount: 97 + (addon ? 37 : 0), currency: 'USD' };
    case 'global': return { amount: 119 + (addon ? 49 : 0), currency: 'USD' };
    case 'man-intl': return { amount: MAN_PRICING.INTL.basePrice + (addon ? MAN_PRICING.INTL.addonPrice : 0), currency: 'USD' };
  }
}
