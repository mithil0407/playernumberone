import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personal Stylist for Indian Women in Dubai & UAE — Iconik",
  description: "Iconik's personalised Style Blueprint — now serving Indian women in the UAE. Geometric Silhouette Profiling™ and colour analysis tailored to Dubai's professional and social scene. AED 349.",
  keywords: "personal stylist Dubai Indian women, online styling service UAE, modest fashion Dubai, colour analysis Dubai, body type styling UAE, Indian women fashion Dubai",
  alternates: {
    canonical: "https://www.iconik.pro/uae",
    languages: {
      "en-AE": "https://www.iconik.pro/uae",
    },
  },
  openGraph: {
    title: "Personal Stylist for Indian Women in Dubai & UAE — Iconik",
    description: "Science-backed personal styling for Indian women in the UAE. Get your Style Blueprint in 48 hours. AED 349.",
    url: "https://www.iconik.pro/uae",
    locale: "en_AE",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist for Indian women in Dubai — Iconik" }],
  },
};

export default function UAELayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
