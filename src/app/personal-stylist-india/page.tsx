import type { Metadata } from "next";
import CollectionHubPage from "@/components/CollectionHubPage";
import { buildMetadata } from "@/lib/seo";
import { cityLinks, faqLinks, methodologyLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Personal Stylist India",
  description:
    "India's online personal styling service for women. Compare Iconik's national Style Blueprint, priority city pages, methodology, pricing, and FAQs.",
  path: "/personal-stylist-india",
  keywords: [
    "personal stylist India",
    "online personal stylist India",
    "virtual personal stylist India",
    "personal styling service India",
  ],
});

export default function PersonalStylistIndiaPage() {
  return (
    <CollectionHubPage
      title="Personal Stylist India"
      summary="If you are looking for a personal stylist in India, the strongest first question is whether you need shopping help, wardrobe strategy, colour guidance, or silhouette analysis. Iconik is primarily an online personal styling service: the Style Blueprint is delivered digitally, while the priority city pages below explain how the same service applies to the markets where local search demand is strongest."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Personal Stylist India", href: "/personal-stylist-india" },
      ]}
      entityNote="Iconik is an online personal styling service for Indian women. The service is national by design, so this hub intentionally links only to priority city pages with enough unique local context instead of publishing thin pages for every city."
      sections={[
        {
          title: "Priority City Pages",
          description: "These are the retained local pages. They exist for high-intent city searches, but the service remains online and measurement-led.",
          links: cityLinks,
        },
        {
          title: "How the Online Service Works",
          description: "These pages explain what the Blueprint includes, what it costs, and how Iconik's methodology differs from generic style advice.",
          links: [...faqLinks, ...methodologyLinks].slice(0, 4),
        },
      ]}
      ctaTitle="Need a personal styling system that works anywhere in India?"
      ctaDescription="The Style Blueprint is delivered online, which means the analytical framework is the same whether you are in Mumbai, Chennai, Delhi, or a smaller city."
    />
  );
}
