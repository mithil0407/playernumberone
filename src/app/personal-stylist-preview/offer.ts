export const MEMBERSHIP = {
  name: 'ICONIK Personal Stylist',
  price: 2499,
  blueprintPrice: 2699,
  callMinutes: 30,
  requests: 4,
  looksPerRequest: 2,
  quickChecks: 4,
  checkIns: 2,
  firstLookWorkingDays: 2,
  responseWorkingDays: 2,
  blueprintDeliveryWorkingDays: 5,
} as const;

export const monthlyLooks = MEMBERSHIP.requests * MEMBERSHIP.looksPerRequest;
export const pricePerDay = Math.round(MEMBERSHIP.price / 30);
export const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export const membershipIncludes = [
  `First two looks within ${MEMBERSHIP.firstLookWorkingDays} working days of intake`,
  `${MEMBERSHIP.requests} styling requests a month · ${MEMBERSHIP.looksPerRequest} complete looks each`,
  `One ${MEMBERSHIP.callMinutes}-minute video call with your stylist every month`,
  `${MEMBERSHIP.quickChecks} WhatsApp outfit or shopping checks`,
  `${MEMBERSHIP.checkIns} check-ins from your stylist`,
  'A saved Style Profile that grows with you',
  'One round of adjustments on every request',
];

export const blueprintIncludes = [
  `One ${MEMBERSHIP.callMinutes}-minute stylist consultation`,
  '20 complete outfit formulas',
  'Colour, body-shape, hair & accessory guidance',
  'Revisions within your original brief',
  `Delivered within ${MEMBERSHIP.blueprintDeliveryWorkingDays} working days of your call`,
];

export const priorities = [
  { id: 'fit', short: 'Fit & proportions', first: 'Two looks that work with your proportions', image: '/stylist-intake/moodboard-relaxed-professional-01.webp' },
  { id: 'colour', short: 'Colour confidence', first: 'Two looks built around your best colours', image: '/stylist-intake/moodboard-elevated-expressive-01.webp' },
  { id: 'wardrobe', short: 'Everyday outfits', first: 'Two ready-to-wear looks from clothes you own', image: '/stylist-intake/moodboard-structured-minimalist-01.webp' },
] as const;

export type Priority = typeof priorities[number]['id'];
export type Plan = 'monthly' | 'blueprint';

export function validPriority(value?: string | null): Priority {
  return priorities.find(p => p.id === value)?.id ?? 'fit';
}

export function validPlan(value?: string | null): Plan {
  return value === 'blueprint' ? 'blueprint' : 'monthly';
}
