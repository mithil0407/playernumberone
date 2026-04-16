import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { faqLinks, methodologyLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "How Iconik Works",
  description:
    "A clear explanation of the Iconik process: intake, stylist consultation, analysis, and delivery of the Style Blueprint.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <ServiceInfoPage
      title="How Iconik Works"
      summary="Iconik is designed to turn styling from vague advice into a documented system. The process is simple: collect the right inputs, run the analysis, review it with a stylist, and deliver a Blueprint that can be reused."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "How It Works", href: "/how-it-works" },
      ]}
      entityNote="The Style Blueprint is the core Iconik deliverable. It combines silhouette analysis, colour guidance, and face-shape direction into one personalized reference document."
      sections={[
        {
          title: "Step 1: Intake and Inputs",
          paragraphs: [
            "You complete an intake that captures measurements, goals, wardrobe pain points, and supporting photos where needed.",
            "The goal is not to overwhelm you with questions. The goal is to collect enough signal to avoid generic recommendations.",
          ],
        },
        {
          title: "Step 2: Stylist Review and Analysis",
          paragraphs: [
            "An Iconik stylist reviews your information through the lens of the three core methodologies: silhouette, colour, and facial architecture.",
            "This is where the service differs from a quiz. The result is not a loose archetype, but a specific styling framework.",
          ],
        },
        {
          title: "Step 3: Blueprint Delivery",
          paragraphs: [
            "You receive a Style Blueprint with your best colours, silhouette logic, outfit formulas, and a what-to-avoid guide.",
            "Because the output is documented, it keeps helping after the consultation is over.",
          ],
        },
      ]}
      relatedLinks={[...faqLinks, ...methodologyLinks].slice(0, 4)}
      ctaTitle="Ready for the full process?"
      ctaDescription="Start with the Blueprint and get the structured version of personal styling rather than another round of guesswork."
    />
  );
}
