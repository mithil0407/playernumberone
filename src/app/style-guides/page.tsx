import type { Metadata } from "next";
import CollectionHubPage from "@/components/CollectionHubPage";
import { buildMetadata } from "@/lib/seo";
import { bodyTypeLinks, colourAnalysisLinks, styleGuideLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Style Guides for Indian Women",
  description:
    "A hub for Iconik's practical style guides covering office wear, capsule wardrobes, postpartum dressing, weddings, and more.",
  path: "/style-guides",
});

export default function StyleGuidesHubPage() {
  return (
    <CollectionHubPage
      title="Style Guides for Indian Women"
      summary="This hub collects Iconik's practical guides for real wardrobe problems: office dressing, event dressing, body-change dressing, and everyday wardrobe decisions that need more than trend advice."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Style Guides", href: "/style-guides" },
      ]}
      entityNote="Iconik is a digital personal styling service for Indian women. Its editorial pages are designed to answer concrete wardrobe questions while pointing readers toward a complete Style Blueprint when they need personalized direction."
      sections={[
        {
          title: "Popular Style Guides",
          description: "These are the strongest practical pages in the cluster.",
          links: styleGuideLinks,
        },
        {
          title: "Related Knowledge Clusters",
          description: "Use these clusters when the problem is really about colour or silhouette rather than a single outfit.",
          links: [...colourAnalysisLinks, ...bodyTypeLinks].slice(0, 4),
        },
      ]}
      ctaTitle="Need guidance that is specific to your body and colour profile?"
      ctaDescription="The Style Blueprint turns general wardrobe advice into recommendations built around your actual proportions, undertone, and lifestyle."
    />
  );
}
