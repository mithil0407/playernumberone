'use client';

import { useState } from 'react';
import { trackPageView, trackViewContent, trackPurchase, trackCTAClick } from '@/lib/metaPixel';

export default function MetaPixelTest() {
  const [status, setStatus] = useState<string>('Ready to test');

  const testPageView = () => {
    trackPageView();
    setStatus('PageView event sent');
  };

  const testViewContent = () => {
    trackViewContent('Test Product', 1499, ['test_product']);
    setStatus('ViewContent event sent');
  };

  const testPurchase = () => {
    trackPurchase(1499, 'Test Purchase', ['test_product'], 1);
    setStatus('Purchase event sent');
  };

  const testCTAClick = () => {
    trackCTAClick('Test Button', 'Test Page', 1499);
    setStatus('CTA Click event sent');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg z-50">
      <h3 className="font-bold text-sm mb-2">Meta Pixel Test</h3>
      <div className="space-y-2">
        <button 
          onClick={testPageView}
          className="block w-full bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
        >
          Test PageView
        </button>
        <button 
          onClick={testViewContent}
          className="block w-full bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
        >
          Test ViewContent
        </button>
        <button 
          onClick={testPurchase}
          className="block w-full bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
        >
          Test Purchase
        </button>
        <button 
          onClick={testCTAClick}
          className="block w-full bg-purple-500 text-white px-3 py-1 rounded text-xs hover:bg-purple-600"
        >
          Test CTA Click
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-600">
        Status: {status}
      </div>
    </div>
  );
}
