'use client';

import { useState, useEffect } from 'react';
import { 
  testMetaPixel, 
  trackPageView, 
  trackLead, 
  trackViewContent,
  trackButtonClick,
  isMetaPixelLoaded 
} from '@/lib/metaPixel';

export default function MetaPixelDebugger() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [events, setEvents] = useState<string[]>([]);

  useEffect(() => {
    const checkPixel = () => {
      const loaded = isMetaPixelLoaded();
      setIsLoaded(loaded);
      if (loaded) {
        addEvent('Meta Pixel loaded successfully');
      }
    };

    // Check immediately
    checkPixel();
    
    // Check again after a delay
    const timeout = setTimeout(checkPixel, 2000);
    
    return () => clearTimeout(timeout);
  }, []);

  const addEvent = (event: string) => {
    setEvents(prev => [...prev, `${new Date().toLocaleTimeString()}: ${event}`]);
  };

  const handleTestEvent = () => {
    testMetaPixel();
    addEvent('Test event triggered');
  };

  const handleTrackLead = () => {
    trackLead(1199, 'Debug Lead Test');
    addEvent('Lead event tracked');
  };

  const handleTrackViewContent = () => {
    trackViewContent('Debug Product Test', 1999, ['debug_product']);
    addEvent('ViewContent event tracked');
  };

  const handleTrackButtonClick = () => {
    trackButtonClick('Debug Button', 'Debug Page');
    addEvent('Button click event tracked');
  };

  const handleTrackPageView = () => {
    trackPageView();
    addEvent('PageView event tracked');
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      <h3 className="font-bold mb-2">Meta Pixel Debugger</h3>
      
      <div className="mb-2">
        <span className={`px-2 py-1 rounded text-xs ${
          isLoaded ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {isLoaded ? 'Loaded' : 'Not Loaded'}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        <button 
          onClick={handleTestEvent}
          className="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          Test Event
        </button>
        <button 
          onClick={handleTrackLead}
          className="w-full bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
        >
          Track Lead
        </button>
        <button 
          onClick={handleTrackViewContent}
          className="w-full bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded text-xs"
        >
          Track ViewContent
        </button>
        <button 
          onClick={handleTrackButtonClick}
          className="w-full bg-orange-600 hover:bg-orange-700 px-2 py-1 rounded text-xs"
        >
          Track Button Click
        </button>
        <button 
          onClick={handleTrackPageView}
          className="w-full bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs"
        >
          Track PageView
        </button>
      </div>

      <div className="max-h-32 overflow-y-auto">
        <h4 className="font-semibold text-xs mb-1">Events:</h4>
        {events.length === 0 ? (
          <p className="text-xs text-gray-400">No events yet</p>
        ) : (
          events.map((event, index) => (
            <div key={index} className="text-xs text-gray-300 mb-1">
              {event}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
