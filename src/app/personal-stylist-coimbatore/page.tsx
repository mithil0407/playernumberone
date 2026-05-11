import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Coimbatore — Iconik Style Blueprint",
  description: "Online personal styling for Coimbatore women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations for Coimbatore's professional and traditional lifestyle. Delivered in 48 hours.",
  keywords: "personal stylist Coimbatore, online personal styling Coimbatore, style consultation Coimbatore, body type analysis Coimbatore, wardrobe consultation Coimbatore, personal stylist Tamil Nadu",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-coimbatore" },
  openGraph: {
    title: "Personal Stylist in Coimbatore — Iconik Style Blueprint",
    description: "Science-backed personal styling for Coimbatore women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-coimbatore",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Coimbatore — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Coimbatore — Iconik Style Blueprint",
    description: "Science-backed personal styling for Coimbatore women. Blueprint delivered in 48 hours.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Coimbatore",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Coimbatore" },
      "description": "Online personal styling service for women in Coimbatore. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "3299", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Coimbatore", "item": "https://www.iconik.pro/personal-stylist-coimbatore" },
      ],
    },
  ],
};

export default function CoimbatorePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Coimbatore"
        cityContext="Coimbatore — the Manchester of South India — is a city of industrialists, entrepreneurs, and an educated professional class with a deep appreciation for quality and value. The city's women balance a strong Kongu cultural tradition (silk sarees, temple jewellery, Tamil festival occasions) with an increasingly modern professional wardrobe. Coimbatore's climate, warmer than Chennai for much of the year, also makes fabric choice consequential. Iconik's Style Blueprint delivers a personalised colour and silhouette analysis that works for both your Pongal silk and your boardroom wardrobe — in 48 hours, from anywhere in Coimbatore."
        testimonial={{
          name: "Kavitha S., RS Puram, Coimbatore",
          text: "I always shopped well but without direction. The Blueprint finally told me exactly which colours work for my skin and which silhouettes suit my body. My sarees and my work clothes now make sense together.",
        }}
      />
    </>
  );
}
