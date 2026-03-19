import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Online Personal Stylist for Indian Women in Australia — Iconik",
  description: "Iconik's personalised Style Blueprint — now available for Indian women in Australia. Science-backed body analysis, colour palette, and 16+ outfit recommendations. Delivered in 48 hours.",
  keywords: "personal stylist Indian women Australia, online styling India diaspora Australia, body type styling Australia, colour analysis Indian skin Australia",
  alternates: {
    canonical: "https://www.iconik.pro/au",
    languages: {
      "en-AU": "https://www.iconik.pro/au",
    },
  },
  openGraph: {
    title: "Online Personal Stylist for Indian Women in Australia — Iconik",
    description: "Science-backed personal styling for Indian women in Australia. Style Blueprint in 48 hours.",
    url: "https://www.iconik.pro/au",
    locale: "en_AU",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Personal stylist for Indian women in Australia — Iconik" }],
  },
};

export default function AULayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
