import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SeoEditorialFooter, SeoEditorialHeader } from "@/components/seo/SeoEditorial";
import { buildArticleMetadata } from "@/lib/seo";
import { FOUNDERS } from "@/lib/siteFacts";

export const metadata: Metadata = buildArticleMetadata({
  title: "Chromatic Harmony Mapping: ICONIK's Colour Method",
  description: "The canonical explanation of ICONIK's colour styling framework: what it considers, how it is applied to Indian wardrobes, and what its limits are.",
  path: "/methodology/chromatic-harmony-mapping",
  datePublished: "2025-01-01",
  dateModified: "2026-07-24",
  authorPath: "/about#jasmine-rana",
  keywords: ["Chromatic Harmony Mapping", "ICONIK colour method", "colour analysis Indian skin"],
});

const faqs = [
  {
    q: "Who developed Chromatic Harmony Mapping™?",
    a: "Chromatic Harmony Mapping™ was developed by the ICONIK methodology team and is reviewed by Jasmine Rana, Co-Founder and Head Stylist. It adapts colour-comparison principles to Indian skin-depth examples, olive undertones and Indian wardrobe categories.",
  },
  {
    q: "What undertones does CHM™ identify?",
    a: "CHM identifies three primary undertones: warm (yellow/golden base), cool (pink/blue/red base), and neutral (a balance of both). Within each, it further calibrates for melanin depth and contrast level — producing a palette that is precise to the individual, not just the undertone category.",
  },
  {
    q: "Is Chromatic Harmony Mapping™ the same as seasonal colour analysis?",
    a: "No. CHM does not assign a Spring, Summer, Autumn or Winter season. It uses undertone, skin depth, contrast and wardrobe context to produce a focused palette. Seasonal analysis can still be useful when it is applied by an experienced practitioner with representative drapes.",
  },
  {
    q: "How is CHM™ delivered in an Iconik Blueprint?",
    a: "Your Blueprint includes your identified undertone, your 10-colour harmony palette with exact colour names and references, your 3 best neutrals, your 3 strongest accent colours, colours to avoid, and a guide to applying those colours to your most common garment categories including Indian ethnic wear.",
  },
];

export default function ChromaticHarmonyMappingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "What is Chromatic Harmony Mapping™?",
        "description": "The canonical explanation of ICONIK's proprietary colour styling framework for Indian wardrobes.",
        "author": {
          "@type": "Person",
          "name": FOUNDERS[0].name,
          "jobTitle": FOUNDERS[0].title,
          "sameAs": FOUNDERS[0].linkedIn,
        },
        "reviewedBy": {
          "@type": "Person",
          "name": FOUNDERS[0].name,
          "jobTitle": FOUNDERS[0].title,
          "sameAs": FOUNDERS[0].linkedIn,
        },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "dateModified": "2026-07-24",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/methodology/chromatic-harmony-mapping" },
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map((f) => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "Methodology", "item": "https://www.iconik.pro/methodology" },
          { "@type": "ListItem", "position": 3, "name": "Chromatic Harmony Mapping™", "item": "https://www.iconik.pro/methodology/chromatic-harmony-mapping" },
        ],
      },
    ],
  };

  return (
    <div className="seo-editorial min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoEditorialHeader />
      <main className="px-4 py-16 md:py-24">
        <div className="seo-classic-article mx-auto max-w-3xl">

          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
            <ol className="flex items-center gap-2 flex-wrap">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link href="/methodology" className="hover:underline">Methodology</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Chromatic Harmony Mapping™</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Chromatic Harmony Mapping™: ICONIK&apos;s Colour Method
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Chromatic Harmony Mapping™ (CHM) is ICONIK&apos;s proprietary styling framework for comparing undertone, skin depth, contrast and wardrobe context. It produces a focused palette for the client&apos;s real garments; it is not a medical test and does not claim that one set of colours is objectively compulsory.
            </p>
            <p className="mt-4 text-sm text-gray-500">Updated 24 July 2026 · Reviewed by Jasmine Rana, Co-Founder and Head Stylist</p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why ICONIK Adapted Conventional Colour Analysis</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Seasonal colour analysis organises people into palettes such as Spring, Summer, Autumn and Winter. Many publicly available examples and drape sets show a limited range of skin depths and focus on Western garment categories, which can make the method difficult to translate to Indian wardrobes.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Dark hair and eyes should not automatically result in an &quot;Autumn&quot; label. Controlled draping can reveal cool, neutral, olive, bright or muted characteristics across any skin depth.
            </p>
            <p className="text-gray-600 leading-relaxed">
              CHM keeps the useful practice of side-by-side colour comparison, then adds Indian skin-depth references, jewellery, ethnic wear and the client&apos;s actual wardrobe needs.
            </p>
          </section>

          <figure className="mb-12">
            <Image
              src="/colour-palette-swatches.webp"
              alt="Illustrative warm and cool colour groups used for controlled comparison in Chromatic Harmony Mapping"
              width={900}
              height={300}
              className="w-full rounded-xl"
            />
            <figcaption className="mt-3 text-sm leading-6 text-gray-500">Illustrative colour groups are starting points. A useful comparison holds lighting, makeup and camera settings constant.</figcaption>
          </figure>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Chromatic Harmony Mapping™ Work?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              CHM is a five-stage protocol:
            </p>
            <ol className="space-y-4 text-gray-600 list-decimal list-inside">
              <li><strong>Controlled colour comparison:</strong> Comparing warm, cool and neutral drapes near the face in indirect daylight. Vein and jewellery observations may be noted, but they are not treated as decisive on their own.</li>
              <li><strong>Melanin depth assessment:</strong> Identifying the depth of pigmentation — fair, medium, deep, or very deep — which determines how chromatic vs muted the palette recommendations should be.</li>
              <li><strong>Palette construction:</strong> Combining temperature, depth and clarity observations to select 10 useful reference colours.</li>
              <li><strong>Contrast level assessment:</strong> Determining whether the client has high-contrast colouring (e.g., very dark hair, fair skin) or low-contrast colouring — which affects whether high-contrast or tone-on-tone colour combinations work best.</li>
              <li><strong>Application guide:</strong> Translating the palette into practical guidance for Indian garment categories — which colours to use in sarees, kurtas, blouses, salwars, and dupattas.</li>
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Does CHM™ Produce?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The CHM output delivered in your Style Blueprint includes:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Your identified undertone (warm / cool / neutral)</li>
              <li>10 exact colours in your harmony palette, with colour names and references</li>
              <li>Your 3 best neutrals (for everyday wear foundations)</li>
              <li>Your 3 strongest accent colours (for statement pieces)</li>
              <li>Colours to avoid and why they clash with your undertone</li>
              <li>Guidance on applying the palette to Indian ethnic garment categories</li>
              <li>Your best white (stark white vs ivory vs warm cream)</li>
              <li>Your best metal for jewellery (gold vs silver vs both)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Is CHM™ Different from Seasonal Colour Analysis?</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 font-semibold text-gray-900">Feature</th>
                    <th className="text-left p-3 font-semibold text-gray-900">Seasonal Analysis</th>
                    <th className="text-left p-3 font-semibold text-gray-900">CHM™</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="p-3 font-medium">Framework</td><td className="p-3">4 seasons</td><td className="p-3">Undertone + depth + contrast</td></tr>
                  <tr><td className="p-3 font-medium">Indian context</td><td className="p-3">Depends on practitioner and drape set</td><td className="p-3">Indian skin-depth and wardrobe examples</td></tr>
                  <tr><td className="p-3 font-medium">Output</td><td className="p-3">Season category + general palette</td><td className="p-3">10 exact colours + application guide</td></tr>
                  <tr><td className="p-3 font-medium">Indian garments</td><td className="p-3">Depends on practitioner</td><td className="p-3">Kurta, saree and salwar application included</td></tr>
                  <tr><td className="p-3 font-medium">Skin depth</td><td className="p-3">Varies by system and practitioner</td><td className="p-3">Explicitly considered</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="divide-y divide-gray-200">
              {faqs.map((faq, i) => (
                <div key={i} className="py-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600 leading-relaxed faq-answer">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/methodology/geometric-silhouette-profiling" className="underline hover:opacity-70">What is Geometric Silhouette Profiling™?</Link></li>
              <li>→ <Link href="/methodology/facial-architecture-analysis" className="underline hover:opacity-70">What is Facial Architecture Analysis™?</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/colour-analysis/indian-skin-tones" className="underline hover:opacity-70">Indian Skin Tone Colour Guide</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want CHM™ applied to your skin within 5 working days after the consultation?</h2>
            <p className="text-gray-600 mb-6">Your Iconik Style Blueprint includes your full Chromatic Harmony Mapping™ colour palette — 10 exact colours, application guide, and Indian garment colour prescription.</p>
            <Link href="/offer-2699" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this article:</p>
            <p>Rana, Jasmine. &quot;Chromatic Harmony Mapping™: ICONIK&apos;s Colour Method.&quot; ICONIK LLP. Updated 24 July 2026. https://www.iconik.pro/methodology/chromatic-harmony-mapping</p>
          </div>

        </div>
      </main>
      <SeoEditorialFooter />
    </div>
  );
}
