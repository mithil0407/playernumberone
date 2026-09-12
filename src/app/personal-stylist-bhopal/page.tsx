import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Bhopal — Iconik Style Blueprint",
  description: "Online personal styling for Bhopal women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 20 outfit formulas for Bhopal's professional and traditional lifestyle. Delivered within 5 working days after consultation.",
  keywords: "personal stylist Bhopal, online personal styling Bhopal, style consultation Bhopal, body type analysis Bhopal, wardrobe consultation Bhopal, personal stylist Madhya Pradesh",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-bhopal" },
  openGraph: {
    title: "Personal Stylist in Bhopal — Iconik Style Blueprint",
    description: "Science-backed personal styling for Bhopal women. Blueprint delivered within 5 working days after consultation.",
    url: "https://www.iconik.pro/personal-stylist-bhopal",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Bhopal — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Bhopal — Iconik Style Blueprint",
    description: "Science-backed personal styling for Bhopal women. Blueprint delivered within 5 working days after consultation.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Bhopal",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Bhopal" },
      "description": "Online personal styling service for women in Bhopal. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "2699", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Bhopal", "item": "https://www.iconik.pro/personal-stylist-bhopal" },
      ],
    },
  ],
};

export default function BhopalPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Bhopal"
        cityContext="Bhopal — the City of Lakes — has a distinctive cultural identity shaped by its Nawabi heritage, its role as Madhya Pradesh's administrative capital, and a growing university and professional population. The city's women navigate a wardrobe that spans formal government and corporate professional contexts, the city's celebrated arts and cultural calendar, and traditional occasion wear rooted in Central Indian aesthetics. Iconik's Style Blueprint brings a science-backed colour and silhouette analysis to Bhopal women — so that your everyday professional wardrobe and your festive pieces are built on the same personal foundation. Delivered within 5 working days after consultation."
        testimonial={{
          name: "Meera T., Arera Colony, Bhopal",
          text: "Bhopal has beautiful traditional wear but I never knew what suited me versus what I just liked. The Blueprint told me both — and now my wardrobe finally reflects who I actually am.",
        }}
      />
    </>
  );
}
