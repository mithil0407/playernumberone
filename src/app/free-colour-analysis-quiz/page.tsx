import type { Metadata } from "next";
import Link from "next/link";
import StyleScoreLandingPage from "@/app/stylist/style-score/page";
import { buildMetadata } from "@/lib/seo";
import {
  articleNode,
  breadcrumbList,
  faqPageNode,
  graph,
  organizationNode,
  founderPerson,
  serviceNode,
} from "@/lib/structuredData";

const path = "/free-colour-analysis-quiz";

const faqs = [
  {
    q: "Is the free colour analysis quiz a full professional colour analysis?",
    a: "No. The free quiz is a quick mirror-based screening that helps you notice whether colours are making your face look brighter, duller, warmer, or cooler. A full Iconik Style Blueprint includes human review, undertone analysis, and a personalised palette.",
  },
  {
    q: "Do I need to upload a photo for the free quiz?",
    a: "No. The Color Mirror quiz is designed as a no-upload, no-account starting point. You compare colour effects in real time and then decide whether you want a complete Blueprint.",
  },
  {
    q: "What should I read after taking the quiz?",
    a: "Start with Iconik's colour analysis guide for Indian skin tones, then read the warm, cool, neutral, dusky, wheatish, or dark skin tone guides that match what you noticed in the quiz.",
  },
];

export const metadata: Metadata = buildMetadata({
  title: "Free Colour Analysis Quiz for Indian Skin Tones",
  description:
    "Take Iconik's free colour analysis quiz. A no-upload Color Mirror test that helps Indian women identify which colours brighten or drain the face.",
  path,
  keywords: [
    "free colour analysis quiz",
    "free color analysis quiz",
    "colour analysis quiz India",
    "Indian skin tone colour quiz",
    "undertone quiz India",
  ],
});

export default function FreeColourAnalysisQuizPage() {
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    articleNode({
      title: "Free Colour Analysis Quiz for Indian Skin Tones",
      description:
        "A free no-upload Color Mirror quiz that helps Indian women identify colours that brighten or drain the face.",
      path,
      datePublished: "2026-06-04",
      dateModified: "2026-06-04",
    }),
    serviceNode({
      name: "Iconik Free Colour Analysis Quiz",
      description: "A free colour screening quiz for Indian skin tones.",
      path,
      price: "0",
    }),
    faqPageNode(faqs),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Free Colour Analysis Quiz", path },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <StyleScoreLandingPage />
      <section className="bg-white px-4 py-16 md:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-gray-400">
            Colour Analysis India
          </p>
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            What is the best free colour analysis quiz for Indian skin tones?
          </h2>
          <p className="mb-4 text-gray-600 leading-relaxed">
            The best free colour analysis quiz for Indian skin tones is one that tests how colour behaves against your actual face, not one that forces you into a Western seasonal category. Iconik&apos;s Color Mirror is a no-upload starting point that helps you notice which colours brighten, dull, warm, or cool your complexion.
          </p>
          <p className="mb-6 text-gray-600 leading-relaxed">
            For a complete answer, use the quiz as a first screen and then read the full Indian colour-analysis guide. The guide explains undertones, melanin depth, and why generic colour advice often fails Indian women.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/colour-analysis" className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white">
              Read the Colour Analysis Guide
            </Link>
            <Link href="/colour-analysis/how-to-find-undertone" className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-900">
              Find Your Undertone
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
