import { MetadataRoute } from "next";
import { indexedSeoPages } from "@/lib/seoContent";

const BASE = "https://www.iconik.pro";

const verifiedLastModified: Record<string, string> = {
  "/colour-analysis/best-colours-dusky-skin": "2026-07-11",
  "/colour-analysis/dark-skin-colour-guide-india": "2026-07-11",
  "/colour-analysis/best-colours-wheatish-skin-india": "2026-07-11",
  "/body-type-styling/how-to-look-taller-clothing": "2026-07-11",
  "/style-guides/modest-professional-fashion-india": "2026-07-11",
  "/personal-stylist-mumbai": "2026-07-11",
  "/faq/how-much-does-personal-stylist-cost-india": "2026-07-11",
};

export default function sitemap(): MetadataRoute.Sitemap {
  return indexedSeoPages.map((entry) => ({
    url: entry.path === "/" ? `${BASE}/` : `${BASE}${entry.path}`,
    ...(verifiedLastModified[entry.path]
      ? { lastModified: new Date(verifiedLastModified[entry.path]) }
      : {}),
    changeFrequency: entry.changeFrequency ?? "monthly",
    priority: entry.priority ?? 0.6,
  }));
}
