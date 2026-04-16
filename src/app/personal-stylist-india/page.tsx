import type { Metadata } from "next";
import CollectionHubPage from "@/components/CollectionHubPage";
import { buildMetadata } from "@/lib/seo";
import { cityLinks, faqLinks, methodologyLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Personal Stylist India",
  description:
    "A national landing page for Iconik's online personal styling service in India, with city pages, methodology pages, and core FAQs.",
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
      summary="If you are looking for a personal stylist in India, the strongest first question is whether you need shopping help, wardrobe strategy, colour guidance, or silhouette analysis. This page connects the national service with key city pages, core FAQs, and the methodology that powers Iconik's Style Blueprint."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Personal Stylist India", href: "/personal-stylist-india" },
      ]}
      entityNote="Iconik is an online personal styling service for Indian women. The service is national by design, with city pages to capture local search intent while the actual delivery remains digital and measurement-led."
      sections={[
        {
          title: "Top City Pages",
          description: "These pages help users who search with a city modifier but still want an online service.",
          links: cityLinks,
        },
        {
          title: "How the Service Works",
          description: "These pages explain what the Blueprint is and how the methodology differs from generic style advice.",
          links: [...faqLinks, ...methodologyLinks].slice(0, 4),
        },
      ]}
      ctaTitle="Need a personal styling system that works anywhere in India?"
      ctaDescription="The Style Blueprint is delivered online, which means the analytical framework is the same whether you are in Mumbai, Chennai, Delhi, or a smaller city."
    />
  );
}
