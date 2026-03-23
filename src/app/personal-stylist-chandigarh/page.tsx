import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Chandigarh — Iconik Style Blueprint",
  description: "Online personal styling for Chandigarh women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations for Chandigarh's style-forward professional lifestyle. Delivered in 48 hours.",
  keywords: "personal stylist Chandigarh, online personal styling Chandigarh, style consultation Chandigarh, body type analysis Chandigarh, wardrobe consultation Chandigarh, personal stylist Punjab",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-chandigarh" },
  openGraph: {
    title: "Personal Stylist in Chandigarh — Iconik Style Blueprint",
    description: "Science-backed personal styling for Chandigarh women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-chandigarh",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Chandigarh — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Chandigarh — Iconik Style Blueprint",
    description: "Science-backed personal styling for Chandigarh women. Blueprint delivered in 48 hours.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Chandigarh",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Chandigarh" },
      "description": "Online personal styling service for women in Chandigarh. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "2499", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Chandigarh", "item": "https://www.iconik.pro/personal-stylist-chandigarh" },
      ],
    },
  ],
};

export default function ChandigarhPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Chandigarh"
        cityContext="Chandigarh consistently ranks among India's most style-conscious cities — and its women dress to match. From Sector 17's boutiques to the city's prominent corporate, medical, and academic professional community, and a wedding season that is among the most lavish in North India, the wardrobe demands are high and varied. Iconik's Style Blueprint gives Chandigarh women a science-backed foundation — your exact colour palette and body type analysis — so that every investment in your wardrobe is a precise one."
        testimonial={{
          name: "Manpreet K., Sector 35, Chandigarh",
          text: "Chandigarh women take their appearance seriously — but I was spending a lot without a system. The Blueprint gave me the system. My wardrobe is half the size and twice as good.",
        }}
      />
    </>
  );
}
