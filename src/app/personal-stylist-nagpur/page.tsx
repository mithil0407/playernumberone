import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Nagpur — Iconik Style Blueprint",
  description: "Online personal styling for Nagpur women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations for Nagpur's professional and lifestyle context. Delivered in 48 hours.",
  keywords: "personal stylist Nagpur, online personal styling Nagpur, style consultation Nagpur, body type analysis Nagpur, wardrobe consultation Nagpur",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-nagpur" },
  openGraph: {
    title: "Personal Stylist in Nagpur — Iconik Style Blueprint",
    description: "Science-backed personal styling for Nagpur women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-nagpur",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Nagpur — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Nagpur — Iconik Style Blueprint",
    description: "Science-backed personal styling for Nagpur women. Blueprint delivered in 48 hours.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Nagpur",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Nagpur" },
      "description": "Online personal styling service for women in Nagpur. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "2499", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Nagpur", "item": "https://www.iconik.pro/personal-stylist-nagpur" },
      ],
    },
  ],
};

export default function NagpurPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Nagpur"
        cityContext="As the geographic centre of India and a growing corporate hub — with a significant government and legal professional community alongside expanding private sector offices — Nagpur women navigate wardrobe contexts that span formal professional to traditional Vidarbha occasions. Nagpur's intense summers also make fabric and colour choices more consequential than in many other cities. Iconik's Style Blueprint gives you a personalised colour palette and silhouette framework that works for your climate, your occasions, and your specific body — delivered in 48 hours."
        testimonial={{
          name: "Prachi D., Dharampeth, Nagpur",
          text: "I never had access to a good stylist in Nagpur — the Blueprint filled that gap completely. I finally understand what suits my body and colouring, and shopping feels intentional rather than hit-or-miss.",
        }}
      />
    </>
  );
}
