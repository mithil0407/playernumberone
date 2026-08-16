import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/**",
      },
    ],
  },
  compress: true,
  outputFileTracingIncludes: {
    '/api/stylist-blueprint/**': [
      './stylistoutfitlibrary.md',
      './outfitlibrarywomen.md',
      './src/lib/stylistOutfitLibrary.md',
      './src/lib/womenOutfitRecommendationSkill.md',
    ],
  },
  async headers() {
    return [
      {
        source: "/stylist/report/:shareToken",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
      {
        source: "/(:path*\\.webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(:path*\\.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    const retiredCityRedirects = [
      "/personal-stylist-ahmedabad",
      "/personal-stylist-bhopal",
      "/personal-stylist-chandigarh",
      "/personal-stylist-coimbatore",
      "/personal-stylist-indore",
      "/personal-stylist-jaipur",
      "/personal-stylist-kochi",
      "/personal-stylist-kolkata",
      "/personal-stylist-lucknow",
      "/personal-stylist-mysuru",
      "/personal-stylist-nagpur",
      "/personal-stylist-patna",
      "/personal-stylist-surat",
      "/personal-stylist-thiruvananthapuram",
      "/personal-stylist-vadodara",
      "/personal-stylist-visakhapatnam",
    ].map((source) => ({
      source,
      destination: "/personal-stylist-india",
      permanent: true,
    }));

    return [
      ...retiredCityRedirects,
      {
        source: "/blog/what-is-geometric-silhouette-profiling",
        destination: "/methodology/geometric-silhouette-profiling",
        permanent: true,
      },
      {
        source: "/blog/what-is-chromatic-harmony-mapping",
        destination: "/methodology/chromatic-harmony-mapping",
        permanent: true,
      },
      {
        source: "/blog/what-is-facial-architecture-analysis",
        destination: "/methodology/facial-architecture-analysis",
        permanent: true,
      },
      ...["/uae", "/au", "/us", "/global"].map((source) => ({
        source,
        destination: "/globe",
        permanent: true,
      })),
      {
        source: "/body-type-styling/apple",
        destination: "/body-type-styling/apple-body-shape-india",
        permanent: true,
      },
      {
        source: "/body-type-styling/pear",
        destination: "/body-type-styling/pear-body-shape-india",
        permanent: true,
      },
      {
        source: "/body-type-styling/rectangle",
        destination: "/body-type-styling/rectangle-body-shape-india",
        permanent: true,
      },
      {
        source: "/body-type-styling/rectangle-india",
        destination: "/body-type-styling/rectangle-body-shape-india",
        permanent: true,
      },
      {
        source: "/body-type-styling/hourglass-india",
        destination: "/body-type-styling/hourglass",
        permanent: true,
      },
      {
        source: "/body-type-styling/plus-size-india",
        destination: "/body-type-styling/plus-size",
        permanent: true,
      },
      {
        source: "/arms",
        destination: "/body-type-styling/heavy-arms-styling",
        permanent: true,
      },
      {
        source: "/tummy",
        destination: "/body-type-styling/how-to-dress-tummy",
        permanent: true,
      },
      {
        source: "/plus-size",
        destination: "/body-type-styling/plus-size",
        permanent: true,
      },
      {
        source: "/modest",
        destination: "/style-guides/modest-professional-fashion-india",
        permanent: true,
      },
      {
        source: "/iconik-methodology",
        destination: "/methodology",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
