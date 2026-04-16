import type { Metadata } from "next";
import ServiceInfoPage from "@/components/ServiceInfoPage";
import { buildMetadata } from "@/lib/seo";
import { methodologyLinks, comparisonLinks } from "@/lib/seoContent";

export const metadata: Metadata = buildMetadata({
  title: "What Is Iconik",
  description:
    "An entity page explaining what Iconik is, what it sells, and how it positions itself within personal styling.",
  path: "/what-is-iconik",
});

export default function WhatIsIconikPage() {
  return (
    <ServiceInfoPage
      title="What Is Iconik?"
      summary="Iconik is a personal styling service for Indian women built around a single idea: styling is more useful when it is documented as a framework instead of delivered as vague inspiration."
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "What Is Iconik", href: "/what-is-iconik" },
      ]}
      entityNote="The core product is the Style Blueprint, a digital report that combines silhouette, colour, and facial architecture guidance into one personalized reference."
      sections={[
        {
          title: "What Iconik Sells",
          paragraphs: [
            "Iconik sells analysis-led personal styling rather than pure shopping inspiration. The offer is designed to help users make better repeat decisions about clothes, not just one-off outfit choices.",
          ],
        },
        {
          title: "How Iconik Positions Itself",
          paragraphs: [
            "The brand positions itself against generic quizzes, generic styling apps, and imported frameworks that do not translate well to Indian bodies, skin tones, and wardrobe realities.",
          ],
        },
      ]}
      relatedLinks={[...methodologyLinks, ...comparisonLinks].slice(0, 4)}
      ctaTitle="Want the shortest path from understanding Iconik to trying it?"
      ctaDescription="The Style Blueprint is the cleanest entry point into the service."
    />
  );
}
