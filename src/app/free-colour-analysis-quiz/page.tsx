import type { Metadata } from "next";
import Link from "next/link";
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
    a: "No. The free colour analysis uses a daylight selfie and eight quick questions to offer initial undertone and palette guidance. Lighting can affect the result. A full Iconik Style Blueprint includes a stylist consultation, human review, and a personalised palette.",
  },
  {
    q: "Do I need to upload a photo for the free quiz?",
    a: "Yes. The free colour analysis starts with one daylight selfie so you can explore colours against your actual face. Read our privacy policy before uploading your photo.",
  },
  {
    q: "What should I read after taking the quiz?",
    a: "Start with Iconik's colour analysis guide for Indian skin tones, then read the warm, cool, neutral, dusky, wheatish, or dark skin tone guides that match what you noticed in the quiz.",
  },
];

export const metadata: Metadata = buildMetadata({
  title: "Free Colour Analysis Quiz for Indian Skin Tones",
  description:
    "Try Iconik's free colour analysis for Indian skin tones. Upload one daylight selfie and answer eight quick questions to explore your undertone and palette.",
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
        "Free selfie-based colour analysis for Indian skin tones, with eight questions and initial undertone and palette guidance.",
      path,
      datePublished: "2026-06-04",
      dateModified: "2026-10-07",
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
      <section className="bg-[#F8F3E9] px-4 pb-16 pt-28 text-center md:px-6 md:pb-24">
        <div className="mx-auto max-w-4xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-[#B68C52]">ICONIK Colour Analysis · Free</p>
          <h1 className="iconik-display text-5xl leading-none text-[#2C2622] md:text-7xl">Your colour analysis now starts with your actual photos.</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#2C2622]/65">Take one daylight selfie, tap through eight quick questions, and see your undertone, the shades that make you glow and the colours to skip, tried on your own photo.</p>
          <Link href="/style-scan" className="mt-8 inline-flex rounded-full bg-[#6A1F2B] px-8 py-4 text-sm font-semibold text-white">Start the Free Colour Analysis</Link>
        </div>
      </section>
      <section className="bg-white px-4 py-16 md:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-gray-400">
            Colour Analysis India
          </p>
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            What is the best free colour analysis quiz for Indian skin tones?
          </h2>
          <p className="mb-4 text-gray-600 leading-relaxed">
            Iconik&apos;s free colour analysis starts with a daylight selfie and eight quick questions. Explore your undertone, the shades that make you glow, and colours to skip against your own photo. Treat the result as a starting point: lighting and camera settings can affect how your skin appears.
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
      <section className="bg-[#F8F3E9] px-4 py-16 md:px-6" aria-labelledby="colour-quiz-faq">
        <div className="mx-auto max-w-3xl">
          <h2 id="colour-quiz-faq" className="mb-6 text-3xl font-bold text-gray-900">Free colour analysis questions</h2>
          {faqs.map(faq => <div key={faq.q} className="mb-6">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">{faq.q}</h3>
            <p className="leading-relaxed text-gray-700">{faq.a}</p>
          </div>)}
          <Link href="/privacy-policy" className="text-gray-900 underline">Read our privacy policy</Link>
        </div>
      </section>
    </>
  );
}
