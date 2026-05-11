import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Pune — Iconik Style Blueprint",
  description: "Online personal styling for Pune women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations tailored to Pune's tech-professional and social lifestyle. Delivered in 48 hours.",
  keywords: "personal stylist Pune, online personal styling Pune, style consultation Pune, body type analysis Pune, wardrobe consultation Pune, personal stylist Baner Pune, personal stylist Koregaon Park",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-pune" },
  openGraph: {
    title: "Personal Stylist in Pune — Iconik Style Blueprint",
    description: "Science-backed personal styling for Pune women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-pune",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Pune — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Pune — Iconik Style Blueprint",
    description: "Science-backed personal styling for Pune women. Blueprint delivered in 48 hours.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Pune",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Pune" },
      "description": "Online personal styling service for women in Pune. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "3299", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Pune", "item": "https://www.iconik.pro/personal-stylist-pune" },
      ],
    },
  ],
};

export default function PunePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Pune"
        cityContext="In Pune's booming tech corridors — from Hinjewadi to Baner and Magarpatta — the dress code sits somewhere between Bangalore casual and Mumbai corporate. Pune women navigate MNC offices, weekend brunches in Koregaon Park, and family occasions that span traditional Maharashtrian sensibilities and a cosmopolitan social scene. The Iconik Style Blueprint gives you the science-backed framework to dress with intention across all of these — without building three separate wardrobes."
        testimonial={{
          name: "Aditi K., Baner, Pune",
          text: "I knew what I liked but could never explain why some outfits worked and others didn't. The Blueprint gave me the exact language — and the palette — to shop with actual confidence. Game changer.",
        }}
      />
    </>
  );
}
