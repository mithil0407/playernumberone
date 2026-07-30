'use client';

import { Suspense, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageViewRoute } from '@/lib/metaPixel';

interface MetaPixelProviderProps {
  children: React.ReactNode;
}

function MetaPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
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
