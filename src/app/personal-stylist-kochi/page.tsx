import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Kochi — Iconik Style Blueprint",
  description: "Online personal styling for Kochi women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations for Kochi's professional and lifestyle context. Delivered in 48 hours.",
  keywords: "personal stylist Kochi, online personal styling Kochi, style consultation Kochi, body type analysis Kochi, wardrobe consultation Kochi, personal stylist Cochin, personal stylist Kerala",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-kochi" },
  openGraph: {
    title: "Personal Stylist in Kochi — Iconik Style Blueprint",
    description: "Science-backed personal styling for Kochi women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-kochi",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Kochi — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Kochi — Iconik Style Blueprint",
    description: "Science-backed personal styling for Kochi women. Blueprint delivered in 48 hours.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Kochi",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Kochi" },
      "description": "Online personal styling service for women in Kochi. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "3299", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Kochi", "item": "https://www.iconik.pro/personal-stylist-kochi" },
      ],
    },
  ],
};

export default function KochiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Kochi"
        cityContext="Kochi's women navigate a distinctive wardrobe context — a city that blends a thriving corporate and startup scene with a deep appreciation for Kerala's textile traditions, including kasavu sarees and the elegant minimalism of traditional Kerala dress. Whether you are in Infopark's tech offices, Marine Drive's social scene, or preparing for a Kerala wedding, your wardrobe needs to work across both worlds. Iconik's Style Blueprint gives you the science-backed colour and silhouette framework to do exactly that — delivered in 48 hours."
        testimonial={{
          name: "Lakshmi N., Edapally, Kochi",
          text: "I always struggled to balance my professional wardrobe with my love for traditional Kerala wear. The Blueprint gave me a single colour framework that works for both — I shop with so much more confidence now.",
        }}
      />
    </>
  );
}
