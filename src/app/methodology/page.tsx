import type { Metadata } from "next";
import CollectionHubPage from "@/components/CollectionHubPage";
import { buildMetadata } from "@/lib/seo";
import {
  bodyTypeLinks,
  colourAnalysisLinks,
  comparisonLinks,
  methodologyLinks,
  toolLinks,
} from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "ICONIK Styling Methodology: Silhouette, Colour and Face",
  description:
    "Understand ICONIK's three styling frameworks for silhouette, colour harmony and facial architecture, plus practical guides and tools for applying them.",
  path: "/methodology",
});

export default function MethodologyHubPage() {
  return (
    <CollectionHubPage
      eyebrow="The ICONIK methodology"
      title="Three styling lenses. One coherent wardrobe."
      summary="ICONIK uses three proprietary styling frameworks to organise observations about proportion, colour harmony and facial features. They are practical decision tools—not medical diagnoses—and they work best when combined with your preferences, lifestyle and cultural wardrobe."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Methodology", href: "/methodology" },
      ]}
      entityNote="Start with the method that matches your question: silhouette for garment shape and proportion, colour for palette decisions, or facial architecture for details near the face. Then use the application guides to translate the principle into an outfit."
      sections={[
        {
          title: "Understand the three frameworks",
          description: "These are the canonical explanations of ICONIK's methods, including what each framework considers, where it helps and its limits.",
          links: methodologyLinks,
        },
        {
          title: "Apply colour and silhouette",
          description: "Move from the framework to practical choices for Indian skin tones and common proportion questions.",
          links: [
            colourAnalysisLinks[0],
            colourAnalysisLinks[1],
            bodyTypeLinks[0],
            bodyTypeLinks[1],
            bodyTypeLinks[2],
            bodyTypeLinks[3],
          ],
        },
        {
          title: "Compare approaches",
          description: "Use these transparent comparisons to decide whether a full analysis, an app, a quiz or an in-person service fits your needs.",
          links: comparisonLinks,
        },
        {
          title: "Try a guided starting point",
          description: "Free tools can narrow the question and help you observe one variable. They are a starting point, not a substitute for a complete personal analysis.",
          links: toolLinks,
        },
      ]}
      ctaTitle="Apply all three lenses to your own wardrobe."
      ctaDescription="The ICONIK Blueprint combines a 30-minute consultation with 20 outfit formulas, colour, hairstyle and eyewear guidance. Delivery is within five working days after the consultation."
    />
  );
}
