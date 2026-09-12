import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Hyderabad — Iconik Style Blueprint",
  description: "Online personal styling for Hyderabad women. Science-backed Style Blueprint — body analysis, colour palette, and 20 outfit formulas. Delivered within 5 working days after consultation.",
  keywords: "personal stylist Hyderabad, online styling Hyderabad, style consultation Hyderabad, wardrobe advice Hyderabad women",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-hyderabad" },
  openGraph: {
    title: "Personal Stylist in Hyderabad — Iconik Style Blueprint",
    description: "Science-backed personal styling for Hyderabad women. Blueprint delivered within 5 working days after consultation.",
    url: "https://www.iconik.pro/personal-stylist-hyderabad",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Hyderabad — Iconik" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Hyderabad",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Hyderabad" },
      "description": "Online personal styling service for women in Hyderabad.",
      "offers": { "@type": "Offer", "price": "2699", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Hyderabad", "item": "https://www.iconik.pro/personal-stylist-hyderabad" },
      ],
    },
  ],
};

export default function HyderabadPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Hyderabad"
        cityContext="Hyderabad's professional women navigate a unique blend of tech-sector corporate culture and a rich tradition of formal ethnic occasions — from Hyderabadi weddings to corporate events. Iconik's Style Blueprint gives you the science-backed wardrobe framework to dress confidently across all of these contexts, based on your specific body analysis and colour palette."
        testimonial={{
          name: "Kavita S., Banjara Hills, Hyderabad",
          text: "I finally understand why certain shapes work for my body type. The Blueprint changed how I shop completely.",
        }}
      />
    </>
  );
}
