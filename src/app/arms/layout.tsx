import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Dress Heavy Arms — Sleeve Styling Guide for Indian Women",
  description: "Science-backed sleeve and cut guide for Indian women with heavier arms. Learn exactly which silhouettes, sleeve lengths, and fabrics minimise arm width while maximising elegance. 20-outfit Blueprint delivered within 5 working days after the consultation.",
  keywords: "clothes for heavy arms Indian women, how to dress heavy arms, sleeve styles for big arms India, arm-flattering outfits Indian women",
  alternates: {
    canonical: "https://www.iconik.pro/arms",
  },
  openGraph: {
    title: "How to Dress Heavy Arms — Iconik Style Guide",
    description: "Exactly which sleeves, cuts, and fabrics work for heavier arms — backed by Geometric Silhouette Profiling™.",
    url: "https://www.iconik.pro/arms",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Arm styling guide for Indian women — Iconik" }],
  },
};

export default function ArmsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
