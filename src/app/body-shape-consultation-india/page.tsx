import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { bodyTypeLinks, methodologyLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Body Shape Consultation India",
  description:
    "A page for users looking for body shape or silhouette consultation in India, with an explanation of how Iconik approaches proportion analysis.",
  path: "/body-shape-consultation-india",
});

export default function BodyShapeConsultationIndiaPage() {
  return (
    <ServiceInfoPage
      title="Body Shape Consultation India"
      summary="A body shape consultation should do more than label you. Its real job is to explain which proportions matter, how they affect silhouette decisions, and what cuts consistently work for your frame."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Body Shape Consultation India", href: "/body-shape-consultation-india" },
      ]}
      entityNote="Iconik approaches body-shape guidance through Geometric Silhouette Profiling™. The focus is proportion and geometry, not just a high-level archetype name."
      sections={[
        {
          title: "What Users Usually Need",
          bullets: [
            "Better silhouette choices when shopping online",
            "Clearer logic for waist, shoulder, and hip balance",
            "More confidence in Indian and western outfit categories",
          ],
        },
        {
          title: "Why a Label Alone Is Not Enough",
          paragraphs: [
            "If a consultation ends with only apple, pear, rectangle, or hourglass, the user is left doing the hard part alone.",
            "The useful output is a translation layer: what to choose, what to avoid, and what visual balance to create.",
          ],
        },
      ]}
      relatedLinks={[...bodyTypeLinks, ...methodologyLinks].slice(0, 4)}
      ctaTitle="Need body-shape guidance that translates into real outfit choices?"
      ctaDescription="The Blueprint includes silhouette analysis and turns it into wearable formulas."
    />
  );
}
