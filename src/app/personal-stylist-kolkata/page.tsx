import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Kolkata — Iconik Style Blueprint",
  description: "Online personal styling for Kolkata women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations tailored to Kolkata's professional and cultural lifestyle. Delivered in 48 hours.",
  keywords: "personal stylist Kolkata, online personal styling Kolkata, style consultation Kolkata, body type analysis Kolkata, wardrobe consultation Kolkata, personal stylist Salt Lake Kolkata, personal stylist South Kolkata",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-kolkata" },
  openGraph: {
    title: "Personal Stylist in Kolkata — Iconik Style Blueprint",
    description: "Science-backed personal styling for Kolkata women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-kolkata",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Kolkata — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Kolkata — Iconik Style Blueprint",
    description: "Science-backed personal styling for Kolkata women. Blueprint delivered in 48 hours.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Kolkata",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Kolkata" },
      "description": "Online personal styling service for women in Kolkata. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "2499", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Kolkata", "item": "https://www.iconik.pro/personal-stylist-kolkata" },
      ],
    },
  ],
};

export default function KolkataPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Kolkata"
        cityContext="Kolkata's fashion identity is defined by a rich tension between tradition and modernity — high-quality Bengali cottons and silks, a deep appreciation for handloom and craft, and a growing professional wardrobe that needs to hold its own in corporate Sector V and Salt Lake City offices. Whether you are navigating a South Kolkata social gathering, a Durga Puja pandal-hopping circuit, or a formal corporate presentation, your wardrobe needs to work across all of it. Iconik's Style Blueprint builds that clarity — with science-backed body and colour analysis delivered in 48 hours."
        testimonial={{
          name: "Rituparna C., Salt Lake, Kolkata",
          text: "I always invested in good sarees and handlooms but never had a system for the rest of my wardrobe. The Blueprint connected everything — now I know exactly what works and why.",
        }}
      />
    </>
  );
}
