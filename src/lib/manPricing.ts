// manPricing.ts — pricing constants for the /man funnel
// India (INR) vs international (USD) pricing

export const MAN_PRICING = {
  IN: {
    currency: 'INR',
    symbol: '₹',
    basePrice: 2699,
    originalPrice: 5999,
    addonPrice: 999,
    displayBase: '₹2,699',
    displayOriginal: '₹5,999',
    displayAddon: '₹999',
    savings: 5999 - 2699,
    displaySavings: '₹3,300',
  },
  INTL: {
    currency: 'USD',
    symbol: '$',
    basePrice: 97,
    originalPrice: 197,
    addonPrice: 37,
    displayBase: '$97',
    displayOriginal: '$197',
    displayAddon: '$37',
    savings: 197 - 97,
    displaySavings: '$100',
  },
} as const;

export type ManPricing = typeof MAN_PRICING.IN | typeof MAN_PRICING.INTL;

export function getManPricing(country: string): ManPricing {
  return country === 'IN' ? MAN_PRICING.IN : MAN_PRICING.INTL;
}
