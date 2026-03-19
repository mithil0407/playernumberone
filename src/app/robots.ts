import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/checkout",
          "/checkout-monthly",
          "/dashboard",
          "/closet",
          "/iconik-club/admin",
          "/iconik-club/client",
          "/au/checkout",
          "/au/thankyou",
          "/uae/checkout",
          "/globe/checkout",
          "/globe/thankyou",
          "/global/checkout",
          "/global/thankyou",
          "/us/checkout",
          "/monthly/checkout",
          "/monthly/indian/checkout",
          "/checkout/success",
          "/checkout/basic-success",
          "/api/",
        ],
      },
    ],
    sitemap: "https://www.iconik.pro/sitemap.xml",
  };
}
