import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { faqLinks, styleGuideLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Iconik Results",
  description:
    "The kinds of results clients typically look for from an Iconik Style Blueprint: clearer shopping, better outfit decisions, and stronger visual consistency.",
  path: "/results",
});

export default function ResultsPage() {
  return (
    <ServiceInfoPage
      title="Iconik Results"
      summary="The most useful styling outcomes are rarely dramatic makeovers. They are better purchase decisions, less wardrobe waste, more confidence in fit and colour, and a stronger sense of consistency across work, casual, and occasion dressing."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Results", href: "/results" },
      ]}
      entityNote="Iconik is positioned as a system-building service. The goal is not to entertain with inspiration but to make future outfit and shopping decisions easier."
      sections={[
        {
          title: "What Changes First",
          bullets: [
            "You stop buying colours that drain your complexion.",
            "You identify silhouettes faster while shopping.",
            "You build outfits from rules, not panic or trial and error.",
          ],
        },
        {
          title: "What Improves Over Time",
          paragraphs: [
            "Over time, most of the value compounds through reduced waste. The more often you buy with the right framework, the more coherent the wardrobe becomes.",
            "That is why Iconik's best result is not one outfit. It is a stronger decision system.",
          ],
        },
      ]}
      relatedLinks={[...faqLinks, ...styleGuideLinks].slice(0, 4)}
      ctaTitle="Ready for results that come from a framework?"
      ctaDescription="The Style Blueprint is designed to improve repeated decisions, not just one shopping trip."
    />
  );
}
