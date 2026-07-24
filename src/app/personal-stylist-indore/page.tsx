import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Indore — Iconik Style Blueprint",
  description: "Online personal styling for Indore women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 20 outfit formulas for Indore's professional and traditional lifestyle. Delivered within 5 working days after consultation.",
  keywords: "personal stylist Indore, online personal styling Indore, style consultation Indore, body type analysis Indore, wardrobe consultation Indore, personal stylist Madhya Pradesh",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-indore" },
  openGraph: {
    title: "Personal Stylist in Indore — Iconik Style Blueprint",
    description: "Science-backed personal styling for Indore women. Blueprint delivered within 5 working days after consultation.",
    url: "https://www.iconik.pro/personal-stylist-indore",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Indore — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Indore — Iconik Style Blueprint",
    description: "Science-backed personal styling for Indore women. Blueprint delivered within 5 working days after consultation.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Indore",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Indore" },
      "description": "Online personal styling service for women in Indore. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "2699", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Indore", "item": "https://www.iconik.pro/personal-stylist-indore" },
      ],
    },
  ],
};

export default function IndorePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Indore"
        cityContext="Indore's rapid growth into one of India's cleanest and most liveable cities has brought a professional class that is increasingly style-conscious — while the city retains a strong traditional Malwi culture and a vibrant social calendar. Whether you are working in Indore's expanding IT corridor, managing a business, or preparing for the city's celebrated wedding and festival season, your wardrobe needs to bridge both worlds. Iconik's Style Blueprint delivers a personalised framework for both — within 5 working days after consultation, from anywhere in Indore."
        testimonial={{
          name: "Shruti J., Vijay Nagar, Indore",
          text: "Indore has good shopping but I never knew what to actually buy. The Blueprint gave me my exact colours and silhouettes — now I spend less and wear everything I own.",
        }}
      />
    </>
  );
}
