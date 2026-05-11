import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Chennai — Iconik Style Blueprint",
  description: "Online personal styling for Chennai women. Science-backed Style Blueprint — body analysis, colour palette calibrated for South Indian skin tones, and 16+ outfit recommendations. Delivered in 48 hours.",
  keywords: "personal stylist Chennai, online styling Chennai, style consultation Chennai, wardrobe advice Chennai women, body type styling Chennai",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-chennai" },
  openGraph: {
    title: "Personal Stylist in Chennai — Iconik Style Blueprint",
    description: "Science-backed personal styling for Chennai women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-chennai",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Chennai — Iconik" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Chennai",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Chennai" },
      "description": "Online personal styling service for women in Chennai.",
      "offers": { "@type": "Offer", "price": "3299", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Chennai", "item": "https://www.iconik.pro/personal-stylist-chennai" },
      ],
    },
  ],
};

export default function ChennaiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Chennai"
        cityContext="Chennai women carry a distinct style sensibility — deeply rooted in traditional South Indian aesthetics while equally at home in professional corporate environments. Iconik's Chromatic Harmony Mapping™ was calibrated specifically for the full range of South Indian skin tones, meaning your colour palette recommendation accounts for the specific undertone diversity that Chennai women carry. Your Blueprint is not generic Indian styling advice — it is built for your specific frame and complexion."
        testimonial={{
          name: "Meera P., Adyar, Chennai",
          text: "The colour palette was a revelation. I'd been avoiding colours I actually love because I thought they didn't suit me. The Blueprint showed me exactly which shades of those colours work — and why.",
        }}
      />
    </>
  );
}
