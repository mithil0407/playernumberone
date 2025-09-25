'use client';

import { useEffect } from 'react';
import { initMetaPixel, trackPageView, testMetaPixel } from '@/lib/metaPixel';

interface MetaPixelProviderProps {
  children: React.ReactNode;
}

export default function MetaPixelProvider({ children }: MetaPixelProviderProps) {
  useEffect(() => {
    // Initialize Meta Pixel when component mounts
    initMetaPixel();
    
    // Track page view
    trackPageView();
    
    // Test Meta Pixel functionality
    testMetaPixel();
    
    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        trackPageView();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <>{children}</>;
}
