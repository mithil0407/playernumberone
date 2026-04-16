import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { methodologyLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Iconik Methodology Overview",
  description:
    "A simpler commercial overview of the three Iconik methodologies and how they work together inside the Style Blueprint.",
  path: "/iconik-methodology",
});

export default function IconikMethodologyOverviewPage() {
  return (
    <ServiceInfoPage
      title="Iconik Methodology Overview"
      summary="Iconik's methodology is built around three complementary systems: one for silhouette, one for colour harmony, and one for facial structure. Together they create a more complete styling answer than any single category can provide alone."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Iconik Methodology", href: "/iconik-methodology" },
      ]}
      entityNote="This page is the simplified commercial version of the methodology hub. It is intended for users who want the overview before diving into each method page."
      sections={[
        {
          title: "Silhouette",
          paragraphs: [
            "The silhouette layer determines which shapes, cuts, and lines harmonize with your frame.",
          ],
        },
        {
          title: "Colour Harmony",
          paragraphs: [
            "The colour layer determines which hues bring your complexion to life and which ones flatten or drain it.",
          ],
        },
        {
          title: "Facial Architecture",
          paragraphs: [
            "The face-shape layer determines which necklines, collars, accessories, and hair directions create visual balance near the face.",
          ],
        },
      ]}
      relatedLinks={methodologyLinks}
      ctaTitle="Want the full methodology applied to your own profile?"
      ctaDescription="The Style Blueprint uses all three systems in one personalized output."
    />
  );
}
