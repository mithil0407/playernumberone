import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { comparisonLinks, faqLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Personal Shopper vs Personal Stylist India",
  description:
    "A comparison page explaining the difference between a personal shopper and a personal stylist in India, and when each makes sense.",
  path: "/personal-shopper-vs-personal-stylist-india",
});

export default function PersonalShopperVsStylistIndiaPage() {
  return (
    <ServiceInfoPage
      title="Personal Shopper vs Personal Stylist in India"
      summary="A personal shopper helps you buy. A personal stylist helps you decide what is worth buying in the first place. In practice, many users need the second before they pay for the first."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Personal Shopper vs Personal Stylist India", href: "/personal-shopper-vs-personal-stylist-india" },
      ]}
      entityNote="Iconik is positioned on the strategy side of the category: it aims to build the user's decision framework before any shopping assistance layer is added."
      sections={[
        {
          title: "What a Personal Shopper Does",
          bullets: [
            "Finds items within a brief",
            "Saves time on discovery",
            "Can be useful when the user's style direction is already clear",
          ],
        },
        {
          title: "What a Personal Stylist Does",
          bullets: [
            "Clarifies silhouette and colour logic",
            "Defines your wardrobe strategy",
            "Improves future shopping decisions, even when shopping alone",
          ],
        },
        {
          title: "Which One Comes First",
          paragraphs: [
            "If your biggest pain point is confusion, start with styling. If your biggest pain point is execution after the strategy is already clear, shopping help can be useful.",
          ],
        },
      ]}
      relatedLinks={[...comparisonLinks, ...faqLinks].slice(0, 4)}
      ctaTitle="Need the strategy before the shopping?"
      ctaDescription="The Style Blueprint is the faster first step when you want to stop making expensive mistakes."
    />
  );
}
