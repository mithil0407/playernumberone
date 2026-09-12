import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Vadodara — Iconik Style Blueprint",
  description: "Online personal styling for Vadodara women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 20 outfit formulas for Baroda's cultural and professional lifestyle. Delivered within 5 working days after consultation.",
  keywords: "personal stylist Vadodara, personal stylist Baroda, online personal styling Vadodara, style consultation Baroda, body type analysis Vadodara, wardrobe consultation Vadodara, personal stylist Gujarat",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-vadodara" },
  openGraph: {
    title: "Personal Stylist in Vadodara — Iconik Style Blueprint",
    description: "Science-backed personal styling for Vadodara women. Blueprint delivered within 5 working days after consultation.",
    url: "https://www.iconik.pro/personal-stylist-vadodara",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Vadodara — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Vadodara — Iconik Style Blueprint",
    description: "Science-backed personal styling for Vadodara women. Blueprint delivered within 5 working days after consultation.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Vadodara",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Vadodara" },
      "description": "Online personal styling service for women in Vadodara. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "2699", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Vadodara", "item": "https://www.iconik.pro/personal-stylist-vadodara" },
      ],
    },
  ],
};

export default function VadodaraPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Vadodara"
        cityContext="Vadodara — the cultural capital of Gujarat — is a city with a rich artistic heritage, a strong university and professional community, and a Gujarati aesthetic that prizes fine craftsmanship in patola silk, bandhani, and embroidered chaniya cholis. The city's women blend this vibrant traditional wardrobe with the demands of a modern professional life — Vadodara's industrial and pharmaceutical sectors, and its growing IT corridor, require a capable professional wardrobe alongside the occasion wear calendar. Iconik's Style Blueprint gives Vadodara women the science-backed colour and silhouette analysis to dress well across all of these contexts — delivered within 5 working days after consultation."
        testimonial={{
          name: "Foram P., Alkapuri, Vadodara",
          text: "Vadodara has wonderful traditional wear but I always struggled with my everyday professional wardrobe. The Blueprint gave me a system that works for both — I finally feel put together all the time.",
        }}
      />
    </>
  );
}
