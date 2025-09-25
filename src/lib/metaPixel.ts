// Meta Pixel tracking utilities for ICONIK
// Pixel ID: 1373360484073939

interface MetaPixelData {
  content_type?: string;
  content_name?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
  num_items?: number;
  event_name?: string;
  button_name?: string;
  location?: string;
  content_category?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

// Meta Pixel function type
declare global {
  interface Window {
    fbq: {
      (command: 'init', pixelId: string): void;
      (command: 'track', eventName: string, parameters?: MetaPixelData): void;
      (command: 'trackCustom', eventName: string, parameters?: MetaPixelData): void;
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
    };
  }
}

// Initialize Meta Pixel
export const initMetaPixel = (pixelId: string = '1373360484073939') => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('init', pixelId);
    console.log('Meta Pixel initialized with ID:', pixelId);
  }
};

// Track page view
export const trackPageView = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'PageView');
    console.log('Meta Pixel: PageView tracked');
  }
};

// Generic event tracking function
export const trackEvent = (event: string, data?: MetaPixelData) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, data || {});
    console.log(`Meta Pixel: ${event} tracked`, data);
  }
};

// Custom event tracking
export const trackCustomEvent = (eventName: string, data?: MetaPixelData) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, data || {});
    console.log(`Meta Pixel: Custom event ${eventName} tracked`, data);
  }
};

// E-commerce tracking functions
export const trackViewContent = (contentName: string, value?: number, contentIds?: string[]) => {
  trackEvent('ViewContent', {
    content_type: 'product',
    content_name: contentName,
    value: value,
    currency: 'INR',
    content_ids: contentIds
  });
};

export const trackAddToCart = (productName: string, value: number, productId: string) => {
  trackEvent('AddToCart', {
    content_name: productName,
    content_type: 'product',
    content_ids: [productId],
    value: value,
    currency: 'INR'
  });
};

export const trackRemoveFromCart = (productName: string, value: number, productId: string) => {
  trackEvent('RemoveFromCart', {
    content_name: productName,
    content_type: 'product',
    content_ids: [productId],
    value: value,
    currency: 'INR'
  });
};

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

export const trackPurchase = (value: number, productName: string = 'ICONIK Style Consultation', productId: string = 'iconik_style_consultation') => {
  trackEvent('Purchase', {
    value: value,
    currency: 'INR',
    content_type: 'product',
    content_name: productName,
    content_ids: [productId],
    num_items: 1
  });
};

export const trackLead = (value?: number, contentName?: string) => {
  trackEvent('Lead', {
    content_name: contentName || 'ICONIK Style Consultation',
    value: value,
    currency: 'INR',
    content_category: 'Style Consultation'
  });
};

export const trackCompleteRegistration = (value?: number, contentName?: string) => {
  trackEvent('CompleteRegistration', {
    content_name: contentName || 'ICONIK Customer Registration',
    value: value,
    currency: 'INR'
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

export const trackEthnicViewContent = () => {
  trackEvent('ViewContent', {
    content_type: 'product',
    content_name: 'Ethnic Elegance Package',
    value: 1999,
    currency: 'INR',
    content_ids: ['ethnic_elegance_package']
  });
};

// Advanced tracking functions
export const trackScrollDepth = (depth: number) => {
  trackCustomEvent('ScrollDepth', {
    event_name: 'scroll_depth',
    value: depth
  });
};

export const trackTimeOnPage = (timeInSeconds: number) => {
  trackCustomEvent('TimeOnPage', {
    event_name: 'time_on_page',
    value: timeInSeconds
  });
};

export const trackButtonClick = (buttonName: string, location: string) => {
  trackCustomEvent('ButtonClick', {
    event_name: 'button_click',
    button_name: buttonName,
    location: location
  });
};

// Form interaction tracking
export const trackFormStart = (formName: string) => {
  trackCustomEvent('FormStart', {
    event_name: 'form_start',
    form_name: formName
  });
};

export const trackFormSubmit = (formName: string) => {
  trackCustomEvent('FormSubmit', {
    event_name: 'form_submit',
    form_name: formName
  });
};

// Search tracking
export const trackSearch = (searchTerm: string) => {
  trackCustomEvent('Search', {
    event_name: 'search',
    search_string: searchTerm
  });
};

// Video tracking
export const trackVideoPlay = (videoTitle: string) => {
  trackCustomEvent('VideoPlay', {
    event_name: 'video_play',
    video_title: videoTitle
  });
};

export const trackVideoComplete = (videoTitle: string) => {
  trackCustomEvent('VideoComplete', {
    event_name: 'video_complete',
    video_title: videoTitle
  });
};

// Utility function to check if Meta Pixel is loaded
export const isMetaPixelLoaded = (): boolean => {
  return typeof window !== 'undefined' && !!window.fbq;
};

// Debug function to test Meta Pixel
export const testMetaPixel = () => {
  if (isMetaPixelLoaded()) {
    console.log('Meta Pixel is loaded and ready');
    trackCustomEvent('TestEvent', {
      event_name: 'test_event',
      test_data: 'Meta Pixel is working correctly'
    });
  } else {
    console.error('Meta Pixel is not loaded');
  }
};