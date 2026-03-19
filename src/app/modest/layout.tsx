import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Modest Fashion for Indian Women — Professional & Elegant",
  description: "Complete modest styling guide for Indian women — covering office wear, ethnic occasions, and everyday looks. Science-backed silhouette analysis tailored to your body and colour palette.",
  keywords: "modest fashion India, modest professional outfits India, office wear Indian women modest, salwar kameez office India, modest styling Indian women",
  alternates: {
    canonical: "https://www.iconik.pro/modest",
  },
  openGraph: {
    title: "Modest Fashion for Indian Women — Iconik",
    description: "Science-backed modest styling — office, ethnic, and everyday looks tailored to your silhouette and colour palette.",
    url: "https://www.iconik.pro/modest",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Modest fashion guide for Indian women — Iconik" }],
  },
};

export default function ModestLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
