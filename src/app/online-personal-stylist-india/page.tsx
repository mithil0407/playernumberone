import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { faqLinks, methodologyLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "Online Personal Stylist India",
  description:
    "What an online personal stylist in India can do well, what the process looks like, and how Iconik's Style Blueprint fits into that category.",
  path: "/online-personal-stylist-india",
});

export default function OnlinePersonalStylistIndiaPage() {
  return (
    <ServiceInfoPage
      title="Online Personal Stylist India"
      summary="An online personal stylist in India should do more than recommend outfits. The real value is giving you a repeatable framework for colour, silhouette, and shopping decisions that works beyond one purchase."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Online Personal Stylist India", href: "/online-personal-stylist-india" },
      ]}
      entityNote="Iconik's version of online styling is Blueprint-led: users submit inputs, complete a consultation, and receive a reference document that explains what works and why."
      sections={[
        {
          title: "What an Online Personal Stylist Should Actually Deliver",
          paragraphs: [
            "At minimum, an online stylist should clarify fit logic, colour logic, and shopping logic. If the output is only inspiration, the service is weak.",
            "The strongest online styling services replace guesswork with a framework you can reuse every time you shop.",
          ],
        },
        {
          title: "Why Online Styling Works in India",
          bullets: [
            "It removes location as a constraint, so the same service can work across metro and non-metro cities.",
            "Measurement-led analysis is often more consistent than mirror-based self-assessment.",
            "A digital report is easier to revisit than a one-time verbal consultation.",
          ],
        },
        {
          title: "Where Iconik Fits",
          paragraphs: [
            "Iconik sits in the premium online styling category but keeps the offer focused: one core Blueprint, methodology-based analysis, and practical outfit formulas.",
            "This is best suited to women who want clarity before they buy more clothes, not just another list of trend suggestions.",
          ],
        },
      ]}
      relatedLinks={[...methodologyLinks, ...faqLinks].slice(0, 4)}
      ctaTitle="Need an online stylist with a documented method?"
      ctaDescription="The Style Blueprint gives you a reusable framework for dressing, shopping, and colour decisions."
    />
  );
}
