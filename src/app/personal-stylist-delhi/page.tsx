import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Delhi — Iconik Style Blueprint",
  description: "Online personal styling for Delhi women. Science-backed Style Blueprint covering body analysis, colour palette, and 16+ outfit recommendations. Tailored to Delhi's professional and social scene. Delivered in 48 hours.",
  keywords: "personal stylist Delhi, online styling Delhi, style consultation Delhi NCR, wardrobe consultation Delhi women",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-delhi" },
  openGraph: {
    title: "Personal Stylist in Delhi — Iconik Style Blueprint",
    description: "Science-backed personal styling for Delhi women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-delhi",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Delhi — Iconik" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Delhi",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Delhi" },
      "description": "Online personal styling service for women in Delhi NCR.",
      "offers": { "@type": "Offer", "price": "2499", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Delhi", "item": "https://www.iconik.pro/personal-stylist-delhi" },
      ],
    },
  ],
};

export default function DelhiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Delhi"
        cityContext="Delhi women navigate one of the most style-conscious cities in India — from government and corporate circles to weddings, social events, and cultural occasions that demand versatility. Iconik's Style Blueprint builds you a wardrobe logic that handles all of it: a science-backed system based on your body geometry and colour palette, not on what's trending this season."
        testimonial={{
          name: "Neha M., South Delhi",
          text: "I kept buying clothes that looked perfect on the mannequin and wrong on me. The Blueprint told me exactly why — and now I shop in half the time with twice the results.",
        }}
      />
    </>
  );
}
