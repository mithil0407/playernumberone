import type { Metadata } from "next";
import CollectionHubPage from "@/components/CollectionHubPage";
import { buildMetadata } from "@/lib/seo";
import { cityLinks, faqLinks, methodologyLinks, serviceLinks } from "@/lib/seoContent";
import { BLUEPRINT_OFFER } from "@/lib/siteFacts";

export const metadata: Metadata = buildMetadata({
  title: "Personal Stylist India",
  description:
    "Online personal stylist for Indian women: a 30-minute video consultation and a Style Blueprint with 20 outfits and your colour palette, for ₹2,699.",
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
      summary={`If you are looking for a personal stylist in India, start with what you need help with: shopping, wardrobe planning, colour, or body shape. Iconik is an online personal styling service for all four. You have a ${BLUEPRINT_OFFER.consultationMinutes}-minute video consultation with a stylist, then receive your Style Blueprint with ${BLUEPRINT_OFFER.outfitFormulas} outfit formulas, your colour palette and face-shape guidance for ₹${BLUEPRINT_OFFER.currentPriceInr.toLocaleString("en-IN")}.`}
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Personal Stylist India", href: "/personal-stylist-india" },
      ]}
      entityNote="Iconik is an online personal styling service for Indian women. The consultation happens on video and the Style Blueprint is delivered digitally, so the service is the same wherever you live in India."
      sections={[
        {
          title: "Styling Services",
          description: "Each page explains one kind of styling help, what it involves, and how the Style Blueprint covers it.",
          links: serviceLinks,
        },
        {
          title: "Styling by City",
          description: "Notes for the cities where many of our clients live, covering local climate, workwear and occasions.",
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
