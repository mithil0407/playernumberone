'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureAttribution } from '@/lib/attribution';
import { trackPageViewRoute } from '@/lib/metaPixel';

interface MetaPixelProviderProps {
  children: React.ReactNode;
}

function MetaPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    // Capture first-touch attribution globally rather than per landing page.
    // Only /man and /globe used to call this, so a visitor who landed on `/` or
    // /offer-2699 with UTMs and then client-navigated to checkout had their
    // campaign data first read at the checkout URL — where the UTMs and fbclid
    // no longer exist. Running here also refreshes _fbp/_fbc once the Meta SDK
    // has written them.
    captureAttribution();
    trackPageViewRoute(pathname, search);
  }, [pathname, search]);

  return null;
}

export default function MetaPixelProvider({ children }: MetaPixelProviderProps) {
  return (
    <>
      <Suspense fallback={null}>
        <MetaPageViewTracker />
      </Suspense>
      {children}
    </>
  );
}
