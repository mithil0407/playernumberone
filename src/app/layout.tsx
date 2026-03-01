import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import MetaPixelProvider from "@/components/MetaPixelProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-playfair',
  fallback: ['Georgia', 'serif'],
});

export const metadata: Metadata = {
  title: "ICONIK - Discover Your Signature Style & Transform Your Confidence",
  description: "ICONIK: Your complete style transformation program. Discover your unique style, personalized color palette, and build unshakeable confidence. Join 200+ women who transformed their lives.",
  keywords: "style transformation, personal style, color palette, women fashion, confidence building, style consultation, wardrobe makeover",
  openGraph: {
    title: "ICONIK - Discover Your Signature Style & Transform Your Confidence",
    description: "ICONIK: Your complete style transformation program. Discover your unique style, personalized color palette, and build unshakeable confidence.",
    type: "website",
    url: "https://playernumberone.com",
    siteName: "ICONIK",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="Permissions-Policy" content="payment=*" />
        {/* Preload LCP image: the hero carousel image shown above the fold */}
        <link
          rel="preload"
          as="image"
          href="/transformation-1.webp"
          fetchPriority="high"
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${inter.className}`}>
        {/* Google Analytics — single gtag init shared across both properties */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-V4126JH4EJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-V4126JH4EJ', {
              page_title: 'ICONIK',
              page_location: 'https://playernumberone.com'
            });
            gtag('config', 'G-94CVS6PDTF');
          `}
        </Script>

        {/* Meta Pixel */}
        <Script id="meta-pixel-base" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
          `}
        </Script>

        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1373360484073939&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        {/* Meta Pixel Provider */}
        <MetaPixelProvider>
          {children}
        </MetaPixelProvider>


        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
