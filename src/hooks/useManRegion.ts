'use client';

import { useState, useEffect } from 'react';

interface ManRegion {
  country: string;
  isIndia: boolean;
  isLoading: boolean;
}

export function useManRegion(): ManRegion {
  const [country, setCountry] = useState('IN');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check sessionStorage cache to avoid redundant fetches when navigating
    // between /man and /man/checkout in the same session
    const cached = sessionStorage.getItem('iconik_man_country');
    if (cached) {
      setCountry(cached);
      setIsLoading(false);
      return;
    }

    // In dev, pass ?country=XX from the current URL through to the API
    const urlParams = new URLSearchParams(window.location.search);
    const devCountry = urlParams.get('country');
    const apiUrl = devCountry ? `/api/man-region?country=${devCountry}` : '/api/man-region';

    fetch(apiUrl)
      .then(r => r.json())
      .then(data => {
        const c: string = data.country ?? 'IN';
        setCountry(c);
        sessionStorage.setItem('iconik_man_country', c);
      })
      .catch(() => {
        // Silently fall back to India pricing on any error
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { country, isIndia: country === 'IN', isLoading };
}
