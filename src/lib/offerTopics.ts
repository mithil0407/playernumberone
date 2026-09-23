// Topic landing pages for the ₹2,699 India offer. Every topic shares the same
// checkout, price and Meta content category, so ad sets can be compared on one
// funnel; the topic itself is recorded through first-touch `landing_page`.

export const OFFER_TOPIC_KEYS = ['general', 'sleeves', 'modest'] as const;

export type OfferTopicKey = (typeof OFFER_TOPIC_KEYS)[number];

export interface OfferTopic {
  key: OfferTopicKey;
  path: string;
  eyebrow: string;
  painTitle: string;
  painPoints: string[];
  promiseTitle: string;
  promisePoints: string[];
  faqs: { question: string; answer: string }[];
  finalHeadline: string;
  /** One line shown on the checkout package card so the promise carries through. */
  checkoutNote?: string;
}

// Every bonus maps to a page in the current women's Blueprint (studio_55):
// hairstyle, hair colour, eyewear and everyday makeup. Keep this list in step
// with the report before promising anything new here.
export const OFFER_FREE_BONUSES = [
  { title: 'Hairstyle guide', desc: '4 haircuts and styles that suit your face shape.' },
  { title: 'Makeup guide', desc: 'The everyday makeup shades that suit your skin.' },
  { title: 'Hair colour guide', desc: '4 hair colour or highlight ideas that suit your skin.' },
  { title: 'Glasses guide', desc: 'Frame shapes for glasses and sunglasses that suit your face.' },
] as const;

export const OFFER_TOPICS: Record<OfferTopicKey, OfferTopic> = {
  general: {
    key: 'general',
    path: '/offer-2699',
    eyebrow: 'Personal styling for Indian women',
    painTitle: 'Does this sound like you?',
    painPoints: [
      'Your wardrobe is full, but you still feel you have nothing to wear.',
      'Clothes look good online, then look wrong on you.',
      'You are not sure which colours suit your skin.',
      'You want to look good at work, family functions and weddings.',
    ],
    promiseTitle: 'A real stylist. Advice made only for you.',
    promisePoints: [
      '20 complete outfits for your real life.',
      'The colours that suit your skin, and the ones to skip.',
      'What suits your body shape, and what to avoid.',
    ],
    faqs: [],
    finalHeadline: 'Stop Guessing What Suits You.',
  },
  sleeves: {
    key: 'sleeves',
    path: '/offer-2699/sleeves',
    eyebrow: 'For women who like to keep their arms covered',
    painTitle: 'Does this sound like you?',
    painPoints: [
      'You pick full sleeves every time, even in summer.',
      'You avoid photos because of your arms.',
      'The kurtas and tops you like come sleeveless or with short sleeves.',
      'Some full sleeves make you look bigger, and you do not know why.',
    ],
    promiseTitle: 'Covering up is your choice. Looking good in it is our job.',
    promisePoints: [
      'You decide how much to cover. We never push you into sleeveless.',
      'Sleeve shapes, fabrics and fits that do not add bulk to your arms.',
      'Full, three-quarter and elbow sleeves in all 20 of your outfits.',
    ],
    faqs: [
      {
        question: 'Will you ask me to wear sleeveless or short sleeves?',
        answer: 'No. On your call, you tell your stylist how much you want to cover. Every outfit in your Blueprint follows that.',
      },
      {
        question: 'Will full sleeves make me look bigger?',
        answer: 'Not when the sleeve shape, fabric and fit are right. Your stylist picks sleeves that sit well on your arms and tells you which ones to skip.',
      },
    ],
    finalHeadline: 'Keep Your Sleeves. Look Stylish.',
    checkoutNote: 'Every outfit comes with sleeves you are comfortable in.',
  },
  modest: {
    key: 'modest',
    path: '/offer-2699/modest',
    eyebrow: 'For women who dress modestly',
    painTitle: 'Does this sound like you?',
    painPoints: [
      'Modest clothes in shops look plain or old-fashioned.',
      'Most of your clothes are loose, and you feel they hide you.',
      'You want to look neat and stylish at work, functions and weddings — without showing more skin.',
      'You are tired of wearing the same safe colours.',
    ],
    promiseTitle: 'Modest is your rule. Stylish is our job.',
    promisePoints: [
      'You set the rules — sleeves, length, neckline, fit. Every outfit follows them.',
      'Shapes that look neat and elegant, not baggy.',
      'Colours that brighten your face, so covered outfits never look dull.',
    ],
    faqs: [
      {
        question: 'Will the outfits really be modest?',
        answer: 'Yes. On your call, you tell your stylist your rules — sleeves, length, neckline and fit. Every outfit in your Blueprint follows them.',
      },
      {
        question: 'Can I get both Indian and western outfits?',
        answer: 'Yes. Your 20 outfits can include kurtas, suits, sarees, dresses and western wear — whatever you actually wear.',
      },
    ],
    finalHeadline: 'Modest. Stylish. Every Day.',
    checkoutNote: 'Every outfit follows your modesty rules.',
  },
};

export function parseOfferTopicKey(value?: string | null): OfferTopicKey | undefined {
  return OFFER_TOPIC_KEYS.find((key) => key === value);
}

export function offerCheckoutHref(topic: OfferTopicKey, scan = '') {
  const params = new URLSearchParams();
  if (topic !== 'general') params.set('topic', topic);
  if (scan) params.set('scan', scan);
  const query = params.toString();
  return query ? `/offer-2699/checkout?${query}` : '/offer-2699/checkout';
}
