import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PlayerNumberOne Alpha1 - Transform Your Confidence & Attractiveness",
  description: "Join 200+ men who transformed their lives with Alpha1. Get personalized grooming, style, fitness & confidence coaching. Start your transformation today!",
  keywords: "men transformation, grooming, style, fitness, confidence, attractiveness, coaching, Alpha1",
  openGraph: {
    title: "PlayerNumberOne Alpha1 - Transform Your Confidence & Attractiveness",
    description: "Join 200+ men who transformed their lives with Alpha1. Get personalized grooming, style, fitness & confidence coaching.",
    type: "website",
    url: "https://www.playernumber1.pro",
    siteName: "PlayerNumberOne Alpha1",
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
      </head>
      <body className={inter.className}>
        {/* Google Analytics 4 */}
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
              page_title: 'PlayerNumberOne Alpha1',
              page_location: 'https://www.playernumber1.pro'
            });
          `}
        </Script>

        {/* Google Tag (gtag.js) - G-94CVS6PDTF */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-94CVS6PDTF"
          strategy="afterInteractive"
        />
        <Script id="google-tag-old" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-94CVS6PDTF');
          `}
        </Script>

        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1373360484073939');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1373360484073939&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
        
        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}
