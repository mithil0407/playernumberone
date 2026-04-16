import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { bodyTypeLinks, colourAnalysisLinks, methodologyLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Personal Styling Terms India",
  description:
    "A glossary of common personal styling terms used on Iconik, including silhouette, undertone, capsule wardrobe, and related concepts.",
  path: "/glossary/personal-styling-terms-india",
});

export default function PersonalStylingTermsIndiaPage() {
  return (
    <ServiceInfoPage
      title="Personal Styling Terms in India"
      summary="Personal styling language gets confusing fast because many users are hearing several systems at once. This glossary keeps the most useful terms in one place so the rest of the site is easier to understand."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Glossary", href: "/glossary/personal-styling-terms-india" },
      ]}
      entityNote="Glossary pages are useful for both users and AI systems because they tie recurring terminology back to a consistent entity and methodology set."
      sections={[
        {
          title: "Core Terms",
          bullets: [
            "Silhouette: the broad visual shape created by your proportions and the clothes on your body.",
            "Undertone: the underlying warm, cool, or neutral hue beneath the surface depth of your skin.",
            "Capsule wardrobe: a smaller wardrobe built for repeated combinations rather than constant novelty.",
          ],
        },
        {
          title: "Iconik-Specific Terms",
          bullets: [
            "Geometric Silhouette Profiling™: Iconik's body analysis method.",
            "Chromatic Harmony Mapping™: Iconik's colour analysis method.",
            "Facial Architecture Analysis™: Iconik's face-shape and styling method.",
          ],
        },
      ]}
      relatedLinks={[...methodologyLinks, ...bodyTypeLinks, ...colourAnalysisLinks].slice(0, 5)}
      ctaTitle="Want these terms translated into personal recommendations?"
      ctaDescription="The Style Blueprint turns the vocabulary into practical decisions for your own wardrobe."
    />
  );
}
