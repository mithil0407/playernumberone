import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Lucknow — Iconik Style Blueprint",
  description: "Online personal styling for Lucknow women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 20 outfit formulas for Lucknow's professional and nawabi lifestyle. Delivered within 5 working days after consultation.",
  keywords: "personal stylist Lucknow, online personal styling Lucknow, style consultation Lucknow, body type analysis Lucknow, wardrobe consultation Lucknow, personal stylist Uttar Pradesh",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-lucknow" },
  openGraph: {
    title: "Personal Stylist in Lucknow — Iconik Style Blueprint",
    description: "Science-backed personal styling for Lucknow women. Blueprint delivered within 5 working days after consultation.",
    url: "https://www.iconik.pro/personal-stylist-lucknow",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Lucknow — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Lucknow — Iconik Style Blueprint",
    description: "Science-backed personal styling for Lucknow women. Blueprint delivered within 5 working days after consultation.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Lucknow",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Lucknow" },
      "description": "Online personal styling service for women in Lucknow. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "2699", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Lucknow", "item": "https://www.iconik.pro/personal-stylist-lucknow" },
      ],
    },
  ],
};

export default function LucknowPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Lucknow"
        cityContext="Lucknow's identity is inseparable from its refined aesthetic heritage — chikankari embroidery, the tehzeeb of Nawabi elegance, and a deep appreciation for quality ethnic wear. Today's Lucknow woman carries that sensibility into a modern wardrobe that also needs to perform in Gomti Nagar's corporate offices and the city's active social calendar. Iconik's Style Blueprint gives you the science-backed framework to honour both — a personalised colour and silhouette analysis that works for your chikankari collection and your boardroom wardrobe alike."
        testimonial={{
          name: "Nandini V., Gomti Nagar, Lucknow",
          text: "Lucknow has a very particular aesthetic and I always felt my western wardrobe didn't fit. The Blueprint helped me see that the two wardrobes actually share a colour system — it completely changed how I dress.",
        }}
      />
    </>
  );
}
