import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Online Personal Stylist in Mumbai for Women",
  description:
    "Personal styling for Mumbai women, delivered online: body proportions, Indian skin-tone colour analysis, face-shape guidance and repeatable work, social and occasion outfits.",
  path: "/personal-stylist-mumbai",
  keywords: [
    "personal stylist Mumbai",
    "online personal stylist Mumbai",
    "style consultation Mumbai",
    "wardrobe consultation Mumbai",
  ],
});

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Mumbai",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Mumbai" },
      "description": "Online personal styling service for women in Mumbai. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "3299", "priceCurrency": "INR" },
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
      />
    </>
  );
}
