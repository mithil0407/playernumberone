'use client';

import { useEffect } from 'react';
import { initMetaPixel, trackPageView, trackViewContent } from '@/lib/metaPixel';

interface MetaPixelProviderProps {
  children: React.ReactNode;
}

export default function MetaPixelProvider({ children }: MetaPixelProviderProps) {
  useEffect(() => {
    // Initialize Meta Pixel only once
    initMetaPixel();
    
    // Track initial page view
    trackPageView();
    
    // Track initial content view
    trackViewContent('ICONIK Style Consultation', 1499, ['iconik_style_consultation']);
    
  }, []);

  return <>{children}</>;
}
