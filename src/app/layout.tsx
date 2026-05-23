import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import MetaPixelProvider from "@/components/MetaPixelProvider";
import "./globals.css";

const GA_MEASUREMENT_IDS = [
  "G-LHX425PH4B",
  "G-V4126JH4EJ",
  "G-94CVS6PDTF",
] as const;

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
  metadataBase: new URL("https://www.iconik.pro"),
  title: {
    default: "Iconik — Scientific Personal Styling for Indian Women",
    template: "%s",
  },
  description: "India's scientific personal styling service. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™ — delivered in your personalised Style Blueprint in 48 hours.",
  keywords: "personal stylist India, online personal styling India, body type styling India, colour analysis Indian skin tone, style blueprint India, personal stylist online, Indian women fashion",
  authors: [{ name: "Iconik Styling Team", url: "https://www.iconik.pro" }],
  creator: "Iconik LLP",
  publisher: "Iconik LLP",
  alternates: {
    canonical: "https://www.iconik.pro",
    languages: {
      "en-IN": "https://www.iconik.pro",
      "en-AE": "https://www.iconik.pro/uae",
      "en-AU": "https://www.iconik.pro/au",
    },
  },
  openGraph: {
    title: "Iconik — Scientific Personal Styling for Indian Women",
    description: "India's scientific personal styling service. Get your personalised Style Blueprint in 48 hours — body analysis, colour palette, and 16+ outfit recommendations.",
    type: "website",
    url: "https://www.iconik.pro",
    siteName: "Iconik",
    locale: "en_IN",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Iconik — Scientific Personal Styling for Indian Women",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Iconik — Scientific Personal Styling for Indian Women",
    description: "India's scientific personal styling service. Get your personalised Style Blueprint in 48 hours.",
    images: ["/og-image.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
    other: [
      { rel: "manifest", url: "/site.webmanifest" },
      { rel: "android-chrome", url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { rel: "android-chrome", url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  verification: {
    google: "",
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
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_IDS[0]}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            ${GA_MEASUREMENT_IDS.map((id) => `gtag('config', '${id}');`).join("\n            ")}
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
            fbq('init', '1373360484073939');
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

        {/* Organization + WebSite JSON-LD — AEO entity signal */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://www.iconik.pro/#organization",
                  "name": "Iconik",
                  "legalName": "ICONIK LLP",
                  "url": "https://www.iconik.pro",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.iconik.pro/og-image.webp",
                  },
                  "description": "India's scientific personal styling service for women. Using proprietary methodologies — Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™ — Iconik creates personalised Style Blueprints that translate body science into actionable outfit recommendations. Founded in 2024 by Mithil Navalakha, Iconik serves clients across India and the UAE.",
                  "foundingDate": "2024",
                  "founder": {
                    "@type": "Person",
                    "name": "Mithil Navalakha",
                  },
                  "areaServed": ["IN", "AE", "AU"],
                  "serviceType": "Personal Styling",
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "email": "help.iconikfashion@gmail.com",
                    "contactType": "customer service",
                    "availableLanguage": ["English", "Hindi"],
                  },
                  "sameAs": [
                    "https://www.instagram.com/iconik.pro",
                    "https://www.linkedin.com/company/iconik-llp",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://www.iconik.pro/#website",
                  "url": "https://www.iconik.pro",
                  "name": "Iconik",
                  "publisher": { "@id": "https://www.iconik.pro/#organization" },
                },
              ],
            }),
          }}
        />

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
