'use client';

import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { usePathname } from 'next/navigation';
import { isMetaPageViewExcluded } from '@/lib/metaPageView';

export default function PublicAnalytics({ measurementIds }: { measurementIds: string[] }) {
  const pathname = usePathname();
  if (isMetaPageViewExcluded(pathname)) return null;
  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementIds[0]}`} strategy="afterInteractive" />
    <Script id="google-analytics" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
      ${measurementIds.map(id => `gtag('config', '${id}');`).join('\n')}
    `}</Script>
    <Analytics beforeSend={event => isMetaPageViewExcluded(new URL(event.url).pathname) ? null : event} />
  </>;
}
