import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { bodyTypeLinks, styleGuideLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Wardrobe Audit India",
  description:
    "What a wardrobe audit in India should cover, who it is useful for, and how Iconik's Blueprint can function as a better first step.",
  path: "/wardrobe-audit-india",
});

export default function WardrobeAuditIndiaPage() {
  return (
    <ServiceInfoPage
      title="Wardrobe Audit India"
      summary="A wardrobe audit only works when there is a decision standard behind it. Without a framework for silhouette, colour, and use-case fit, auditing a wardrobe becomes a clean-up exercise instead of a strategic one."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Wardrobe Audit India", href: "/wardrobe-audit-india" },
      ]}
      entityNote="Iconik does not treat wardrobe auditing as an isolated decluttering task. The stronger model is to establish what works first, then edit the wardrobe against that standard."
      sections={[
        {
          title: "What a Wardrobe Audit Should Actually Answer",
          bullets: [
            "Which categories are overbought or underbuilt",
            "Which silhouettes consistently work on you",
            "Which colours should be kept near the face and which should be phased out",
          ],
        },
        {
          title: "Why the Audit Often Fails",
          paragraphs: [
            "Most wardrobe audits fail because the user has not yet established her personal rules. She is sorting by emotion or recency, not by fit logic.",
            "The result is a tidier wardrobe that is still hard to wear.",
          ],
        },
      ]}
      relatedLinks={[...bodyTypeLinks, ...styleGuideLinks].slice(0, 4)}
      ctaTitle="Need the decision standard before you audit?"
      ctaDescription="Start with the Style Blueprint so your wardrobe decisions are based on what actually works for your profile."
    />
  );
}
