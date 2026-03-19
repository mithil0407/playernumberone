import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Dress to Hide Tummy Fat — Indian Women's Style Guide",
  description: "Practical, science-backed guide to dressing a fuller midsection. Discover which cuts, fabrics, and draping techniques create a defined waist — without shapewear. Personalised Blueprint in 48 hours.",
  keywords: "how to hide tummy fat with clothing India, what to wear if you have a tummy India, clothes for fuller midsection Indian women, how to look slim in Indian clothes",
  alternates: {
    canonical: "https://www.iconik.pro/tummy",
  },
  openGraph: {
    title: "How to Dress to Hide Tummy Fat — Iconik Style Guide",
    description: "Science-backed cuts and draping to create a defined waist. Personalised Blueprint in 48 hours.",
    url: "https://www.iconik.pro/tummy",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Tummy styling guide for Indian women — Iconik" }],
  },
};

export default function TummyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
