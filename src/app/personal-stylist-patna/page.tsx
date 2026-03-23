import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Patna — Iconik Style Blueprint",
  description: "Online personal styling for Patna women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations for Patna's professional and Bihari lifestyle. Delivered in 48 hours.",
  keywords: "personal stylist Patna, online personal styling Patna, style consultation Patna, body type analysis Patna, wardrobe consultation Patna, personal stylist Bihar",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-patna" },
  openGraph: {
    title: "Personal Stylist in Patna — Iconik Style Blueprint",
    description: "Science-backed personal styling for Patna women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-patna",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Patna — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Patna — Iconik Style Blueprint",
    description: "Science-backed personal styling for Patna women. Blueprint delivered in 48 hours.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Patna",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Patna" },
      "description": "Online personal styling service for women in Patna. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "2499", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Patna", "item": "https://www.iconik.pro/personal-stylist-patna" },
      ],
    },
  ],
};

export default function PatnaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Patna"
        cityContext="Patna is a city of professionals, aspirations, and a strong cultural identity rooted in Bihari tradition. The city's women balance traditional occasions — Chhath Puja, Teej, and a wedding calendar with some of the most elaborate celebrations in North India — with the demands of a professional and academic career. Patna's rapidly growing economy and young professional population are increasingly style-conscious, but access to personalised styling guidance has historically been limited. Iconik's Style Blueprint brings the science-backed colour and silhouette analysis of a personal stylist to Patna women — delivered in 48 hours, wherever you are in the city."
        testimonial={{
          name: "Priyanka S., Boring Road, Patna",
          text: "I always felt my wardrobe didn't quite work — too much spent, too little that I actually liked on myself. The Blueprint showed me my colours and my silhouettes and it finally made sense. Worth every rupee.",
        }}
      />
    </>
  );
}
