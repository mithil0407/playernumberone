import type { Metadata } from "next";
import CityLandingPage from "@/components/CityLandingPage";

export const metadata: Metadata = {
  title: "Personal Stylist in Thiruvananthapuram — Iconik Style Blueprint",
  description: "Online personal styling for Thiruvananthapuram women. Iconik's science-backed Style Blueprint — body analysis, colour palette, and 20 outfit formulas for Trivandrum's professional and Kerala lifestyle. Delivered within 5 working days after consultation.",
  keywords: "personal stylist Thiruvananthapuram, personal stylist Trivandrum, online personal styling Thiruvananthapuram, style consultation Trivandrum, body type analysis Thiruvananthapuram, wardrobe consultation Kerala capital",
  alternates: { canonical: "https://www.iconik.pro/personal-stylist-thiruvananthapuram" },
  openGraph: {
    title: "Personal Stylist in Thiruvananthapuram — Iconik Style Blueprint",
    description: "Science-backed personal styling for Thiruvananthapuram women. Blueprint delivered within 5 working days after consultation.",
    url: "https://www.iconik.pro/personal-stylist-thiruvananthapuram",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist in Thiruvananthapuram — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Personal Stylist in Thiruvananthapuram — Iconik Style Blueprint",
    description: "Science-backed personal styling for Thiruvananthapuram women. Blueprint delivered within 5 working days after consultation.",
    images: ["/og-image.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "name": "Iconik Style Blueprint — Thiruvananthapuram",
      "provider": { "@type": "Organization", "name": "Iconik" },
      "areaServed": { "@type": "City", "name": "Thiruvananthapuram" },
      "description": "Online personal styling service for women in Thiruvananthapuram. Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
      "offers": { "@type": "Offer", "price": "2699", "priceCurrency": "INR" },
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
        { "@type": "ListItem", "position": 2, "name": "Personal Stylist in Thiruvananthapuram", "item": "https://www.iconik.pro/personal-stylist-thiruvananthapuram" },
      ],
    },
  ],
};

export default function ThiruvananthapuramPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CityLandingPage
        city="Thiruvananthapuram"
        cityContext="Thiruvananthapuram — Kerala's capital — is a city of governance, defence, space research, and a sophisticated professional class with a distinctly Kerala sensibility. The city's women carry a strong cultural identity: Kasavu sarees for Onam and temple occasions, a growing Western professional wardrobe for the city's expanding IT and defence sectors, and a climate that demands fabrics that work in the heat. Iconik's Style Blueprint delivers a personalised colour and silhouette analysis that bridges all of these — so that your Kerala silk and your corporate wardrobe are built on the same science-backed personal foundation."
        testimonial={{
          name: "Sreelakshmi N., Kowdiar, Thiruvananthapuram",
          text: "I knew Kerala fabrics well but didn't know which colours and cuts suited me specifically. The Blueprint gave me exactly that — now I shop with confidence and wear everything I own.",
        }}
      />
    </>
  );
}
