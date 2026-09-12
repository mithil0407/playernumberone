import { MetadataRoute } from "next";
import { indexedSeoPages } from "@/lib/seoContent";

const BASE = "https://www.iconik.pro";

const verifiedLastModified: Record<string, string> = {
  "/blog": "2026-07-24",
  "/methodology": "2026-07-24",
  "/methodology/geometric-silhouette-profiling": "2026-07-24",
  "/methodology/chromatic-harmony-mapping": "2026-07-24",
  "/methodology/facial-architecture-analysis": "2026-07-24",
  "/colour-analysis": "2026-07-24",
  "/colour-analysis/how-to-find-undertone": "2026-07-24",
  "/colour-analysis/indian-skin-tones": "2026-07-24",
  "/colour-analysis/seasonal-colour-analysis-india": "2026-07-24",
  "/body-type-styling": "2026-07-24",
  "/body-type-styling/apple-body-shape-india": "2026-07-24",
  "/body-type-styling/pear-body-shape-india": "2026-07-24",
  "/style-guides": "2026-07-24",
  "/style-guides/capsule-wardrobe-india": "2026-07-24",
  "/style-guides/kurti-length-guide": "2026-07-24",
  "/colour-analysis/best-colours-dusky-skin": "2026-07-11",
  "/colour-analysis/dark-skin-colour-guide-india": "2026-07-11",
  "/colour-analysis/best-colours-wheatish-skin-india": "2026-07-11",
  "/body-type-styling/how-to-look-taller-clothing": "2026-07-24",
  "/style-guides/modest-professional-fashion-india": "2026-07-11",
  "/personal-stylist-mumbai": "2026-07-24",
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
