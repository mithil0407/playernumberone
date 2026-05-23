import { MetadataRoute } from "next";
import { seoSitemapPaths } from "@/lib/seoContent";

const BASE = "https://www.iconik.pro";

export default function sitemap(): MetadataRoute.Sitemap {
  return seoSitemapPaths.map((path) => ({
    url: path === "/" ? `${BASE}/` : `${BASE}${path}`,
  }));
}
