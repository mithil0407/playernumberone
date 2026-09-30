import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { faqLinks } from "@/lib/seoContent";
import { BLUEPRINT_OFFER } from "@/lib/siteFacts";

export const metadata: Metadata = buildMetadata({
  title: "Iconik Pricing",
  description:
    "The ICONIK Style Blueprint costs ₹2,699: a 30-minute stylist consultation, 20 outfit formulas, your colour palette and face-shape guidance.",
  path: "/pricing",
});

const price = `₹${BLUEPRINT_OFFER.currentPriceInr.toLocaleString("en-IN")}`;

export default function PricingPage() {
  return (
    <ServiceInfoPage
      title="Iconik Pricing"
      summary={`The ICONIK Style Blueprint costs ${price}, paid once. It includes a ${BLUEPRINT_OFFER.consultationMinutes}-minute video consultation with your stylist and a written Blueprint with ${BLUEPRINT_OFFER.outfitFormulas} outfit formulas, your colour palette and your body and face-shape guides, delivered within ${BLUEPRINT_OFFER.deliveryWorkingDays} working days after the consultation.`}
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Pricing", href: "/pricing" },
      ]}
      entityNote={`${price} is the price for clients in India. Clients outside India can book the same Blueprint through the global page, and there is a separate Blueprint for men.`}
      sections={[
        {
          title: `What ${price} Includes`,
          bullets: [
            `A ${BLUEPRINT_OFFER.consultationMinutes}-minute video consultation with your ICONIK stylist`,
            `${BLUEPRINT_OFFER.outfitFormulas} complete outfit formulas built for your body, colouring and lifestyle`,
            "Your colour palette, based on your undertone and depth",
            "Your body shape guide: the cuts, lengths and silhouettes that suit you, and what to avoid",
            "Your face-shape guide for necklines, earrings and eyewear",
            "Free hairstyle, makeup, hair colour and glasses guides",
          ],
        },
        {
          title: "Delivery, Revisions and Refunds",
          paragraphs: [
            `Your Blueprint arrives within ${BLUEPRINT_OFFER.deliveryWorkingDays} working days after your consultation.`,
            BLUEPRINT_OFFER.revisionPromise,
            BLUEPRINT_OFFER.refundSummary,
          ],
        },
        {
          title: "Other Markets and Services",
          bullets: [
            "Outside India: the global Blueprint is priced in US dollars on the global page.",
            "For men: the ICONIK Blueprint for men has its own consultation and outfit set.",
          ],
        },
        {
          title: "When a Blueprint Is the Better Buy",
          paragraphs: [
            "If your main problem is not knowing what suits you, rather than not owning enough clothes, the best first purchase is clarity. Once you know your cuts and colours, shopping becomes faster and you waste less on pieces you never wear.",
          ],
        },
      ]}
      relatedLinks={[
        { href: "/globe", title: "Global Blueprint", description: "The same Blueprint for clients outside India, priced in US dollars." },
        { href: "/man", title: "ICONIK for Men", description: "Personal styling for Indian men, with outfits, colours, fit and grooming." },
        { href: "/refund-policy", title: "Refund Policy", description: "The cancellation and refund cases in full." },
        ...faqLinks.slice(0, 3),
      ]}
      ctaTitle={`Get your Style Blueprint for ${price}`}
      ctaDescription={`Book your ${BLUEPRINT_OFFER.consultationMinutes}-minute consultation and receive your Blueprint within ${BLUEPRINT_OFFER.deliveryWorkingDays} working days after it.`}
    />
  );
}
