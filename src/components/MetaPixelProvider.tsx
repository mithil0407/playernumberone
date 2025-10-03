'use client';

import { useEffect } from 'react';
// Direct pixel implementation for better reliability

interface MetaPixelProviderProps {
  children: React.ReactNode;
}

export default function MetaPixelProvider({ children }: MetaPixelProviderProps) {
  useEffect(() => {
    // Wait for the Meta Pixel script to load
    const initializePixel = () => {
      if (typeof window !== 'undefined' && window.fbq) {
        console.log('Meta Pixel script loaded, initializing...');
        
        // Initialize Meta Pixel with advanced matching
        window.fbq('init', '1373360484073939', {});
        window.fbq.loaded = true;
        
        // Track initial page view
        window.fbq('track', 'PageView');
        console.log('Meta Pixel: PageView tracked');
        
        // Track initial content view
        window.fbq('track', 'ViewContent', {
          content_type: 'product',
          content_name: 'ICONIK Style Consultation',
          value: 1499,
          currency: 'INR',
          content_ids: ['iconik_style_consultation']
        });
        console.log('Meta Pixel: ViewContent tracked');
        
      } else {
        console.log('Meta Pixel script not loaded yet, retrying...');
        // Retry after 100ms
        setTimeout(initializePixel, 100);
      }
    };

    // Start initialization
    initializePixel();
    
  }, []);

  return <>{children}</>;
}
