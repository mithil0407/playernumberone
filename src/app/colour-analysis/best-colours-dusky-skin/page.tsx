import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Colours for Dusky Skin: 16 Shades That Work (& What to Avoid)",
  description: "Yes, dusky skin can wear pastels — if they match your undertone. 16 colours that flatter dusky Indian skin, split by warm and cool undertone, plus the exact shades that wash you out.",
  keywords: "best colours for dusky skin tone India, colours for dark skin Indian women, what to wear dusky skin India, colour guide dusky skin Indian women, fashion for dark complexion India",
  alternates: { canonical: "https://www.iconik.pro/colour-analysis/best-colours-dusky-skin" },
  openGraph: {
    title: "Best Colours for Dusky Skin: 16 Shades That Work (& What to Avoid)",
    description: "16 colours that flatter dusky Indian skin, split by warm and cool undertone — plus the shades that wash you out.",
    url: "https://www.iconik.pro/colour-analysis/best-colours-dusky-skin",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Best colours for dusky skin tone India — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Colours for Dusky Skin: 16 Shades That Work (& What to Avoid)",
    description: "16 colours that flatter dusky Indian skin, split by warm and cool undertone — plus the shades that wash you out.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "Does melanin depth affect which colours work?",
    a: "Yes. Deeper skin tones generally need colours with sufficient chromatic intensity to create visual harmony. Very pale icy pastels can look washed out against deeper skin regardless of undertone. Chromatic Harmony Mapping™ accounts for both undertone and melanin depth, ensuring the palette has the right intensity level.",
  },
  {
    q: "Can a dusky Indian woman wear white?",
    a: "Yes. White works well for cool undertone dusky women — it creates clean, high-contrast brightness. For warm undertone dusky women, warm off-white or ivory is more harmonious than stark white, which can look slightly harsh against a yellow-based undertone.",
  },
  {
    q: "Is gold jewellery always better for dusky skin?",
    a: "Not necessarily. Gold is universally associated with Indian skin, but it is only more flattering than silver for warm undertone women. Cool undertone dusky women look equally stunning — often more so — in silver and white gold. Your undertone determines your metal, not your surface depth.",
  },
  {
    q: "How do I know my undertone if I have deep skin?",
    a: "The inner wrist vein test — checked in natural daylight — is the most reliable. Blue-purple veins indicate cool undertone; green veins indicate warm. The white paper test is also effective: hold a white sheet near your bare face in natural light and note whether your skin appears golden/olive or pinkish/greyish by comparison.",
  },
];

export default function BestColoursDuskySkinPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis/best-colours-dusky-skin#article",
        "headline": "Best Colours for Dusky Skin: Indian Women's Guide",
        "description": "Colour science for dusky skin tone Indian women — undertone identification and Chromatic Harmony Mapping™.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-01-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis/best-colours-dusky-skin" },
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
          { "@type": "ListItem", "position": 3, "name": "Best Colours for Dusky Skin", "item": "https://www.iconik.pro/colour-analysis/best-colours-dusky-skin" },
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
              <li className="text-gray-800 font-medium">Best Colours for Dusky Skin</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Best Colours for Dusky Skin Tone: Indian Women&apos;s Complete Guide
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              The word &quot;dusky&quot; describes surface skin depth — it says nothing about your undertone. And it is undertone, not surface depth, that determines which colours create harmony with your complexion. This guide explains the science, breaks the myths, and gives you an exact colour framework for medium-to-deep Indian skin tones.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Is Most &quot;Best Colours for Dusky Skin&quot; Advice Wrong?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Most advice conflates surface tone with undertone. &quot;Wear bold, saturated colours&quot; or &quot;avoid pastels&quot; are based on the assumption that all dusky women have the same colouring. They do not. A dusky woman can have a warm undertone OR a cool undertone — and those require entirely different colour palettes.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The same cobalt blue that looks electric and stunning on a dusky woman with a cool undertone looks jarring and wrong on a dusky woman with a warm undertone. Undertone is the variable. Surface depth is not.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Difference Between Undertone and Surface Tone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Surface tone is what you see: the depth of your skin&apos;s colour, which changes with sun exposure and seasons. Undertone is the fixed hue beneath the surface — warm (yellow/golden), cool (pink/blue), or neutral — and it never changes.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Two women with identical dusky surface tones can have opposite undertones. Colour harmony is determined entirely by undertone. This is the foundational principle behind Chromatic Harmony Mapping™.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Colours for Dusky Skin with Warm Undertone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A warm undertone has a golden, yellow, or peachy base. For medium-to-deep warm undertone skin, colours with earthy richness create the strongest harmony:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Terracotta, rust, and burnt orange</li>
              <li>Mustard yellow and golden yellow</li>
              <li>Olive green and warm khaki</li>
              <li>Camel and warm beige</li>
              <li>Warm reds — tomato red, brick red, fire red</li>
              <li>Coral and warm peach</li>
              <li>Earthy browns — cognac, chocolate, warm tan</li>
              <li>Gold and amber</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Icy pastels, ashy grey, cool lavender, stark white, icy blue. These introduce a cool undertone that clashes with the golden base of warm skin.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Colours for Dusky Skin with Cool Undertone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A cool undertone has a pink, blue, or red base. For medium-to-deep cool undertone skin, jewel tones — deeply saturated and cool in temperature — are the most flattering:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Cobalt blue and royal blue</li>
              <li>Emerald green and jewel green</li>
              <li>Royal purple and amethyst</li>
              <li>Fuchsia and hot pink</li>
              <li>Magenta and cool berry</li>
              <li>Burgundy and deep wine</li>
              <li>Navy and midnight blue</li>
              <li>Cool red — crimson, cool scarlet</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Mustard, warm orange, camel, earthy brown, warm red. These introduce yellow warmth that clashes with the pink or blue base of a cool undertone.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Can Dusky Skin Wear Pastels?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Yes — with the right pastels. The myth that dusky women should avoid pastels is based on icy, washed-out pastels in the wrong temperature. A cool undertone dusky woman can wear muted lavender, dusty rose, or a soft powder blue. A warm undertone dusky woman can wear a muted peach or a soft warm green.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The key is undertone temperature in the pastel itself, not the pastel category as a whole. Iconik&apos;s Chromatic Harmony Mapping™ identifies which specific pastels are within your undertone palette — rather than ruling out an entire colour category.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Chromatic Harmony Mapping™ Work for Dusky Skin?</h2>
            <p className="text-gray-600 leading-relaxed">
              CHM maps two variables simultaneously: undertone (warm, cool, or neutral) and melanin depth. For deeper Indian skin tones, it specifically recommends colours with sufficient chromatic intensity to create visual harmony — very pale icy tints can look washed out against deeper melanin regardless of undertone temperature. The output is a 10-colour palette calibrated for both your undertone type and your melanin depth.
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
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone: 3 At-Home Tests</Link></li>
              <li>→ <Link href="/colour-analysis/warm-cool-neutral-undertone-india" className="underline hover:opacity-70">Warm vs Cool vs Neutral Undertone</Link></li>
              <li>→ <Link href="/colour-analysis/indian-skin-tones" className="underline hover:opacity-70">Indian Skin Tone Colour Guide</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-wheatish-skin-india" className="underline hover:opacity-70">Best Colours for Wheatish Skin</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your exact colour palette in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Iconik&apos;s Chromatic Harmony Mapping™ identifies your precise undertone and melanin depth, then builds your exact 10-colour palette.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Best Colours for Dusky Skin: Indian Women&apos;s Guide.&quot; Iconik, 2025. https://www.iconik.pro/colour-analysis/best-colours-dusky-skin</p>
          </div>

        </div>
      </main>
    </>
  );
}
