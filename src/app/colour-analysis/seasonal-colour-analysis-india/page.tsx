import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Seasonal Colour Analysis for Indian Skin Tones — Iconik",
  description: "Does seasonal colour analysis work for Indian women? Why the Spring/Summer/Autumn/Winter system was calibrated for European skin, and what Chromatic Harmony Mapping™ does instead.",
  keywords: "seasonal colour analysis Indian women, seasonal colour analysis India, does seasonal colour analysis work Indian skin, spring summer autumn winter colour India, 12 season colour analysis India, colour analysis Indian skin",
  alternates: { canonical: "https://www.iconik.pro/colour-analysis/seasonal-colour-analysis-india" },
  openGraph: {
    title: "Seasonal Colour Analysis for Indian Skin Tones — Iconik",
    description: "Does the Spring/Summer/Autumn/Winter system work for Indian women? The honest answer, and what CHM™ does differently.",
    url: "https://www.iconik.pro/colour-analysis/seasonal-colour-analysis-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Seasonal colour analysis for Indian skin — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Seasonal Colour Analysis for Indian Skin Tones — Iconik",
    description: "Does the Spring/Summer/Autumn/Winter system work for Indian women? The honest answer, and what CHM™ does differently.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "Am I an Autumn or Winter in seasonal colour analysis if I am Indian?",
    a: "Most Indian women get classified as Autumn or Winter under the standard four-season system — but this is partly a limitation of the system, not a precise analysis. The system was calibrated on Northern European colouring and its 'Winter' and 'Autumn' categories cover an extremely broad range of Indian skin types without distinguishing between them meaningfully. Two Indian women with opposite undertones can both receive the same 'Winter' classification and be given incompatible colour advice as a result.",
  },
  {
    q: "Is seasonal colour analysis accurate for Indian women?",
    a: "Partially. The core warm/cool undertone distinction that underlies seasonal colour analysis is accurate and relevant for Indian women. However, the four seasonal archetypes (Spring, Summer, Autumn, Winter) were built around Northern European skin characteristics — specific hair, eye, and skin combinations that do not map cleanly onto Indian colouring. The result is that Indian women often get forced into a seasonal category that doesn't reflect their true palette. The undertone principle is sound; the seasonal system that was built on top of it is not well-calibrated for Indian skin.",
  },
  {
    q: "What is the difference between seasonal colour analysis and Chromatic Harmony Mapping™?",
    a: "Seasonal colour analysis uses four archetypes (Spring, Summer, Autumn, Winter) built around Northern European skin colouring to assign a palette. Chromatic Harmony Mapping™ uses undertone (warm, cool, neutral) as the primary variable and melanin depth as a secondary variable, calibrated specifically for the full range of Indian skin tones — from fair to deep, including olive and wheatish skin. CHM™ also includes specific guidance for Indian ethnic wear (sarees, kurtas, lehengas) that seasonal colour analysis, a Western system, does not address.",
  },
  {
    q: "Does the 12-season or 16-season colour analysis system work better for Indian women?",
    a: "The expanded seasonal systems (12-season, 16-season) refine the original four-season framework with subcategories like 'True Autumn' or 'Soft Summer.' These are more precise than the basic four-season system, but they are still built on the same Western skin-tone calibration. Indian women may find the subcategories somewhat useful for narrowing their palette, but the fundamental limitation — that the archetypes were not built for South Asian skin — remains. A system built from scratch for Indian skin tones, like CHM™, will be more accurate.",
  },
  {
    q: "Can I do seasonal colour analysis at home?",
    a: "You can attempt a self-assessment using the vein test, white paper test, and gold vs silver test — these will reliably identify your warm or cool undertone, which is the core insight. What is harder to do at home is identify the nuances of seasonal subcategories (light/deep, muted/clear) and translate them into a precise palette. For Indian skin specifically, the translation from seasonal category to practical colour recommendations requires additional calibration that generic online tools do not provide.",
  },
];

const seasons = [
  {
    name: "Spring",
    description: "Warm + light. Calibrated for golden blonde hair, peachy skin, and light eyes. Palette: warm pastels, peach, coral, warm ivory.",
    indianFit: "Very few Indian women fit the Spring archetype. The light, delicate quality of Spring colours can wash out the higher melanin density of most Indian skin tones.",
  },
  {
    name: "Summer",
    description: "Cool + light/muted. Calibrated for ash blonde or light brown hair, pink-toned skin, light eyes. Palette: dusty rose, lavender, soft blue, muted cool tones.",
    indianFit: "Rare for Indian women. The muted, low-contrast Summer palette assumes a lighter skin-hair-eye combination than most Indian women have.",
  },
  {
    name: "Autumn",
    description: "Warm + deep/muted. Calibrated for auburn or brown hair, warm skin, hazel or brown eyes. Palette: terracotta, olive, warm browns, mustard.",
    indianFit: "The most common classification for Indian women — but it covers an enormous range, from light olive-skinned women to deep-toned women, often giving similar advice to people with very different actual palettes.",
  },
  {
    name: "Winter",
    description: "Cool + deep/clear. Calibrated for dark hair, high contrast between skin and features. Palette: jewel tones, black, white, icy pastels.",
    indianFit: "The second most common classification for Indian women. Also covers an enormous range. A Winter Indian woman with cool undertone may have very different optimal colours from a Winter European woman — but the system gives them the same advice.",
  },
];

export default function SeasonalColourAnalysisIndiaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis/seasonal-colour-analysis-india#article",
        "headline": "Seasonal Colour Analysis for Indian Skin Tones",
        "description": "An honest assessment of whether the Spring/Summer/Autumn/Winter seasonal colour analysis system works for Indian women, and how Chromatic Harmony Mapping™ was built specifically for Indian skin tones.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-04-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis/seasonal-colour-analysis-india" },
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
          { "@type": "ListItem", "position": 2, "name": "Colour Analysis", "item": "https://www.iconik.pro/colour-analysis" },
          { "@type": "ListItem", "position": 3, "name": "Seasonal Colour Analysis India", "item": "https://www.iconik.pro/colour-analysis/seasonal-colour-analysis-india" },
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
              <li className="text-gray-800 font-medium">Seasonal Colour Analysis India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Seasonal Colour Analysis for Indian Women: Does It Work?
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Seasonal colour analysis — the Spring, Summer, Autumn, Winter system — is the most widely known colour analysis framework in the world. The honest answer to whether it works for Indian women is: partially. The underlying principle (undertone) is correct. The seasonal archetypes built on top of it were not calibrated for Indian skin, and routinely misclassify Indian women or give them palettes that do not fit their specific colouring.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is Seasonal Colour Analysis?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Seasonal colour analysis was popularised in the 1980s by Carole Jackson&apos;s book <em>Color Me Beautiful</em>. It divides people into four seasonal types — Spring, Summer, Autumn, Winter — based on the warmth or coolness of their colouring and the contrast between their hair, eyes, and skin.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Each seasonal type is assigned a characteristic palette. Springs get warm, fresh colours. Summers get cool, muted colours. Autumns get warm, earthy colours. Winters get cool, high-contrast colours.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The core logic is sound: warm undertones harmonise with warm colours, cool undertones harmonise with cool colours. Where the system runs into difficulty for Indian women is in the <em>specific archetypes</em> — the detailed seasonal palettes and colour recommendations — which were built around Northern European skin, hair, and eye characteristics.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">The Four Seasons — and Where They Fall Short for Indian Skin</h2>
            <div className="space-y-5">
              {seasons.map((s) => (
                <div key={s.name} className="border border-gray-200 rounded-xl p-5">
                  <p className="font-semibold text-gray-900 mb-1">{s.name}</p>
                  <p className="text-sm text-gray-600 mb-3">{s.description}</p>
                  <p className="text-sm text-gray-500 italic border-t border-gray-100 pt-3"><strong className="text-gray-700 not-italic">For Indian skin:</strong> {s.indianFit}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Was Seasonal Colour Analysis Built for European Skin?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The seasonal system was developed in the United States and Europe in the 1970s–80s, drawing on earlier colour theory work by Johannes Itten and Suzanne Caygill. Its archetypes — the hair colours, eye colours, and skin tones assigned to each season — reflect the range of colouring common in Northern and Western Europe.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              This means the system has inherent gaps when applied to South Asian, East Asian, or African skin tones. For Indian women specifically, three issues arise:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Melanin density is not accounted for.</strong> Indian skin generally has higher melanin concentration than the skin tones the seasonal archetypes were built around. This affects which shade intensities are most flattering — something the seasonal system&apos;s palettes don&apos;t adjust for.</li>
              <li><strong>The warm/cool distinction gets compressed.</strong> Because most Indian women&apos;s colouring falls outside the expected Spring or Summer range, they get pushed into Autumn or Winter — categories that are broad enough to cover very different actual palettes.</li>
              <li><strong>No guidance for Indian ethnic wear.</strong> The seasonal system was built around Western clothing. It has no framework for saree colours, zari selection, lehenga palettes, or kurta styling — a significant practical gap for Indian women.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Chromatic Harmony Mapping™ Does Differently</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Chromatic Harmony Mapping™ is Iconik&apos;s colour analysis protocol, built specifically for Indian skin tones. Rather than forcing Indian colouring into a seasonal archetype designed for European skin, CHM™ uses two variables calibrated for Indian skin:
            </p>
            <div className="space-y-4 mb-6">
              <div className="border-l-4 border-gray-900 pl-5">
                <p className="font-semibold text-gray-900 mb-1">Undertone (primary variable)</p>
                <p className="text-gray-600 text-sm">Warm, cool, or neutral — the base pigment of your skin. The same core principle as seasonal colour analysis, but classified without the seasonal archetype overlay.</p>
              </div>
              <div className="border-l-4 border-gray-900 pl-5">
                <p className="font-semibold text-gray-900 mb-1">Melanin depth (secondary variable)</p>
                <p className="text-gray-600 text-sm">Fair, light-medium, medium (wheatish), medium-deep, or deep. Determines the shade intensity of colours that are most flattering — which the seasonal system handles poorly for Indian skin.</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The combination of these two variables produces a 10-colour palette specific to your actual colouring — not an archetype. CHM™ also includes specific colour recommendations for Indian ethnic wear, including saree colours, zari guidance, and blouse fabric suggestions.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-900">Feature</th>
                    <th className="text-left p-4 font-semibold text-gray-900">Seasonal Analysis</th>
                    <th className="text-left p-4 font-semibold text-gray-900">CHM™</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    ["Calibrated for Indian skin", "No", "Yes"],
                    ["Undertone analysis", "Yes", "Yes"],
                    ["Melanin depth analysis", "Limited", "Yes"],
                    ["Ethnic wear guidance", "No", "Yes (sarees, kurtas, lehengas)"],
                    ["Zari and jewellery guidance", "No", "Yes"],
                    ["Archetypes or individual palette", "Archetype-based", "Individual"],
                  ].map(([feature, seasonal, chm]) => (
                    <tr key={feature} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-700 font-medium">{feature}</td>
                      <td className="p-4 text-gray-500">{seasonal}</td>
                      <td className="p-4 text-gray-900 font-medium">{chm}</td>
                    </tr>
                  ))}
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
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones — Full Guide</Link></li>
              <li>→ <Link href="/colour-analysis/indian-skin-tones" className="underline hover:opacity-70">Why Standard Colour Analysis Fails Indian Women</Link></li>
              <li>→ <Link href="/colour-analysis/warm-cool-neutral-undertone-india" className="underline hover:opacity-70">Warm vs Cool vs Neutral Undertone: Complete Guide</Link></li>
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone at Home</Link></li>
              <li>→ <Link href="/methodology/chromatic-harmony-mapping" className="underline hover:opacity-70">How Chromatic Harmony Mapping™ Works</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get colour analysis built for Indian skin</h2>
            <p className="text-gray-600 mb-6">Chromatic Harmony Mapping™ gives you a 10-colour palette calibrated to your actual undertone and melanin depth — not a seasonal archetype designed for European skin.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Seasonal Colour Analysis for Indian Women: Does It Work?&quot; Iconik, 2025. https://www.iconik.pro/colour-analysis/seasonal-colour-analysis-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
