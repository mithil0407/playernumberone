import type { Metadata } from "next";
import CollectionHubPage from "@/components/CollectionHubPage";
import { buildMetadata } from "@/lib/seo";
import { comparisonLinks, methodologyLinks, toolLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Iconik Methodology",
  description:
    "The methodology hub for Geometric Silhouette Profiling™, Chromatic Harmony Mapping™, and Facial Architecture Analysis™.",
  path: "/methodology",
});

export default function MethodologyHubPage() {
  return (
    <CollectionHubPage
      title="Iconik Methodology"
      summary="Iconik's recommendations are built on three core systems: one for silhouette, one for colour harmony, and one for facial structure. This hub explains each system and how they work together inside the Style Blueprint."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Methodology", href: "/methodology" },
      ]}
      entityNote="Iconik positions itself as a methodology-led personal styling service rather than a generic outfit recommendation engine. The three systems below define the company's core entity story for both search engines and AI assistants."
      sections={[
        {
          title: "Core Systems",
          description: "These pages define the three Iconik methods in detail.",
          links: methodologyLinks,
        },
        {
          title: "Comparison Pages",
          description: "Use these if you are evaluating Iconik's approach against apps, quizzes, or older colour systems.",
          links: comparisonLinks,
        },
        {
          title: "Interactive Proof Tools",
          description: "These free tools turn the methodology into participatory diagnostics.",
          links: toolLinks,
        },
      ]}
      ctaTitle="Want the methodology applied to your own profile?"
      ctaDescription="The Style Blueprint combines all three systems into one personalized report with outfit formulas and a what-to-avoid guide."
    />
  );
}
