import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Jaipur — Iconik Style Blueprint",
  description: "Online personal styling for Jaipur women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations for Jaipur's professional and traditional lifestyle. Delivered in 48 hours.",
  keywords: "personal stylist Jaipur, online personal styling Jaipur, style consultation Jaipur, body type analysis Jaipur, wardrobe consultation Jaipur, personal stylist Rajasthan",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-jaipur" },
  openGraph: {
    title: "Personal Stylist in Jaipur — Iconik Style Blueprint",
    description: "Science-backed personal styling for Jaipur women. Blueprint delivered in 48 hours.",
    url: "https://www.iconik.pro/personal-stylist-jaipur",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Jaipur — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Jaipur — Iconik Style Blueprint",
    description: "Science-backed personal styling for Jaipur women. Blueprint delivered in 48 hours.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Jaipur",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Jaipur" },
      "description": "Online personal styling service for women in Jaipur. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "3299", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Jaipur", "item": "https://www.iconik.pro/personal-stylist-jaipur" },
      ],
    },
  ],
};

export default function JaipurPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Jaipur"
        cityContext="Jaipur women dress across one of the broadest occasion spectrums in India — from the city's growing IT and hospitality corporate sector to a rich calendar of traditional Rajasthani occasions, weddings, and social events that call for the best of Indian ethnic wear. The Pink City has its own strong aesthetic identity, and the Iconik Style Blueprint is designed to work within it — building a personalised colour and silhouette framework that holds its own in a boardroom and at a Rajput wedding alike."
        testimonial={{
          name: "Sunita R., Vaishali Nagar, Jaipur",
          text: "I have a huge ethnic wardrobe but always felt lost with western wear for work. The Blueprint gave me a system that unified both — and finally explained why some of my favourite pieces never looked quite right.",
        }}
      />
    </>
  );
}
