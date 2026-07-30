import type { Metadata } from "next";
import { Inter, Playfair_Display, Fraunces, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import MetaPixelProvider from "@/components/MetaPixelProvider";
import { META_PIXEL_ID } from "@/lib/metaPixel";
import {
  ACTIVE_PUBLIC_MARKETS,
  BLUEPRINT_OFFER,
  BUSINESS_HOURS,
  CLIENT_PROOF,
  FOUNDERS,
  GOOGLE_BUSINESS_PROFILE_URL,
  INSTAGRAM_URL,
  LEGAL_ENTITY_NAME,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP_E164,
} from "@/lib/siteFacts";
import "./globals.css";

const GA_MEASUREMENT_IDS = Array.from(new Set([
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  "G-LHX425PH4B",
  "G-V4126JH4EJ",
  "G-94CVS6PDTF",
].filter((id): id is string => Boolean(id))));

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

const fraunces = Fraunces({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-fraunces',
  fallback: ['Georgia', 'serif'],
  axes: ['opsz'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  fallback: ['monospace'],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.iconik.pro"),
  title: {
    default: "Iconik — Scientific Personal Styling for Indian Women",
    template: "%s",
  },
  description: `India's scientific personal styling service. Get 20 personalised outfit formulas, colour, hairstyle and eyewear guidance, plus a 30-minute consultation. Delivered within ${BLUEPRINT_OFFER.deliveryWorkingDays} working days after the consultation.`,
  keywords: "personal stylist India, online personal styling India, body type styling India, colour analysis Indian skin tone, style blueprint India, personal stylist online, Indian women fashion",
  authors: [{ name: "Iconik Styling Team", url: "https://www.iconik.pro" }],
  creator: LEGAL_ENTITY_NAME,
  publisher: LEGAL_ENTITY_NAME,
  alternates: {
    canonical: "https://www.iconik.pro",
  },
  openGraph: {
    title: "Iconik — Scientific Personal Styling for Indian Women",
    description: `India's scientific personal styling service. Get 20 personalised outfit formulas and a 30-minute stylist consultation, delivered within ${BLUEPRINT_OFFER.deliveryWorkingDays} working days after the consultation.`,
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
    description: `India's scientific personal styling service. Get your personalised ICONIK Blueprint within ${BLUEPRINT_OFFER.deliveryWorkingDays} working days after the consultation.`,
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
        <meta httpEquiv="Permissions-Policy" content="payment=*" />
        {/* Meta Pixel + Signals Gateway. PageView is owned by MetaPixelProvider. */}
        <Script id="meta-signals-gateway" strategy="beforeInteractive">
          {`
            (function () {
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              window.fbq('set', 'autoConfig', false, '${META_PIXEL_ID}');
              window.fbq('init', '${META_PIXEL_ID}', {});

              function assign(target) {
                for (var i = 1; i < arguments.length; i++) {
                  var source = arguments[i];
                  if (source) {
                    for (var key in source) {
                      if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
                    }
                  }
                }
                return target;
              }

              !(function(f,b,e,v,n,nn,tt,ss){
                if (!f.cbq) {
                  nn = f.cbq = function(){
                    nn.initialized ? nn.apply(f.cbq, arguments) : nn.queue.push(arguments);
                  };
                  if (!f._cbq) f._cbq = nn;
                  nn.push = nn;
                  nn.loaded = !0;
                  nn.version = '2.0';
                  nn.queue = [];
                  tt = b.createElement(e);
                  tt.async = !0;
                  tt.src = v;
                  ss = b.getElementsByTagName(e)[0];
                  ss.parentNode.insertBefore(tt, ss);
                }
                if (f.xbq) return;
                if (f.fbq) f.xbq = f.fbq;
                n = f.fbq = function(){
                  var args = Array.prototype.slice.call(arguments);
                  var method = args[0];
                  var isTrack = method === 'track' || method === 'trackCustom';
                  var isSingle = method === 'trackSingle' || method === 'trackSingleCustom';
                  var eventId = args[isTrack ? 1 : 2] + '.' + Date.now() + Math.random().toString(36);
                  if (isTrack && args.length < 4) {
                    arguments = args.concat(args.length < 3 ? [{}, { eventID: eventId }] : [{ eventID: eventId }]);
                  } else if (isSingle && arguments.length < 5) {
                    arguments = args.concat(args.length < 4 ? [{}, { eventID: eventId }] : [{ eventID: eventId }]);
                  }
                  if (isTrack && (!arguments[3] || !arguments[3].eventID)) {
                    arguments[3] = assign({}, arguments[3] || {}, { eventID: eventId });
                  }
                  if (isSingle && (!arguments[4] || !arguments[4].eventID)) {
                    arguments[4] = assign({}, arguments[4] || {}, { eventID: eventId });
                  }
                  var metaContext = method === 'track' && arguments[1] === 'PageView'
                    ? { allowDuplicatePageViews: true }
                    : n;
                  if (n.callMethod) {
                    n.callMethod.apply(metaContext, arguments);
                  } else if (f.xbq && f.xbq.callMethod) {
                    // The Meta SDK can attach callMethod to the original fbq
                    // captured before the Signals bridge replaced window.fbq.
                    // Dispatch there so client-navigation event IDs are not
                    // rewritten while waiting in the bridge queue.
                    f.xbq.callMethod.apply(metaContext, arguments);
                  } else {
                    n.queue.push(arguments);
                  }
                  if (typeof method === 'string' && method.indexOf('track') === 0) {
                    if (isSingle) {
                      var newArgs = [arguments[0] === 'trackSingle' ? 'track' : 'trackCustom'];
                      for (var i = 2; i < arguments.length; i++) newArgs.push(arguments[i]);
                      arguments = newArgs;
                    }
                    if (arguments[1]) {
                      f.cbq.initialized ? f.cbq.apply(f.cbq, arguments) : f.cbq.queue.push(arguments);
                    }
                  }
                };
                if (!f._fbq) f._fbq = n;
                n.push = n;
                n.loaded = !0;
                n.version = '2.0';
                n.queue = f.xbq ? f.xbq.queue : [];
              })(window, document, 'script', 'https://connect.iconik.pro/sdk/5610545609651043442/events.js');

              window.fbq.disablePushState = true;
              if (window.xbq) {
                window.xbq.disablePushState = true;
              }
              window.cbq('setHost', 'https://connect.iconik.pro/');
              window.cbq('init', '5610545609651043442');
              window.cbq('set', 'integrationMethod', 'forkFromSnippetCode@1.0');
            })();
          `}
        </Script>
      </head>
      <body className={`${inter.variable} ${playfair.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${inter.className}`}>
        {/* Google Analytics — single gtag init shared across both properties */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_IDS[0]}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            ${GA_MEASUREMENT_IDS.map((id) => `gtag('config', '${id}');`).join("\n            ")}
          `}
        </Script>

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
                  "legalName": LEGAL_ENTITY_NAME,
                  "url": "https://www.iconik.pro",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.iconik.pro/og-image.webp",
                  },
                  "description": `Scientific personal styling for women and men. ICONIK has served ${CLIENT_PROOF.totalClients.toLocaleString("en-IN")}+ clients across ${CLIENT_PROOF.countriesServed}+ countries with personalised colour, silhouette, facial-architecture and outfit guidance.`,
                  "founder": FOUNDERS.map((founder) => ({
                    "@type": "Person",
                    "name": founder.name,
                    "jobTitle": founder.title,
                    "sameAs": founder.linkedIn,
                  })),
                  "areaServed": ACTIVE_PUBLIC_MARKETS,
                  "serviceType": "Personal Styling",
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "email": SUPPORT_EMAIL,
                    "telephone": SUPPORT_WHATSAPP_E164,
                    "contactType": "customer service",
                    "availableLanguage": ["English", "Hindi"],
                    "hoursAvailable": {
                      "@type": "OpeningHoursSpecification",
                      "dayOfWeek": BUSINESS_HOURS.days,
                      "opens": BUSINESS_HOURS.opens,
                      "closes": BUSINESS_HOURS.closes,
                    },
                  },
                  "sameAs": [
                    INSTAGRAM_URL,
                    "https://www.instagram.com/iconik.men/",
                    "https://www.linkedin.com/company/iconik-llp",
                    GOOGLE_BUSINESS_PROFILE_URL,
                    ...FOUNDERS.map((founder) => founder.linkedIn),
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
