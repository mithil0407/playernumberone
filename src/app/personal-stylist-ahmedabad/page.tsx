import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Ahmedabad — Iconik Style Blueprint",
  description: "Online personal styling for Ahmedabad women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations for Ahmedabad's corporate and traditional lifestyle. Delivered in 48 hours.",
  keywords: "personal stylist Ahmedabad, online personal styling Ahmedabad, style consultation Ahmedabad, body type analysis Ahmedabad, wardrobe consultation Ahmedabad, personal stylist SG Highway, personal stylist GIFT City",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-ahmedabad" },
  openGraph: {
    title: "Personal Stylist in Ahmedabad — Iconik Style Blueprint",
    description: "Science-backed personal styling for Ahmedabad women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-ahmedabad",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Ahmedabad — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Ahmedabad — Iconik Style Blueprint",
    description: "Science-backed personal styling for Ahmedabad women. Blueprint delivered in 48 hours.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Ahmedabad",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Ahmedabad" },
      "description": "Online personal styling service for women in Ahmedabad. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "3299", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Ahmedabad", "item": "https://www.iconik.pro/personal-stylist-ahmedabad" },
      ],
    },
  ],
};

export default function AhmedabadPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Ahmedabad"
        cityContext="Ahmedabad women navigate one of the most demanding wardrobe contexts in India — the corporate towers of SG Highway and GIFT City on one side, and a rich calendar of traditional occasions including Navratri, weddings, and family gatherings on the other. Gujarati fashion has a strong, distinct aesthetic, and the Iconik Style Blueprint is designed to work within it — giving you a personalised colour palette and silhouette framework that transitions from boardroom to celebration without compromise."
        testimonial={{
          name: "Meera P., Vastrapur, Ahmedabad",
          text: "I had a wardrobe full of beautiful things that somehow never made a complete outfit. After the Blueprint, I finally understood why — and the recommendations gave me an actual system.",
        }}
      />
    </>
  );
}
