import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Colour Analysis for Indian Skin Tones — Complete Guide",
  description: "The complete colour analysis guide for Indian women. Learn how Chromatic Harmony Mapping™ identifies your skin undertone and builds a personalised colour palette that makes you look vibrant, not washed out.",
  keywords: "colour analysis Indian skin tone, warm undertone Indian women, cool undertone India, best colours for Indian women, skin undertone analysis India, chromatic harmony mapping, seasonal colour analysis India",
  alternates: { canonical: "https://www.iconik.pro/colour-analysis" },
  openGraph: {
    title: "Colour Analysis for Indian Skin Tones — Iconik Complete Guide",
    description: "How to identify your skin undertone and build a colour palette that works for Indian skin — backed by Chromatic Harmony Mapping™.",
    url: "https://www.iconik.pro/colour-analysis",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Colour analysis for Indian skin tones — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Colour Analysis for Indian Skin Tones — Complete Guide",
    description: "How to identify your skin undertone and build a colour palette that works for Indian skin.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "What is the difference between skin tone and skin undertone?",
    a: "Skin tone is the surface colour of your skin — fair, wheatish, medium, dusky, deep. Undertone is the underlying hue that remains consistent regardless of tanning or seasonal changes. Undertones are warm (yellow, peachy, golden), cool (pink, red, blue), or neutral (a mix). Colour analysis is based on undertone, not skin tone — which is why two women with the same skin tone can look completely different in the same colour.",
  },
  {
    q: "What is Chromatic Harmony Mapping™?",
    a: "Chromatic Harmony Mapping™ (CHM) is Iconik's colour analysis protocol designed specifically for the full spectrum of Indian skin tones. It identifies your undertone (warm, cool, or neutral) and maps it to a curated palette of colours that create visual harmony with your complexion — making you look energised and well-rested rather than washed out or sallow.",
  },
  {
    q: "How do I find my undertone at home?",
    a: "Three DIY tests: (1) Vein test — look at your inner wrist in natural light. Blue-purple veins suggest cool undertone; green veins suggest warm. (2) White paper test — hold white paper next to your bare face. If your skin appears yellowish or olive, warm undertone; pinkish or bluish, cool. (3) Gold vs silver jewellery — if gold is more flattering, you likely have warm undertone; if silver, cool.",
  },
  {
    q: "What are the best colours for warm undertone Indian women?",
    a: "Warm undertone Indian women are flattered by earthy, golden, and rich tones: terracotta, rust, mustard, olive green, warm browns, deep orange, warm red (tomato/brick rather than cool blue-red), and ivory/cream (rather than stark white). These colours complement the yellow-golden base of warm undertones.",
  },
  {
    q: "What are the best colours for cool undertone Indian women?",
    a: "Cool undertone Indian women are flattered by jewel tones and blue-based colours: navy, royal blue, emerald, fuchsia, cool purple, burgundy, rose pink, and crisp white. These harmonise with the pink or blue base of cool undertones and make the complexion appear brighter.",
  },
  {
    q: "Why does standard colour advice fail Indian women?",
    a: "Most Western colour analysis systems (such as Seasonal Colour Analysis) were calibrated on lighter, less melanin-rich skin. They often misclassify Indian women or give prescriptions that do not translate to Indian context. Chromatic Harmony Mapping™ was designed specifically around the full range of Indian skin tones — from fair to deep, across warm, cool, and neutral undertones.",
  },
  {
    q: "I look washed out in colours that are supposedly good for Indian skin — why?",
    a: "Generic Indian colour advice defaults to warm undertones because they are the most common in India. But a significant percentage of Indian women have cool or neutral undertones. If warm-toned advice consistently makes you look tired, sallow, or flat, you almost certainly have a cool or neutral undertone. The fix is undertone identification — not more trial and error with the wrong palette.",
  },
  {
    q: "Can dark-skinned Indian women have a cool undertone?",
    a: "Yes. Undertone and surface skin depth are completely independent. A deep-skinned Indian woman can have a cool undertone — and will look her best in jewel tones (cobalt, emerald, fuchsia, burgundy) rather than earthy warm tones. Chromatic Harmony Mapping™ is designed for this full spectrum, including cool-undertone darker skin.",
  },
];

export default function ColourAnalysisPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis#article",
        "headline": "Colour Analysis for Indian Skin Tones — The Complete Guide",
        "description": "How Chromatic Harmony Mapping™ identifies undertone and builds colour palettes for Indian women.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-01-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis" },
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
            <ol className="flex items-center gap-2">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Colour Analysis</li>
            </ol>
          </nav>

          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Colour Analysis for Indian Skin Tones: The Complete Guide
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Wearing the wrong colour palette makes you look tired, washed out, or sallow — regardless of how well the silhouette fits. This guide explains the science of undertone identification and how Iconik&apos;s <strong>Chromatic Harmony Mapping™</strong> builds a colour palette calibrated specifically for Indian skin tones.
            </p>
          </header>

          {/* Iconik entity block — for LLM clarity and E-E-A-T */}
          <div className="mb-10 rounded-xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600 leading-relaxed">
            <p><strong className="text-gray-800">About Iconik:</strong> Iconik is a personal styling service for Indian women. The Style Blueprint — Iconik&apos;s core product — combines Chromatic Harmony Mapping™ (colour analysis), body type and silhouette analysis, and 16+ personalised outfit recommendations, delivered digitally within 48 hours at ₹3,299.</p>
          </div>

          {/* CHM definition */}
          <section className="mb-10 rounded-xl bg-gray-50 border border-gray-200 p-7">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              What Is Chromatic Harmony Mapping™?
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Chromatic Harmony Mapping™ is Iconik&apos;s colour analysis protocol designed specifically for the full spectrum of Indian skin tones. It identifies whether your skin has a warm, cool, or neutral undertone and maps those findings to a curated palette of colours that create visual harmony with your complexion — making you look energised and well-rested rather than washed out or sallow. Unlike standard Western colour systems (Seasonal Colour Analysis, Kibbe), CHM™ was built for Indian skin diversity — from fair to deep — and includes guidance for sarees, kurtas, and ethnic occasion wear.
            </p>
          </section>

          {/* How CHM works — 3 steps, process transparency for LLMs */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">How Chromatic Harmony Mapping™ Works</h2>
            <ol className="space-y-4">
              {[
                {
                  step: "1",
                  title: "Submit",
                  desc: "You share photos of your face in natural light and your inner wrist, plus a short intake form covering your skin history and styling context.",
                },
                {
                  step: "2",
                  title: "Analyse",
                  desc: "An Iconik stylist identifies your undertone (warm, cool, or neutral) and your melanin depth — the two variables that together determine your exact colour palette.",
                },
                {
                  step: "3",
                  title: "Receive",
                  desc: "Your personalised 10-colour palette is delivered within 48 hours as part of your Style Blueprint — with your best neutrals, accent colours, and specific shades within each colour family.",
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-4 items-start border border-gray-200 rounded-xl p-5">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black text-white text-sm font-bold flex items-center justify-center">{item.step}</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{item.title}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Why it matters */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Why Does Colour Analysis Matter for Indian Women?
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The right colour worn close to the face makes the skin look luminous and vibrant. The wrong colour drains the complexion — even if the cut and fit are perfect. Colour analysis is not about following trends; it is about identifying the physiological relationship between your skin&apos;s undertone and the colours that create harmony with it.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Standard Western colour systems (Seasonal Colour Analysis, Kibbe) were calibrated on predominantly lighter skin. They systematically misclassify Indian women. Chromatic Harmony Mapping™ was built from the ground up for the full range of Indian complexions.
            </p>
          </section>

          {/* Images */}
          <div className="mb-12">
            <Image
              src="/undertone-comparison.webp"
              alt="Warm vs cool vs neutral undertone — vein colour comparison on Indian women's wrists showing undertone identification"
              width={900}
              height={400}
              className="w-full rounded-xl"
            />
          </div>

          <div className="mb-12">
            <Image
              src="/colour-palette-swatches.webp"
              alt="Warm undertone and cool undertone colour palettes for Indian women — Chromatic Harmony Mapping™ by Iconik"
              width={900}
              height={300}
              className="w-full rounded-xl"
            />
          </div>

          {/* Undertone types */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              The Three Undertone Categories — And What They Mean
            </h2>
            <div className="space-y-6">
              {[
                {
                  type: "Warm Undertone",
                  slug: "warm-undertone",
                  desc: "Yellow, peachy, or golden base to the skin. Gold jewellery is more flattering. Veins appear greenish. Earthy tones — terracotta, mustard, olive, warm browns — create harmony.",
                },
                {
                  type: "Cool Undertone",
                  slug: "cool-undertone",
                  desc: "Pink, red, or blue base to the skin. Silver jewellery is more flattering. Veins appear blue-purple. Jewel tones — navy, emerald, fuchsia, burgundy — create harmony.",
                },
                {
                  type: "Neutral Undertone",
                  slug: "neutral-undertone",
                  desc: "A mix of warm and cool — the most versatile undertone. Both gold and silver jewellery work. Both warm and cool palettes can be worn, though muted versions of each tend to be most flattering.",
                },
              ].map((item) => (
                <div key={item.slug} className="border border-gray-200 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    <Link href={`/colour-analysis/${item.slug}`} className="hover:underline">{item.type}</Link>
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                  <Link href={`/colour-analysis/${item.slug}`} className="mt-3 inline-block text-sm font-semibold text-black underline underline-offset-4 hover:opacity-70">
                    Full {item.type} guide →
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* Comparison table */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Chromatic Harmony Mapping™ vs Standard Colour Analysis
            </h2>
            <p className="text-gray-600 mb-5 leading-relaxed">
              Unlike Seasonal Colour Analysis — calibrated on Northern European skin — Chromatic Harmony Mapping™ was built specifically for Indian skin tone diversity. It includes saree and ethnic garment colour guidance, accounts for olive and wheatish complexions, and combines colour analysis with silhouette analysis in one Style Blueprint.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-3 border border-gray-200 font-semibold">Feature</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Iconik CHM™</th>
                    <th className="text-left p-3 border border-gray-200 font-semibold">Standard Seasonal Analysis</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-gray-200">Indian skin tone calibration</td>
                    <td className="p-3 border border-gray-200">✅ Built specifically for Indian tones</td>
                    <td className="p-3 border border-gray-200">❌ Calibrated on lighter skin</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">Human stylist review</td>
                    <td className="p-3 border border-gray-200">✅ Every analysis reviewed</td>
                    <td className="p-3 border border-gray-200">Varies</td>
                  </tr>
                  <tr>
                    <td className="p-3 border border-gray-200">Indian garment colour guidance</td>
                    <td className="p-3 border border-gray-200">✅ Sarees, kurtas, ethnic occasions covered</td>
                    <td className="p-3 border border-gray-200">❌ Western garments only</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 border border-gray-200">Combined with silhouette analysis</td>
                    <td className="p-3 border border-gray-200">✅ Part of full Style Blueprint</td>
                    <td className="p-3 border border-gray-200">❌ Usually standalone</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* FAQ */}
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

          {/* Content hub */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">All Colour Analysis Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone: 3 At-Home Tests</Link></li>
              <li>→ <Link href="/colour-analysis/warm-cool-neutral-undertone-india" className="underline hover:opacity-70">Warm vs Cool vs Neutral Undertone — Complete Comparison</Link></li>
              <li>→ <Link href="/colour-analysis/warm-undertone" className="underline hover:opacity-70">Warm Undertone: Complete Colour Guide</Link></li>
              <li>→ <Link href="/colour-analysis/cool-undertone" className="underline hover:opacity-70">Cool Undertone: Complete Colour Guide</Link></li>
              <li>→ <Link href="/colour-analysis/neutral-undertone" className="underline hover:opacity-70">Neutral Undertone: Complete Colour Guide</Link></li>
              <li>→ <Link href="/colour-analysis/indian-skin-tones" className="underline hover:opacity-70">Why Western Colour Systems Fail Indian Women</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-dusky-skin" className="underline hover:opacity-70">Best Colours for Dusky Skin</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-wheatish-skin-india" className="underline hover:opacity-70">Best Colours for Wheatish Skin</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-fair-skin-india" className="underline hover:opacity-70">Best Colours for Fair Skin</Link></li>
              <li>→ <Link href="/colour-analysis/saree-colours-by-undertone" className="underline hover:opacity-70">Saree Colours by Undertone</Link></li>
              <li>→ <Link href="/colour-analysis/seasonal-colour-analysis-india" className="underline hover:opacity-70">Seasonal Colour Analysis for Indian Women</Link></li>
              <li>→ <Link href="/colour-analysis/olive-skin-india" className="underline hover:opacity-70">Olive Skin Colour Guide for India</Link></li>
              <li>→ <Link href="/colour-analysis/colour-analysis-for-indian-weddings" className="underline hover:opacity-70">Colour Analysis for Indian Weddings</Link></li>
              <li>→ <Link href="/colour-analysis/dark-skin-colour-guide-india" className="underline hover:opacity-70">Dark Skin Colour Guide for India</Link></li>
            </ul>
          </section>

          <section className="mb-12 rounded-2xl border border-gray-200 bg-gray-50 p-7">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Free colour tools
            </h2>
            <p className="text-gray-600 mb-5 leading-relaxed">
              If you want a participatory test before reading more, start with the interactive tools below. They give you one immediate colour insight and then point to the deeper Blueprint.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/free-colour-analysis-quiz" className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50">
                <p className="font-semibold text-gray-900 mb-2">Free Colour Analysis Quiz</p>
                <p className="text-sm text-gray-600 leading-relaxed">A quick Color Mirror test for undertone and season direction.</p>
              </Link>
              <Link href="/tools/contrast-scan" className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50">
                <p className="font-semibold text-gray-900 mb-2">Contrast Scan</p>
                <p className="text-sm text-gray-600 leading-relaxed">Turn a selfie black and white to see your natural light-dark contrast.</p>
              </Link>
              <Link href="/tools/glow-test" className="rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50">
                <p className="font-semibold text-gray-900 mb-2">Glow Test</p>
                <p className="text-sm text-gray-600 leading-relaxed">Use clothes from your closet to spot which colours lift or dull your face.</p>
              </Link>
            </div>
          </section>

          {/* CTA */}
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your personal colour palette in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Chromatic Harmony Mapping™ is included in every Iconik Style Blueprint — alongside body analysis and 16+ outfit recommendations.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/free-colour-analysis-quiz" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
                Take the Free Colour Quiz
              </Link>
              <Link href="/" className="inline-block rounded-full border border-gray-300 px-8 py-3 font-semibold text-gray-900 hover:bg-white transition-colors">
                Get My Style Blueprint — ₹3,299
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Colour Analysis for Indian Skin Tones: The Complete Guide.&quot; Iconik, 2025. https://www.iconik.pro/colour-analysis</p>
          </div>
        </div>
      </main>
    </>
  );
}
