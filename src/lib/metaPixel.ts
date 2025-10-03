// Clean Meta Pixel Implementation for ICONIK
// Pixel ID: 1373360484073939

interface MetaPixelData {
  content_type?: string;
  content_name?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
  num_items?: number;
  event_id?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

// Meta Pixel function type
declare global {
  interface Window {
    fbq: {
      (command: 'init', pixelId: string, userData?: { em?: string; ph?: string; [key: string]: string | undefined }): void;
      (command: 'track', eventName: string, parameters?: MetaPixelData): void;
      (command: 'trackCustom', eventName: string, parameters?: MetaPixelData): void;
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
export const initMetaPixel = (userData?: { em?: string; ph?: string; [key: string]: string | undefined }) => {
  if (typeof window !== 'undefined' && window.fbq && !window.fbq.loaded) {
    window.fbq('init', '1373360484073939', userData || {});
    window.fbq.loaded = true;
    console.log('Meta Pixel initialized with advanced matching:', userData ? 'with user data' : 'without user data');
  }
};

// Update user data for advanced matching
export const updateUserData = (email?: string, phone?: string) => {
  if (isPixelLoaded()) {
    const userData: { em?: string; ph?: string; [key: string]: string | undefined } = {};
    
    if (email) userData.em = email;
    if (phone) userData.ph = phone;
    
    // Re-initialize with user data
    window.fbq('init', '1373360484073939', userData);
    console.log('Meta Pixel updated with user data for advanced matching');
  }
};

// Generic event tracking with deduplication
const trackEvent = (eventName: string, data?: MetaPixelData) => {
  if (isPixelLoaded()) {
    // Add event ID to prevent duplicates
    const eventId = `${eventName}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const eventData = { ...data, event_id: eventId };
    
    window.fbq('track', eventName, eventData);
    console.log(`Meta Pixel: ${eventName} tracked`, eventData);
  }
};

// Page View
export const trackPageView = () => {
  trackEvent('PageView');
};

// View Content
export const trackViewContent = (contentName: string, value?: number, contentIds?: string[]) => {
  trackEvent('ViewContent', {
    content_type: 'product',
    content_name: contentName,
    value: value,
    currency: 'INR',
    content_ids: contentIds
  });
};

// Add to Cart
export const trackAddToCart = (productName: string, value: number, productId: string) => {
  trackEvent('AddToCart', {
    content_name: productName,
    content_type: 'product',
    content_ids: [productId],
    value: value,
    currency: 'INR'
  });
};

// Remove from Cart
export const trackRemoveFromCart = (productName: string, value: number, productId: string) => {
  trackEvent('RemoveFromCart', {
    content_name: productName,
    content_type: 'product',
    content_ids: [productId],
    value: value,
    currency: 'INR'
  });
};

// Initiate Checkout
export const trackInitiateCheckout = (value: number, numItems: number, productName: string = 'ICONIK Style Consultation') => {
  trackEvent('InitiateCheckout', {
    value: value,
    currency: 'INR',
    content_type: 'product',
    content_name: productName,
    content_ids: ['iconik_style_consultation'],
    num_items: numItems
  });
};

// Purchase (SINGLE EVENT with all items)
export const trackPurchase = (value: number, productName: string, productIds: string[], numItems: number) => {
  trackEvent('Purchase', {
    value: value,
    currency: 'INR',
    content_type: 'product',
    content_name: productName,
    content_ids: productIds,
    num_items: numItems
  });
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
export const trackCompleteRegistration = (value?: number, contentName?: string) => {
  trackEvent('CompleteRegistration', {
    content_name: contentName || 'ICONIK Customer Registration',
    value: value,
    currency: 'INR'
  });
};

// Custom event for CTA clicks
export const trackCTAClick = (buttonName: string, location: string, value?: number) => {
  trackEvent('Lead', {
    content_name: `${buttonName} - ${location}`,
    value: value,
    currency: 'INR',
    content_category: 'CTA Click'
  });
};

// Ethnic package specific tracking
export const trackEthnicPurchase = (value: number) => {
  trackEvent('Purchase', {
    value: value,
    currency: 'INR',
    content_type: 'product',
    content_name: 'Ethnic Elegance Package',
    content_ids: ['ethnic_elegance_package'],
    num_items: 1
  });
};

export const trackEthnicLead = (value?: number) => {
  trackEvent('Lead', {
    content_name: 'Ethnic Elegance Package',
    value: value || 1999,
    currency: 'INR',
    content_category: 'Ethnic Elegance Package'
  });
};
