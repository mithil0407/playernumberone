import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/stylist-blueprint/**': [
      './stylistoutfitlibrary.md',
      './src/lib/stylistOutfitLibrary.md',
      './src/lib/womenOutfitRecommendationSkill.md',
    ],
  },
};

export default nextConfig;
