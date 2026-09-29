'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { CLARITY_PROJECT_ID, clarityRouteFor } from '@/lib/clarity';
import { getAttributionPayload } from '@/lib/attribution';

type ClarityFn = ((command: string, ...args: unknown[]) => void) & { q?: unknown[] };

// Same queueing stub as Clarity's snippet, so calls made before the lazily
// loaded tag arrives are replayed by it rather than lost.
function clarity(command: string, ...args: unknown[]) {
  const w = window as unknown as { clarity?: ClarityFn };
  w.clarity = w.clarity || function (...queued: unknown[]) {
    (w.clarity!.q = w.clarity!.q || []).push(queued);
  };
  w.clarity(command, ...args);
}

export default function ClarityScript() {
  const pathname = usePathname();
  const route = clarityRouteFor(pathname);
  // The tag is only injected once a visitor lands on an allowed page. After
  // that, client-side navigation to any other route stops recording until the
  // visitor comes back to an allowed page.
  const [activated, setActivated] = useState(false);
  const stopped = useRef(false);

  useEffect(() => {
    if (!CLARITY_PROJECT_ID) return;
    if (!route) {
      if (activated && !stopped.current) {
        clarity('stop');
        stopped.current = true;
      }
      return;
    }

    if (!activated) setActivated(true);
    if (stopped.current) {
      clarity('start');
      stopped.current = false;
    }

    // Queued by the stub until the tag loads. Only campaign data, never PII.
    const attribution = getAttributionPayload();
    clarity('set', 'funnel', route.funnel);
    clarity('set', 'step', route.step);
    if (attribution.utm_source) clarity('set', 'utm_source', attribution.utm_source);
    if (attribution.utm_campaign) clarity('set', 'utm_campaign', attribution.utm_campaign);
    if (attribution.utm_content) clarity('set', 'utm_content', attribution.utm_content);
  }, [route?.funnel, route?.step, activated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!CLARITY_PROJECT_ID || !activated) return null;

  return (
    <Script id="microsoft-clarity" strategy="lazyOnload">{`
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", ${JSON.stringify(CLARITY_PROJECT_ID)});
    `}</Script>
  );
}
