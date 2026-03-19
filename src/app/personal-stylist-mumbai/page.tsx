import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Mumbai — Iconik Style Blueprint",
  description: "Online personal styling for Mumbai women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations tailored to Mumbai's professional and social scene. Delivered in 48 hours.",
  keywords: "personal stylist Mumbai, online personal styling Mumbai, style consultation Mumbai, body type analysis Mumbai, wardrobe consultation Mumbai",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-mumbai" },
  openGraph: {
    title: "Personal Stylist in Mumbai — Iconik Style Blueprint",
    description: "Science-backed personal styling for Mumbai women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-mumbai",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Mumbai — Iconik" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Mumbai",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Mumbai" },
      "description": "Online personal styling service for women in Mumbai. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "2499", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Mumbai", "item": "https://www.iconik.pro/personal-stylist-mumbai" },
      ],
    },
  ],
};

export default function MumbaiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Mumbai"
        cityContext="In Mumbai's fast-paced corporate and social culture, looking polished is not optional — it is expected. Whether you are navigating a boardroom in Bandra Kurla Complex, attending a Juhu gathering, or managing the office-to-dinner transition, your wardrobe needs to work as hard as you do. Iconik's Style Blueprint gives you the science-backed framework to build that wardrobe — in 48 hours, from anywhere in Mumbai."
        testimonial={{
          name: "Priya S., Andheri West, Mumbai",
          text: "I've spent years buying things that looked great in the store and terrible on me. The Blueprint explained exactly why — and gave me a clear system to shop differently. Worth every rupee.",
        }}
      />
    </>
  );
}
