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
          "/man/admin",
          "/globe/admin",
          "/man/checkout",
          "/man/intake",
          "/au/checkout",
          "/au/intake",
          "/au/thankyou",
          "/uae/checkout",
          "/uae/oto",
          "/globe/checkout",
          "/globe/intake",
          "/globe/thankyou",
          "/global/checkout",
          "/global/intake",
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
