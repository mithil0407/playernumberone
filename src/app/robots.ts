import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Only truly private surfaces are blocked from crawling. Funnel pages
        // (checkout/intake/thankyou/oto) are intentionally NOT listed: they
        // carry a noindex meta tag, and Google can only see that tag if it is
        // allowed to crawl the page. Blocking them here caused
        // "Indexed, though blocked by robots.txt" in Search Console.
        disallow: [
          "/admin",
          "/dashboard",
          "/closet",
          "/iconik-club/admin",
          "/iconik-club/client",
          "/man/admin",
          "/globe/admin",
          "/stylist/admin",
          "/api/",
        ],
      },
    ],
    sitemap: "https://www.iconik.pro/sitemap.xml",
  };
}
