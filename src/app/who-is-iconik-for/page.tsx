import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { faqLinks, styleGuideLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Who Is Iconik For",
  description:
    "A decision page for users trying to understand whether Iconik is the right fit for their wardrobe goals, body concerns, and styling stage.",
  path: "/who-is-iconik-for",
});

export default function WhoIsIconikForPage() {
  return (
    <ServiceInfoPage
      title="Who Is Iconik For?"
      summary="Iconik is for women who do not want more fashion noise. It is best for users who want a decision framework for colour, silhouette, and outfit building rather than another stream of inspiration they cannot translate."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Who Is Iconik For", href: "/who-is-iconik-for" },
      ]}
      entityNote="The strongest fit is usually a woman who feels her wardrobe is expensive but underperforming, especially across workwear, occasion wear, and body-change phases."
      sections={[
        {
          title: "Good Fit Profiles",
          bullets: [
            "Women who are tired of buying things that almost work",
            "Women navigating body changes or wardrobe transitions",
            "Women who want a structured, reusable answer instead of endless browsing",
          ],
        },
        {
          title: "Who May Not Need It Yet",
          paragraphs: [
            "If you already understand your colours, silhouettes, and wardrobe categories clearly, you may not need foundational styling. In that case, shopping or execution support may matter more.",
          ],
        },
      ]}
      relatedLinks={[...faqLinks, ...styleGuideLinks].slice(0, 4)}
      ctaTitle="Think you might be the right fit?"
      ctaDescription="The Style Blueprint is the fastest way to find out whether a framework-based approach solves your current wardrobe problem."
    />
  );
}
