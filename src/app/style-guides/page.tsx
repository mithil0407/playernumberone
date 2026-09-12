import type { Metadata } from "next";
import CollectionHubPage from "@/components/CollectionHubPage";
import { buildMetadata } from "@/lib/seo";
import { bodyTypeLinks, colourAnalysisLinks, methodologyLinks, styleGuideLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Style Guides for Indian Women",
  description:
    "A hub for Iconik's practical style guides covering office wear, capsule wardrobes, postpartum dressing, weddings, and more.",
  path: "/style-guides",
});

export default function StyleGuidesHubPage() {
  const byPath = (path: string) => {
    const guide = styleGuideLinks.find((item) => item.href === path);
    if (!guide) throw new Error(`Missing style guide: ${path}`);
    return guide;
  };

  return (
    <CollectionHubPage
      eyebrow="Practical wardrobe library"
      title="Style guides for real Indian wardrobes."
      summary="Use these guides to solve a specific dressing decision—workwear, Indian occasion wear, wardrobe building or dressing through body change. Each guide explains the principle, shows how it applies and links back to the deeper colour or proportion method when useful."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Style Guides", href: "/style-guides" },
      ]}
      entityNote="Choose the situation you are dressing for first. Use the general formula, then adapt it to your climate, dress code, comfort, budget and existing wardrobe. Body and colour categories are options for refinement—not rules you have to obey."
      sections={[
        {
          title: "Work and everyday wardrobes",
          description: "Build repeatable outfit systems for professional and daily life.",
          links: [
            byPath("/style-guides/office-wear-indian-women"),
            byPath("/style-guides/modest-professional-fashion-india"),
            byPath("/style-guides/capsule-wardrobe-india"),
            byPath("/style-guides/fashion-40s-india"),
          ],
        },
        {
          title: "Indian wear and occasions",
          description: "Make proportion, drape and colour decisions within Indian wardrobe categories.",
          links: [
            byPath("/style-guides/indian-wedding-guest-outfit"),
            byPath("/style-guides/saree-draping-body-type"),
            byPath("/style-guides/salwar-kameez-body-type"),
            byPath("/style-guides/kurti-length-guide"),
            byPath("/style-guides/diwali-outfit-body-type"),
          ],
        },
        {
          title: "Dress through body change",
          description: "Practical guidance centred on fit, comfort and the body you have now—without treating it as a problem to hide.",
          links: [
            byPath("/style-guides/postpartum-fashion-india"),
            byPath("/style-guides/dressing-after-weight-gain"),
          ],
        },
        {
          title: "Learn the principle behind the outfit",
          description: "Use these pillar guides and methodology pages when the same wardrobe problem keeps recurring.",
          links: [
            colourAnalysisLinks[0],
            bodyTypeLinks[0],
            methodologyLinks[0],
            methodologyLinks[1],
            methodologyLinks[2],
          ],
        },
      ]}
      ctaTitle="Want a wardrobe system built around your real life?"
      ctaDescription="The ICONIK Blueprint turns general principles into 20 outfit formulas, plus colour, hairstyle and eyewear direction based on your consultation."
    />
  );
}
