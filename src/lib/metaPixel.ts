// Meta Pixel tracking utilities for ICONIK
declare global {
  interface Window {
    fbq: (event: string, ...args: any[]) => void;
  }
}

export const trackEvent = (event: string, data?: any) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', event, data);
  }
};

export const trackPageView = () => {
  trackEvent('PageView');
};

export const trackViewContent = (contentName: string, value?: number) => {
  trackEvent('ViewContent', {
    content_type: 'product',
    content_name: contentName,
    value: value,
    currency: 'INR'
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
    currency: 'INR'
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
    currency: 'INR'
  });
};

export const trackEthnicViewContent = () => {
  trackEvent('ViewContent', {
    content_type: 'product',
    content_name: 'Ethnic Elegance Package',
    value: 1999,
    currency: 'INR'
  });
};

// Scroll depth tracking
export const trackScrollDepth = (depth: number) => {
  trackEvent('CustomEvent', {
    event_name: 'scroll_depth',
    value: depth,
    currency: 'INR'
  });
};

// Time on page tracking
export const trackTimeOnPage = (timeInSeconds: number) => {
  trackEvent('CustomEvent', {
    event_name: 'time_on_page',
    value: timeInSeconds,
    currency: 'INR'
  });
};

// Button click tracking
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('CustomEvent', {
    event_name: 'button_click',
    button_name: buttonName,
    location: location,
    currency: 'INR'
  });
};
