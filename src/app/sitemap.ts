import { MetadataRoute } from "next";
import { indexedSeoPages } from "@/lib/seoContent";

const BASE = "https://www.iconik.pro";
const LAST_MODIFIED = new Date("2026-06-12");

export default function sitemap(): MetadataRoute.Sitemap {
  return indexedSeoPages.map((entry) => ({
    url: entry.path === "/" ? `${BASE}/` : `${BASE}${entry.path}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: entry.changeFrequency ?? "monthly",
    priority: entry.priority ?? 0.6,
  }));
}
