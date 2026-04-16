import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { colourAnalysisLinks, methodologyLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Colour Analysis India",
  description:
    "A service-intent page for colour analysis in India, including undertones, palette logic, and how Iconik approaches Indian skin tones.",
  path: "/colour-analysis-india",
});

export default function ColourAnalysisIndiaPage() {
  return (
    <ServiceInfoPage
      title="Colour Analysis India"
      summary="Colour analysis in India often breaks down because imported systems were not built around Indian skin tone diversity. A useful service should identify undertone clearly and translate it into colours you can actually wear."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Colour Analysis India", href: "/colour-analysis-india" },
      ]}
      entityNote="Iconik's colour methodology is Chromatic Harmony Mapping™, an undertone-led system designed to work better for Indian skin than generic seasonal prescriptions."
      sections={[
        {
          title: "What Good Colour Analysis Should Deliver",
          bullets: [
            "A clear undertone call",
            "Practical colours, not abstract categories",
            "Guidance that works for Indian garment categories and occasion dressing",
          ],
        },
        {
          title: "Why Generic Advice Fails",
          paragraphs: [
            "The most common failure mode is over-warm advice. Many Indian women with cool or neutral undertones are repeatedly pushed toward palettes that make them look tired.",
            "The fix is not more trend advice. The fix is better undertone identification.",
          ],
        },
      ]}
      relatedLinks={[...colourAnalysisLinks, ...methodologyLinks].slice(0, 4)}
      ctaTitle="Need colour guidance built for Indian skin tones?"
      ctaDescription="The Style Blueprint includes colour guidance as part of the larger personal styling system."
    />
  );
}
