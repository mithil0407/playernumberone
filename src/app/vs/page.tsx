import type { Metadata } from "next";
import CollectionHubPage from "@/components/CollectionHubPage";
import { buildMetadata } from "@/lib/seo";
import { comparisonLinks, faqLinks, methodologyLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Personal Styling Comparisons",
  description:
    "Comparison pages for online vs in-person styling, styling apps vs stylists, style blueprints vs quizzes, and related decisions.",
  path: "/vs",
});

export default function ComparisonsHubPage() {
  return (
    <CollectionHubPage
      title="Personal Styling Comparisons"
      summary="Decision pages are often where high-intent users convert. This hub gathers the main Iconik comparison pages so users can evaluate online styling, apps, quizzes, and methodology choices without leaving the site."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Comparisons", href: "/vs" },
      ]}
      entityNote="For SEO and AEO, comparison pages are valuable because they answer explicit evaluation queries. They also help search engines understand how Iconik differentiates itself in the styling category."
      sections={[
        {
          title: "Core Comparison Pages",
          description: "These pages answer the highest-intent comparison questions in the current cluster.",
          links: comparisonLinks,
        },
        {
          title: "Decision Support",
          description: "Use these if you need pricing, service definition, or methodology context before choosing a direction.",
          links: [...faqLinks, ...methodologyLinks].slice(0, 4),
        },
      ]}
      ctaTitle="Done comparing and ready for a personalized answer?"
      ctaDescription="The Style Blueprint gives you a direct, body-specific styling framework instead of another generic quiz result."
    />
  );
}
