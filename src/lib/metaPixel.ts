// Clean Meta Pixel Implementation for ICONIK
// Pixel ID: 1373360484073939
import { trackGrowthEvent } from '@/lib/growthAnalytics';
import { trackMetaPageView } from '@/lib/metaPageView';
import {
  META_COMPLETE_REGISTRATION_EVENT_NAME,
  META_PURCHASE_EVENT_NAME,
  normalizeMetaEmail,
  normalizeMetaPhone,
  resolveMetaPurchaseEventId,
} from '@/lib/metaTrackingContract';

export {
  INDIA_BLUEPRINT_CONTENT_NAME,
  INDIA_BLUEPRINT_PRODUCT_ID,
  MAN_EDIT_CONTENT_NAME,
  MAN_EDIT_FUNNEL_CATEGORY,
  MAN_EDIT_PRODUCT_ID,
  INDIA_FUNNEL_CATEGORY,
  INDIA_LEGACY_CHECKOUT_FUNNEL_CATEGORY,
  INDIA_OFFER_2699_FUNNEL_CATEGORY,
  INDIA_ROOT_FUNNEL_CATEGORY,
  buildIndiaBlueprintContentIds,
} from '@/lib/metaTrackingContract';

export const META_PIXEL_ID = '1373360484073939';
export const INDIA_PHONE_COUNTRY_CODE = '91';
export const MAN_BLUEPRINT_PRODUCT_ID = 'iconik_man_style_blueprint';
export const MAN_OUTFIT_PREVIEW_PRODUCT_ID = 'outfit_preview_on_you';
export const MAN_FUNNEL_CATEGORY = 'Man Funnel';

interface MetaPixelData {
  content_type?: string;
  content_name?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
  num_items?: number;
  [key: string]: string | number | boolean | string[] | undefined;
}

interface MetaPixelOptions {
  eventID?: string;
}

type AdvancedMatchingData = {
  em?: string;
  ph?: string;
};

const validatedAdvancedMatching = (
  email?: string,
  phone?: string,
  phoneCountryCode?: string,
): AdvancedMatchingData => {
  const userData: AdvancedMatchingData = {};
  const normalizedEmail = normalizeMetaEmail(email);
  const normalizedPhone = normalizeMetaPhone(phone, phoneCountryCode);

  if (normalizedEmail) userData.em = normalizedEmail;
  if (normalizedPhone) userData.ph = normalizedPhone;

  return userData;
};

// Meta Pixel function type
declare global {
  interface Window {
    fbq: {
      (command: 'init', pixelId: string, userData?: AdvancedMatchingData): void;
      (command: 'track', eventName: string, parameters?: MetaPixelData, options?: MetaPixelOptions): void;
      (command: 'trackCustom', eventName: string, parameters?: MetaPixelData, options?: MetaPixelOptions): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
    };
    __iconikLastMetaPageViewRoute?: string;
  }
}

// Check if Meta Pixel is loaded
const isPixelLoaded = (): boolean => {
  return typeof window !== 'undefined' && !!window.fbq && !!window.fbq.loaded;
};

// Initialize Meta Pixel with advanced matching
export const initMetaPixel = (userData?: AdvancedMatchingData) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const validatedUserData = validatedAdvancedMatching(userData?.em, userData?.ph);
    window.fbq('init', META_PIXEL_ID, validatedUserData);
    window.fbq.loaded = true;
    console.log(
      'Meta Pixel initialized with advanced matching:',
      Object.keys(validatedUserData).length ? 'with user data' : 'without user data',
    );
  } else {
    console.error('Meta Pixel not available for initialization');
  }
};

// Update user data for advanced matching
export const updateUserData = (email?: string, phone?: string, phoneCountryCode?: string) => {
  if (isPixelLoaded()) {
    const userData = validatedAdvancedMatching(email, phone, phoneCountryCode);
    if (Object.keys(userData).length) {
      // The bridge in layout.tsx forwards only `track*` calls to the Signals
      // Gateway, but Events Manager reports em/ph on 100% of Purchase events
      // across both sources — Stape picks them up independently. Do not
      // re-init the gateway SDK here; it buys nothing and risks resetting it.
      window.fbq('init', META_PIXEL_ID, userData);
      console.log('Meta Pixel updated with validated advanced matching data');
    }
  }
};

// Generic event tracking with deduplication
const trackEvent = (eventName: string, data?: MetaPixelData, options?: MetaPixelOptions & { custom?: boolean }) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const eventId = options?.eventID || `${eventName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    // Drop undefined keys so the browser payload matches what the Conversions
    // API sends for the same event ID — Meta keeps whichever arrives first.
    const payload = data
      ? Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as MetaPixelData
      : undefined;
    if (options?.custom) {
      window.fbq('trackCustom', eventName, payload, { eventID: eventId });
    } else {
      window.fbq('track', eventName, payload, { eventID: eventId });
    }
    console.log(`Meta Pixel: ${eventName} tracked`, { ...payload, eventID: eventId });
  } else {
    console.error(`Meta Pixel: Cannot track ${eventName} - pixel not loaded`);
  }
};

// Global route tracking owns PageView. This legacy entry point shares the same
// window-level deduplication as a safety net while old bundles are still cached.
export const trackPageViewRoute = (pathname: string, search = '') => {
  if (typeof window === 'undefined') return;
  return trackMetaPageView(window, pathname, search);
};

export const trackPageView = () => {
  if (typeof window === 'undefined') return;
  return trackPageViewRoute(window.location.pathname, window.location.search);
};

// View Content
export const trackViewContent = (
  contentName: string,
  value?: number,
  contentIds?: string[],
  currency: string = 'INR',
  contentCategory?: string
) => {
  trackEvent('ViewContent', {
    content_type: 'product',
    content_name: contentName,
    value: value,
    currency: currency,
    content_ids: contentIds,
    content_category: contentCategory
  });
};

// Add to Cart
export const trackAddToCart = (
  productName: string,
  value: number,
  productId: string,
  currency: string = 'INR',
  contentCategory?: string
) => {
  trackEvent('AddToCart', {
    content_name: productName,
    content_type: 'product',
    content_ids: [productId],
    value: value,
    currency: currency,
    content_category: contentCategory
  });
};

// Remove from Cart
export const trackRemoveFromCart = (
  productName: string,
  value: number,
  productId: string,
  currency: string = 'INR',
  contentCategory?: string
) => {
  trackEvent('RemoveFromCart', {
    content_name: productName,
    content_type: 'product',
    content_ids: [productId],
    value: value,
    currency: currency,
    content_category: contentCategory
  });
};

// Initiate Checkout
export const trackInitiateCheckout = (
  value: number,
  numItems: number,
  productName: string = 'ICONIK Style Consultation',
  currency: string = 'INR',
  contentCategory?: string,
  contentIds: string[] = ['iconik_style_consultation']
) => {
  trackGrowthEvent('checkout_started', {
    value,
    currency,
    content_source: contentCategory,
  });
  trackEvent('InitiateCheckout', {
    value: value,
    currency: currency,
    content_type: 'product',
    content_name: productName,
    content_ids: contentIds,
    num_items: numItems,
    content_category: contentCategory
  });
};

// Purchase (SINGLE EVENT with all items)
export const trackPurchase = (
  value: number,
  productName: string,
  productIds: string[],
  numItems: number,
  currency: string = 'INR',
  contentCategory?: string,
  transactionId?: string,
  eventId?: string
) => {
  const purchaseEventId = resolveMetaPurchaseEventId(transactionId, eventId);
  trackGrowthEvent('purchase', {
    value,
    currency,
    transaction_id: transactionId,
    content_source: contentCategory,
  });
  trackEvent(META_PURCHASE_EVENT_NAME, {
    value: value,
    currency: currency,
    content_type: 'product',
    content_name: productName,
    content_ids: productIds,
    num_items: numItems,
    content_category: contentCategory,
    transaction_id: transactionId
  }, purchaseEventId ? { eventID: purchaseEventId } : undefined);
};

// Lead
export const trackLead = (value?: number, contentName?: string) => {
  trackEvent('Lead', {
    content_name: contentName || 'ICONIK Style Consultation',
    value: value,
    currency: 'INR',
    content_category: 'Style Consultation'
  });
};

// Complete Registration
export const trackCompleteRegistration = (
  value?: number,
  contentName?: string,
  currency: string = 'INR',
  options?: {
    eventId?: string;
    contentIds?: string[];
    contentCategory?: string;
    transactionId?: string;
  },
) => {
  // A value of `undefined` is deliberately allowed through: a success page that
  // cannot resolve the amount for *this* payment must send no value rather than
  // a stale one from an earlier order.
  const hasValue = typeof value === 'number' && Number.isFinite(value);
  trackEvent(META_COMPLETE_REGISTRATION_EVENT_NAME, {
    content_name: contentName || 'ICONIK Customer Registration',
    value: hasValue ? value : undefined,
    currency: hasValue ? currency : undefined,
    content_type: options?.contentIds?.length ? 'product' : undefined,
    content_ids: options?.contentIds,
    content_category: options?.contentCategory,
    transaction_id: options?.transactionId,
  }, options?.eventId ? { eventID: options.eventId } : undefined);
};

// ── Success-page handoff ────────────────────────────────────────────────────
// A success page can be reloaded, bookmarked, or reached again days later from
// the post-payment intake email. Keying the record by payment ID means the page
// can tell "this payment" from "some earlier payment", so it never reports a
// stale amount and never re-fires for an order it has already tracked.

const PURCHASE_HANDOFF_KEY = 'iconik_meta_purchase_handoff';

export interface MetaPurchaseHandoff {
  paymentId: string;
  amount: number;
  currency: string;
  contentIds: string[];
  contentName: string;
  contentCategory: string;
  email?: string;
  phone?: string;
  phoneCountryCode?: string;
  completeRegistrationTracked?: boolean;
}

export const storeMetaPurchaseHandoff = (handoff: MetaPurchaseHandoff) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PURCHASE_HANDOFF_KEY, JSON.stringify(handoff));
  } catch {
    // Analytics must never block the user journey.
  }
};

export const readMetaPurchaseHandoff = (paymentId?: string | null): MetaPurchaseHandoff | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(PURCHASE_HANDOFF_KEY);
    if (!stored) return null;
    const handoff = JSON.parse(stored) as MetaPurchaseHandoff;
    if (!handoff?.paymentId) return null;
    // A payment ID in the URL wins: if it does not match the stored record the
    // customer is looking at a different order and the stored amount is wrong.
    if (paymentId && handoff.paymentId !== paymentId) return null;
    return handoff;
  } catch {
    return null;
  }
};

export const markMetaPurchaseHandoffTracked = (paymentId: string) => {
  const handoff = readMetaPurchaseHandoff(paymentId);
  if (!handoff) return;
  storeMetaPurchaseHandoff({ ...handoff, completeRegistrationTracked: true });
};

// Custom event for CTA clicks
export const trackCTAClick = (
  buttonName: string,
  location: string,
  value?: number,
  currency: string = 'INR',
  contentCategory?: string
) => {
  trackEvent('CTA_Click', {
    content_name: `${buttonName} - ${location}`,
    value: value,
    currency: currency,
    content_category: contentCategory || 'CTA Click'
  }, { custom: true });
};
