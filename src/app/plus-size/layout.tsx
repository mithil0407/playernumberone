import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plus Size Styling Guide for Indian Women — Iconik",
  description: "A science-backed plus-size fashion guide built specifically for Indian women. Discover silhouettes, colours, and cuts that celebrate your frame — not hide it. Personalised Blueprint within 5 working days after the consultation.",
  keywords: "plus size styling tips India, plus size Indian women fashion, plus size outfits India, how to dress plus size Indian women, plus size personal stylist India",
  alternates: {
    canonical: "https://www.iconik.pro/plus-size",
  },
  openGraph: {
    title: "Plus Size Styling Guide for Indian Women — Iconik",
    description: "Science-backed silhouettes, colours, and cuts for plus-size Indian women. Personalised Blueprint within 5 working days after the consultation.",
    url: "https://www.iconik.pro/plus-size",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Plus size styling guide for Indian women — Iconik" }],
  },
};

export default function PlusSizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
