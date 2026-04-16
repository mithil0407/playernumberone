import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { faqLinks, styleGuideLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Capsule Wardrobe Service India",
  description:
    "What a capsule wardrobe service in India should do, and how Iconik's Blueprint can act as the foundation for a smaller, more coherent wardrobe.",
  path: "/capsule-wardrobe-service-india",
});

export default function CapsuleWardrobeServiceIndiaPage() {
  return (
    <ServiceInfoPage
      title="Capsule Wardrobe Service India"
      summary="A capsule wardrobe service should reduce wardrobe complexity without making your outfits feel generic. The only way to do that well is to define your colours, silhouettes, and core use cases first."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Capsule Wardrobe Service India", href: "/capsule-wardrobe-service-india" },
      ]}
      entityNote="Iconik treats capsule building as an output of the Blueprint. Once the user's framework is clear, fewer purchases can create more combinations."
      sections={[
        {
          title: "What a Good Capsule Service Produces",
          bullets: [
            "A smaller set of repeatable outfit combinations",
            "Clear rules for neutrals, accent colours, and hero pieces",
            "Better alignment between lifestyle and wardrobe categories",
          ],
        },
        {
          title: "Why Capsules Fail",
          paragraphs: [
            "Capsules fail when they are copied from someone else's aesthetic. A small wardrobe only feels powerful when it matches the user's body and actual life.",
            "That is why the strongest capsule work starts with analysis, not decluttering.",
          ],
        },
      ]}
      relatedLinks={[...styleGuideLinks, ...faqLinks].slice(0, 4)}
      ctaTitle="Want a capsule built around your actual profile?"
      ctaDescription="Use the Style Blueprint as the foundation before editing down your wardrobe."
    />
  );
}
