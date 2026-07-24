import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Surat — Iconik Style Blueprint",
  description: "Online personal styling for Surat women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 20 outfit formulas for Surat's business and social lifestyle. Delivered within 5 working days after consultation.",
  keywords: "personal stylist Surat, online personal styling Surat, style consultation Surat, body type analysis Surat, wardrobe consultation Surat, personal stylist Gujarat Surat",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-surat" },
  openGraph: {
    title: "Personal Stylist in Surat — Iconik Style Blueprint",
    description: "Science-backed personal styling for Surat women. Blueprint delivered within 5 working days after consultation.",
    url: "https://www.iconik.pro/personal-stylist-surat",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Surat — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Surat — Iconik Style Blueprint",
    description: "Science-backed personal styling for Surat women. Blueprint delivered within 5 working days after consultation.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Surat",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Surat" },
      "description": "Online personal styling service for women in Surat. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "2699", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Surat", "item": "https://www.iconik.pro/personal-stylist-surat" },
      ],
    },
  ],
};

export default function SuratPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Surat"
        cityContext="As India's textile capital and one of its fastest-growing business cities, Surat women have extraordinary access to fabric and ethnic wear — and an equally demanding wardrobe context that spans corporate offices in Athwalines and Vesu, Gujarati social occasions, and a wedding season that is among the most vibrant in the country. Iconik's Style Blueprint gives you the personalised colour and silhouette framework to make confident decisions across all of it — within 5 working days after consultation, from anywhere in Surat."
        testimonial={{
          name: "Hetal S., Vesu, Surat",
          text: "Living in Surat means I'm surrounded by gorgeous fabrics but I never knew which colours and cuts actually suited me. The Blueprint answered both questions clearly — best investment I've made in my wardrobe.",
        }}
      />
    </>
  );
}
