import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Colour Analysis for Indian Skin Tones — Undertone Guide",
  description: "Why standard colour analysis fails Indian women — and how Chromatic Harmony Mapping™ was designed specifically for the full spectrum of Indian skin tones, from fair to deep.",
  keywords: "colour analysis Indian skin, undertone Indian skin tones, dusky skin colour guide India, dark skin colour palette India, olive skin colours India, best colours dusky skin Indian women",
  alternates: { canonical: "https://www.iconik.pro/colour-analysis/indian-skin-tones" },
  openGraph: {
    title: "Colour Analysis for Indian Skin Tones — Iconik",
    description: "How Chromatic Harmony Mapping™ was built for the full spectrum of Indian skin tones — from fair to deep.",
    url: "https://www.iconik.pro/colour-analysis/indian-skin-tones",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Colour analysis for Indian skin tones — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Colour Analysis for Indian Skin Tones — Iconik",
    description: "How Chromatic Harmony Mapping™ was built for the full spectrum of Indian skin tones — from fair to deep.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "Why does Western colour analysis not work well for Indian women?",
    a: "Most Western colour systems (Seasonal Colour Analysis, Kibbe) were developed and calibrated using lighter, less melanin-rich complexions as the base reference. When applied to Indian skin — which has significantly more melanin and a wider range of undertones — these systems produce inaccurate classifications. The 'cool Winter' or 'warm Autumn' categories often misclassify Indian women or prescribe palettes that look flat or clinical against Indian skin.",
  },
  {
    q: "What is the best colour for dusky or deep Indian skin?",
    a: "The best colours for dusky or deep Indian skin depend on the undertone, not just the depth. Dusky warm-undertone women are lit up by terracotta, mustard, olive, rust, and deep burnt orange. Dusky cool-undertone women look stunning in jewel tones — emerald, navy, fuchsia, and magenta. Dusky skin can carry bold, saturated colours that paler skin cannot — this is an advantage, not a limitation.",
  },
  {
    q: "Do Indian women with olive skin have warm or cool undertones?",
    a: "Olive skin often has a neutral-to-warm undertone, but not always. Olive skin has green-grey pigmentation in addition to melanin, which can make undertone identification tricky. The key tests are: veins (greenish = warm, blue-purple = cool), jewellery preference (gold = warm, silver = cool), and how your skin responds to warm vs cool clothing colours. Iconik's Chromatic Harmony Mapping™ was specifically designed to navigate the olive skin classification challenge.",
  },
  {
    q: "Can Indian women with fair skin have warm undertones?",
    a: "Absolutely. Skin depth (fair to deep) and undertone (warm vs cool) are independent variables. Many fair-skinned Indian women have warm undertones — their skin appears ivory or peachy rather than pinkish. The common mistake is assuming that fairer skin must be cool-toned. Undertone is determined by the underlying pigment, not the surface depth.",
  },
];

export default function IndianSkinTonesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis/indian-skin-tones#article",
        "headline": "Colour Analysis for Indian Skin Tones — Why Western Systems Fail and What Works Instead",
        "description": "Why standard colour analysis fails Indian women and how Chromatic Harmony Mapping™ was built for the full spectrum of Indian skin tones.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-01-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis/indian-skin-tones" },
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "Colour Analysis", "item": "https://www.iconik.pro/colour-analysis" },
          { "@type": "ListItem", "position": 3, "name": "Indian Skin Tones", "item": "https://www.iconik.pro/colour-analysis/indian-skin-tones" },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">

          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
            <ol className="flex items-center gap-2 flex-wrap">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link href="/colour-analysis" className="hover:underline">Colour Analysis</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Indian Skin Tones</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Colour Analysis for Indian Skin Tones: Why Western Systems Fail
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Indian women span one of the widest ranges of skin tone and undertone of any population in the world — from fair ivory to deep ebony, across warm, cool, and neutral undertones, with unique complexities like olive and wheatish skin that sit between standard categories. Standard Western colour analysis systems were not built for this range. Chromatic Harmony Mapping™ was.
            </p>
          </header>

          <div className="mb-12">
            <Image
              src="/undertone-comparison.webp"
              alt="Undertone identification for Indian skin — warm, cool, and neutral vein comparison"
              width={900}
              height={400}
              className="w-full rounded-xl"
              priority
            />
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Problem with Standard Colour Analysis for Indian Women</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The most widely used colour analysis system — Seasonal Colour Analysis — divides people into four seasonal palettes (Spring, Summer, Autumn, Winter) based on combinations of depth (light vs dark) and temperature (warm vs cool). This system was developed using predominantly Northern European skin as its reference baseline.
            </p>
            <p className="text-gray-600 leading-relaxed">
              When applied to Indian skin — which has significantly higher melanin density, a wider undertone range, and unique intermediate complexions like olive and wheatish — the seasonal system frequently misclassifies. Indian women are often told they are &quot;Autumn&quot; when they are actually cool-toned, or &quot;Winter&quot; when their undertone is neutral-warm. The resulting palette prescriptions look flat, clinical, or simply wrong.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Chromatic Harmony Mapping™ Is Different</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Chromatic Harmony Mapping™ was built from the ground up using Indian skin tone diversity as its reference. Key differences:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Undertone identification calibrated for olive and wheatish skin</strong> — the most commonly misclassified Indian skin types</li>
              <li><strong>Depth-adjusted palette recommendations</strong> — the same warm undertone looks different on fair, medium, and deep skin, and the palette reflects this</li>
              <li><strong>Indian garment colour guidance included</strong> — saree fabric colours, ethnic occasion colours, and regional colour traditions are part of the prescription</li>
              <li><strong>Human stylist review</strong> — every CHM analysis is reviewed before delivery</li>
            </ul>
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
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones — Full Guide</Link></li>
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone: 3 At-Home Tests</Link></li>
              <li>→ <Link href="/colour-analysis/warm-cool-neutral-undertone-india" className="underline hover:opacity-70">Warm vs Cool vs Neutral Undertone: Complete Comparison</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-dusky-skin" className="underline hover:opacity-70">Best Colours for Dusky Skin</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-wheatish-skin-india" className="underline hover:opacity-70">Best Colours for Wheatish Skin</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get your personalised colour palette in 48 hours</h2>
            <p className="text-gray-600 mb-6">Chromatic Harmony Mapping™ — included in every Iconik Style Blueprint.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Colour Analysis for Indian Skin Tones: Why Western Systems Fail.&quot; Iconik, 2025. https://www.iconik.pro/colour-analysis/indian-skin-tones</p>
          </div>
        </div>
      </main>
    </>
  );
}
