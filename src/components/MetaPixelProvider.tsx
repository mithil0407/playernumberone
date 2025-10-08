'use client';

import { useEffect, useRef } from 'react';
// Direct pixel implementation for better reliability

interface MetaPixelProviderProps {
  children: React.ReactNode;
}

export default function MetaPixelProvider({ children }: MetaPixelProviderProps) {
  const initialized = useRef(false);
  
  useEffect(() => {
    // Prevent duplicate initialization
    if (initialized.current) {
      console.log('Meta Pixel already initialized, skipping...');
      return;
    }
    
    // Wait for the Meta Pixel script to load
    const initializePixel = () => {
      if (typeof window !== 'undefined' && window.fbq) {
        console.log('Meta Pixel script loaded, initializing...');
        
        // Initialize Meta Pixel ONCE with advanced matching
        window.fbq('init', '1373360484073939', {});
        window.fbq.loaded = true;
        initialized.current = true;
        
        console.log('Meta Pixel: Initialized successfully');
        
        // NOTE: PageView and ViewContent tracking removed from here
        // Individual pages will track their own events as needed
        
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
