import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Visakhapatnam — Iconik Style Blueprint",
  description: "Online personal styling for Visakhapatnam women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations for Vizag's professional and coastal lifestyle. Delivered in 48 hours.",
  keywords: "personal stylist Visakhapatnam, personal stylist Vizag, online personal styling Visakhapatnam, style consultation Vizag, body type analysis Visakhapatnam, wardrobe consultation Vizag, personal stylist Andhra Pradesh",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-visakhapatnam" },
  openGraph: {
    title: "Personal Stylist in Visakhapatnam — Iconik Style Blueprint",
    description: "Science-backed personal styling for Visakhapatnam women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-visakhapatnam",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Visakhapatnam — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Visakhapatnam — Iconik Style Blueprint",
    description: "Science-backed personal styling for Visakhapatnam women. Blueprint delivered in 48 hours.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Visakhapatnam",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Visakhapatnam" },
      "description": "Online personal styling service for women in Visakhapatnam. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "3299", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Visakhapatnam", "item": "https://www.iconik.pro/personal-stylist-visakhapatnam" },
      ],
    },
  ],
};

export default function VisakhapatnamPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Visakhapatnam"
        cityContext="Vizag is one of India's fastest-growing cities — a major naval and port hub, a growing IT corridor, and a coastal city with a distinctive lifestyle that blends Telugu tradition with a modern professional culture. The city's women navigate both: sarees and occasion wear for Ugadi and Sankranti celebrations, and professional wardrobes for the expanding corporate and defence sector. Iconik's Style Blueprint gives Vizag women a science-backed personal colour and silhouette analysis — so that every piece in your wardrobe, whether traditional or contemporary, is a deliberate, flattering choice."
        testimonial={{
          name: "Anitha R., MVP Colony, Visakhapatnam",
          text: "I was spending a lot on clothes but never had a system. The Blueprint gave me my exact colours and what silhouettes suit my body — I now dress intentionally and everything I own gets worn.",
        }}
      />
    </>
  );
}
