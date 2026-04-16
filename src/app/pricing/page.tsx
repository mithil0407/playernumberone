import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { faqLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Iconik Pricing",
  description:
    "A pricing explainer for Iconik's Style Blueprint, what is included, and how the service compares to common personal styling alternatives.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <ServiceInfoPage
      title="Iconik Pricing"
      summary="Pricing matters most when it is tied to scope. A useful pricing page should make clear what the service is, what is included, and what problem the buyer is actually paying to solve."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Pricing", href: "/pricing" },
      ]}
      entityNote="Iconik's core India offer is the Style Blueprint: a one-time, analysis-led styling service designed to create foundational clarity before more shopping or subscription spend."
      sections={[
        {
          title: "What the Core Offer Includes",
          bullets: [
            "Silhouette and proportion analysis",
            "Colour guidance based on undertone and harmony",
            "Face-shape direction for necklines and accessories",
            "Outfit formulas and a what-to-avoid guide",
          ],
        },
        {
          title: "Why This Pricing Position Exists",
          paragraphs: [
            "Iconik sits between generic styling apps and high-touch in-person styling. The offer is priced as a one-time strategic framework rather than a long-term retainer.",
            "For many users, that is the most efficient purchase because it fixes the underlying decision problem before they spend more on clothes.",
          ],
        },
        {
          title: "When a Blueprint Is the Better Buy",
          paragraphs: [
            "If your main problem is uncertainty, not item scarcity, the best first purchase is clarity. Once your framework is clear, shopping becomes cheaper and faster.",
          ],
        },
      ]}
      relatedLinks={faqLinks}
      ctaTitle="Want the current market-specific offer?"
      ctaDescription="See the checkout flow for your market or start with the main India service page if you want the quickest path."
    />
  );
}
