import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Find Your Undertone: 3 At-Home Tests — Iconik",
  description: "Identify your skin undertone at home with three simple tests: vein colour, white paper, and gold vs silver. Complete undertone guide for Indian women — warm, cool, or neutral.",
  keywords: "how to find undertone, undertone test at home India, warm or cool undertone test, vein test undertone, how to know your undertone Indian skin",
  alternates: { canonical: "https://www.iconik.pro/colour-analysis/how-to-find-undertone" },
  openGraph: {
    title: "How to Find Your Undertone: 3 At-Home Tests — Iconik",
    description: "Three simple at-home tests reveal your undertone. Complete Indian skin tone guide.",
    url: "https://www.iconik.pro/colour-analysis/how-to-find-undertone",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "How to find your undertone — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Find Your Undertone: 3 At-Home Tests — Iconik",
    description: "Three simple at-home tests reveal your undertone. Complete Indian skin tone guide.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "Is the vein test accurate for Indian skin?",
    a: "Yes, but check the inner wrist only. Deeper skin tones may find the paper test more reliable because the vein colour can be harder to distinguish through higher melanin. Always check in natural daylight, not under yellow artificial light.",
  },
  {
    q: "Can your undertone change?",
    a: "No. Surface skin tone changes with sun exposure but undertone is determined by your melanin type ratio (eumelanin vs pheomelanin) and is fixed throughout your life. Even after tanning or with ageing, your undertone remains the same.",
  },
  {
    q: "What if all three tests give different results?",
    a: "The white paper test in natural daylight is the most reliable single test. If results are still mixed, you likely have a neutral undertone — a balance of both warm and cool. Neutral is a genuine undertone category, not an absence of one.",
  },
  {
    q: "Can I have a dark skin tone and a cool undertone?",
    a: "Yes. Undertone is completely independent of skin depth. Many dark-skinned Indian women have cool undertones and look their best in jewel tones and cool blues rather than earthy warm colours. Chromatic Harmony Mapping™ is designed for this full spectrum.",
  },
];

export default function HowToFindUndertone() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis/how-to-find-undertone#article",
        "headline": "What is My Undertone? 3 Tests You Can Do at Home",
        "description": "Three simple at-home tests to identify your skin undertone — designed for Indian skin tones.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-01-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis/how-to-find-undertone" },
      },
      {
        "@type": "HowTo",
        "name": "How to Find Your Skin Undertone at Home",
        "description": "Three simple at-home tests to identify whether you have a warm, cool, or neutral skin undertone — calibrated for Indian skin tones.",
        "step": [
          {
            "@type": "HowToStep",
            "position": 1,
            "name": "The Vein Colour Test",
            "text": "Look at the veins on your inner wrist in natural daylight. Blue-purple veins indicate cool undertone; green veins indicate warm undertone; a mix suggests neutral undertone.",
          },
          {
            "@type": "HowToStep",
            "position": 2,
            "name": "The White Paper Test",
            "text": "Hold a plain white sheet of paper next to your bare face in natural daylight. If your skin appears yellowish, golden, or olive, you have a warm undertone. If it appears pinkish, bluish, or greyish, you have a cool undertone. If neither is clear, you likely have a neutral undertone.",
          },
          {
            "@type": "HowToStep",
            "position": 3,
            "name": "The Gold vs Silver Test",
            "text": "Hold a piece of gold jewellery against your bare inner wrist, then a piece of silver. Whichever makes your skin look more radiant and alive indicates your undertone: gold = warm, silver = cool, both equally flattering = neutral.",
          },
        ],
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
          { "@type": "ListItem", "position": 3, "name": "How to Find Your Undertone", "item": "https://www.iconik.pro/colour-analysis/how-to-find-undertone" },
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
              <li className="text-gray-800 font-medium">How to Find Your Undertone</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              What is My Undertone? 3 Tests You Can Do at Home
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Your skin undertone is a fixed underlying tone beneath your surface skin colour — it does not change with sun exposure, ageing, or seasons. Knowing it is the foundation of Iconik&apos;s Chromatic Harmony Mapping™, and you can identify it accurately at home in under five minutes.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Exactly Is a Skin Undertone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Your skin has two layers of colour working simultaneously. The surface tone is what you see — fair, medium, dusky, or deep — and it shifts with sun, season, and age. The undertone is the fixed hue underneath: warm (yellow, golden, peachy), cool (pink, blue, red), or neutral (a balance of both).
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The reason this matters: a colour that creates harmony with your undertone makes your skin look vibrant, well-rested, and energised. A colour that clashes with your undertone makes you look washed out, sallow, or tired — regardless of how beautiful the colour is in isolation.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Indian women often confuse surface tone with undertone. Two women with the same &quot;wheatish&quot; complexion can have opposite undertones — and need completely different colour palettes. This is precisely why generic &quot;best colours for Indian skin&quot; advice fails half the women it targets.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Test 1: The Vein Colour Test</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Look at the veins on your inner wrist in natural daylight — not under fluorescent office lights or warm lamp light. Natural daylight is the only accurate context for this test.
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Blue-purple veins:</strong> cool undertone</li>
              <li><strong>Green veins:</strong> warm undertone</li>
              <li><strong>A mix of both, or hard to tell:</strong> neutral undertone</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              For Indian women: check the inner wrist (the pale inner side), not the back of the hand. The inner wrist has less sun exposure, making vein colour more distinguishable. If your skin is very deep in tone, this test may be less clear — use it alongside Test 2.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Test 2: The White Paper Test</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Hold a plain white A4 sheet of paper next to your bare face in natural daylight (by a window, not under artificial light). Compare what you see:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Your skin looks yellowish, golden, or olive:</strong> warm undertone</li>
              <li><strong>Your skin looks pinkish, bluish, or greyish:</strong> cool undertone</li>
              <li><strong>Neither clearly — your skin just looks &quot;normal&quot;:</strong> neutral undertone</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              This test is the most reliable for deeper Indian skin tones because it works by contrast rather than requiring you to read vein colour through melanin. The white of the paper makes the undertone cast of your skin much more visible.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Test 3: The Gold vs Silver Test</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Hold a piece of gold jewellery against your bare skin (inner wrist or décolletage). Then hold a piece of silver. Which makes your skin look more alive, radiant, and healthy?
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Gold looks better:</strong> warm undertone</li>
              <li><strong>Silver looks better:</strong> cool undertone</li>
              <li><strong>Both look equally flattering:</strong> neutral undertone</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              This test works because gold is a warm metal (yellow-based) and silver is a cool metal (blue-based). Your undertone naturally harmonises with one. Use actual gold and silver jewellery, not gold-toned or silver-toned fashion jewellery which may have different underlying tones.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Are Undertone Tests Harder for Indian Women?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Indian skin has higher melanin concentrations than the Caucasian skin these tests were originally developed for. Higher melanin can mask undertone cues — making veins harder to read at deeper skin tones.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Two adjustments that improve accuracy for Indian skin:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li>Always use the inner wrist or inner arm — areas with least sun exposure and therefore least melanin masking.</li>
              <li>Test in natural daylight only. Warm artificial light casts a yellow glow on everyone, skewing results toward &quot;warm.&quot; Fluorescent light does the opposite.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              If you have recently tanned, wait until the tan fades before testing. A fresh tan changes the surface tone significantly and can skew all three tests.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Should You Do Once You Know Your Undertone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Warm undertone:</strong> Your palette is earthen, golden, and rich. Terracotta, rust, burnt orange, mustard yellow, olive green, camel, warm reds, coral, peach, earthy browns. Gold jewellery. Ivory over stark white.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Cool undertone:</strong> Your palette is jewelled and crisp. Cobalt blue, emerald green, royal purple, cool pinks, fuchsia, icy pastels, navy, burgundy. Silver or white gold jewellery. Stark white works well.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Neutral undertone:</strong> You can wear both warm and cool colours, but shine brightest in muted, greyed versions. You have the widest range but often look best when colours are not at full saturation extremes.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Iconik&apos;s Chromatic Harmony Mapping™ takes this further — it maps your specific undertone and melanin depth to an exact 10-colour palette, with your best neutrals, accent colours, and the specific shades within each colour family that work best for you.
            </p>
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
              <li>→ <Link href="/colour-analysis/warm-cool-neutral-undertone-india" className="underline hover:opacity-70">Warm vs Cool vs Neutral Undertone: Complete Comparison</Link></li>
              <li>→ <Link href="/colour-analysis/indian-skin-tones" className="underline hover:opacity-70">Why Western Colour Systems Fail Indian Women</Link></li>
              <li>→ <Link href="/colour-analysis/warm-undertone" className="underline hover:opacity-70">Warm Undertone Colour Guide</Link></li>
              <li>→ <Link href="/colour-analysis/cool-undertone" className="underline hover:opacity-70">Cool Undertone Colour Guide</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your exact colour palette in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Iconik&apos;s Chromatic Harmony Mapping™ identifies your undertone and maps it to an exact 10-colour palette — part of your personalised Style Blueprint.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;What is My Undertone? 3 Tests You Can Do at Home.&quot; Iconik, 2025. https://www.iconik.pro/colour-analysis/how-to-find-undertone</p>
          </div>

        </div>
      </main>
    </>
  );
}
