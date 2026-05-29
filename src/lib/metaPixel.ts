// Clean Meta Pixel Implementation for ICONIK
// Pixel ID: 1373360484073939
export const META_PIXEL_ID = '1373360484073939';
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

// Meta Pixel function type
declare global {
  interface Window {
    fbq: {
      (command: 'init', pixelId: string, userData?: { em?: string; ph?: string;[key: string]: string | undefined }): void;
      (command: 'track', eventName: string, parameters?: MetaPixelData, options?: MetaPixelOptions): void;
      (command: 'trackCustom', eventName: string, parameters?: MetaPixelData, options?: MetaPixelOptions): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
    };
  }
}

// Check if Meta Pixel is loaded
const isPixelLoaded = (): boolean => {
  return typeof window !== 'undefined' && !!window.fbq && !!window.fbq.loaded;
};

// Initialize Meta Pixel with advanced matching
export const initMetaPixel = (userData?: { em?: string; ph?: string;[key: string]: string | undefined }) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('init', META_PIXEL_ID, userData || {});
    window.fbq.loaded = true;
    console.log('Meta Pixel initialized with advanced matching:', userData ? 'with user data' : 'without user data');
  } else {
    console.error('Meta Pixel not available for initialization');
  }
};

// Update user data for advanced matching
export const updateUserData = (email?: string, phone?: string) => {
  if (isPixelLoaded()) {
    const userData: { em?: string; ph?: string;[key: string]: string | undefined } = {};

    if (email) userData.em = email;
    if (phone) userData.ph = phone;

    // Re-initialize with user data
    window.fbq('init', META_PIXEL_ID, userData);
    console.log('Meta Pixel updated with user data for advanced matching');
  }
};

// Generic event tracking with deduplication
const trackEvent = (eventName: string, data?: MetaPixelData, options?: MetaPixelOptions & { custom?: boolean }) => {
  if (typeof window !== 'undefined' && window.fbq) {
    const eventId = options?.eventID || `${eventName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    if (options?.custom) {
      window.fbq('trackCustom', eventName, data, { eventID: eventId });
    } else {
      window.fbq('track', eventName, data, { eventID: eventId });
    }
    console.log(`Meta Pixel: ${eventName} tracked`, { ...data, eventID: eventId });
  } else {
    console.error(`Meta Pixel: Cannot track ${eventName} - pixel not loaded`);
  }
};

// Page View
export const trackPageView = (contentCategory?: string) => {
  trackEvent('PageView', contentCategory ? { content_category: contentCategory } : undefined);
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
  trackEvent('Purchase', {
    value: value,
    currency: currency,
    content_type: 'product',
    content_name: productName,
    content_ids: productIds,
    num_items: numItems,
    content_category: contentCategory,
    transaction_id: transactionId
  }, eventId ? { eventID: eventId } : undefined);
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
export const trackCompleteRegistration = (value?: number, contentName?: string, currency: string = 'INR') => {
  trackEvent('CompleteRegistration', {
    content_name: contentName || 'ICONIK Customer Registration',
    value: value,
    currency: currency
  });
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
