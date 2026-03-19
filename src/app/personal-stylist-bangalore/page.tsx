import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Bangalore — Iconik Style Blueprint",
  description: "Online personal styling for Bangalore women. Science-backed Style Blueprint tailored to Bangalore's tech-meets-global work culture. Body analysis, colour palette, and 16+ outfits in 48 hours.",
  keywords: "personal stylist Bangalore, online styling Bangalore, style consultation Bangalore, wardrobe advice Bangalore women",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-bangalore" },
  openGraph: {
    title: "Personal Stylist in Bangalore — Iconik Style Blueprint",
    description: "Science-backed personal styling for Bangalore women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-bangalore",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Bangalore — Iconik" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Bangalore",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Bangalore" },
      "description": "Online personal styling service for women in Bangalore.",
      "offers": { "@type": "Offer", "price": "2499", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Bangalore", "item": "https://www.iconik.pro/personal-stylist-bangalore" },
      ],
    },
  ],
};

export default function BangalorePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Bangalore"
        cityContext="Bangalore's work culture sits at the intersection of tech-global and traditional Indian professional — a unique context where smart casual, business formal, and ethnic wear all coexist in the same week. Iconik's Style Blueprint gives you a science-backed wardrobe system that works across all of these contexts, calibrated to your specific body geometry and colour palette."
        testimonial={{
          name: "Deepa R., Koramangala, Bangalore",
          text: "As a product manager I'm in meetings all day then client dinners at night. The Blueprint gave me a capsule wardrobe logic that works for both without doubling my closet.",
        }}
      />
    </>
  );
}
