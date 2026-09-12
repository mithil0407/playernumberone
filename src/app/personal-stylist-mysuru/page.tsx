import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Mysuru — Iconik Style Blueprint",
  description: "Online personal styling for Mysuru women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 20 outfit formulas for Mysore's cultural and professional lifestyle. Delivered within 5 working days after consultation.",
  keywords: "personal stylist Mysuru, personal stylist Mysore, online personal styling Mysuru, style consultation Mysore, body type analysis Mysuru, wardrobe consultation Mysore, personal stylist Karnataka",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-mysuru" },
  openGraph: {
    title: "Personal Stylist in Mysuru — Iconik Style Blueprint",
    description: "Science-backed personal styling for Mysuru women. Blueprint delivered within 5 working days after consultation.",
    url: "https://www.iconik.pro/personal-stylist-mysuru",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Mysuru — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Mysuru — Iconik Style Blueprint",
    description: "Science-backed personal styling for Mysuru women. Blueprint delivered within 5 working days after consultation.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Mysuru",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Mysuru" },
      "description": "Online personal styling service for women in Mysuru. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "2699", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Mysuru", "item": "https://www.iconik.pro/personal-stylist-mysuru" },
      ],
    },
  ],
};

export default function MysuruPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Mysuru"
        cityContext="Mysuru — the City of Palaces — is a city of culture, heritage, and a quietly style-conscious professional class. The city's women carry a deep appreciation for Mysore silk and the city's own craft traditions, while navigating a wardrobe that spans professional life (Mysuru's growing IT and manufacturing sector), academic life (the city's prominent university community), and the city's famous Dasara celebrations — one of India's most elaborate and best-attended festivals. Iconik's Style Blueprint delivers a personalised colour and silhouette analysis that works for the full range — from your Mysore crepe to your corporate Monday."
        testimonial={{
          name: "Shruthi A., Vijayanagar, Mysuru",
          text: "Mysuru has its own aesthetic and I always wanted my wardrobe to reflect that. The Blueprint helped me find my colours and my silhouettes — now everything I wear feels like it belongs together.",
        }}
      />
    </>
  );
}
