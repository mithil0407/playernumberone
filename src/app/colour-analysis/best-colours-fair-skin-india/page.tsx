import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Colours for Fair Skin Tone: Indian Women's Guide — Iconik",
  description: "Which colours work best for fair-skinned Indian women? How undertone determines your palette (not skin depth), and Chromatic Harmony Mapping™ for light Indian skin tones.",
  keywords: "best colours for fair skin India, colours for fair Indian women, what to wear fair skin India, colour guide fair skin Indian women, fashion for light complexion India",
  alternates: { canonical: "https://www.iconik.pro/colour-analysis/best-colours-fair-skin-india" },
  openGraph: {
    title: "Best Colours for Fair Skin Tone: Indian Women's Guide — Iconik",
    description: "Why undertone — not skin depth — determines your colour palette. Complete guide for fair Indian women.",
    url: "https://www.iconik.pro/colour-analysis/best-colours-fair-skin-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Best colours for fair skin India — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Colours for Fair Skin Tone: Indian Women's Guide — Iconik",
    description: "Why undertone — not skin depth — determines your colour palette. Complete guide for fair Indian women.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "Can fair Indian women wear dark colours?",
    a: "Yes. Dark colours work well for fair women, especially those with cool undertones — navy, deep burgundy, forest green all create striking contrast. For warm undertone fair women, deep earthy darks (chocolate brown, deep olive, rich rust) are more harmonious than cool-toned darks.",
  },
  {
    q: "Is stark white flattering for fair skin?",
    a: "For cool undertone fair women, yes — stark white creates a fresh, clean, high-contrast look. For warm undertone fair women, stark white can look harsh against the yellow-based skin tone. Ivory or warm off-white is more harmonious and has a softer, more flattering effect.",
  },
  {
    q: "Why does mustard yellow look wrong on some fair Indian women?",
    a: "Mustard is a warm, yellow-based colour. It creates harmony with warm undertone women because it matches the yellow in the skin's undertone. For cool undertone fair women, mustard introduces a yellow cast that makes the skin appear slightly sallow or jaundiced. The undertone clash is the cause.",
  },
  {
    q: "What is Chromatic Harmony Mapping™ and how does it help fair skin tones?",
    a: "CHM identifies your undertone (warm, cool, or neutral) and contrast level, then maps them to an exact 10-colour palette. For fair Indian women, this is particularly valuable because the range of undertones within the 'fair' category is wide — two fair-skinned women can have opposite colour needs. Generic 'best colours for fair Indian skin' advice fails half its audience because it ignores undertone.",
  },
];

export default function BestColoursFairSkinPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis/best-colours-fair-skin-india#article",
        "headline": "Best Colours for Fair Skin Tone: Indian Women's Guide",
        "description": "Colour science for fair skin tone Indian women — undertone identification and Chromatic Harmony Mapping™.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-01-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis/best-colours-fair-skin-india" },
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
          { "@type": "ListItem", "position": 3, "name": "Best Colours for Fair Skin India", "item": "https://www.iconik.pro/colour-analysis/best-colours-fair-skin-india" },
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
              <li className="text-gray-800 font-medium">Best Colours for Fair Skin India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Best Colours for Fair Skin Tone: Indian Women&apos;s Guide
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Fair skin in India covers a wide spectrum — from light-neutral to porcelain — and the undertone within that spectrum varies just as much. Two fair-skinned Indian women can have completely opposite colour needs. This guide explains why, and gives you the exact palette framework for your undertone.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Is Fair Skin Colour Advice Often Oversimplified?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Guides say &quot;fair women can wear anything&quot; or &quot;avoid white because it washes you out.&quot; Both are wrong and both ignore the decisive variable: undertone. A fair woman with a warm undertone wearing cool lavender will look washed out. A fair woman with a cool undertone wearing mustard yellow will look sallow. The surface tone is irrelevant to this equation.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Undertone — warm (yellow/golden base), cool (pink/blue base), or neutral (a balance) — is fixed and independent of surface depth. It is the only variable that determines colour harmony.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Colours for Fair Skin with Warm Undertone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A warm undertone has a yellow, golden, or peachy base. For fair warm undertone skin, colours that harmonise with this golden base create the most flattering effect:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Camel, warm beige, and warm cream</li>
              <li>Rust, terracotta, and burnt orange</li>
              <li>Warm coral and soft peach</li>
              <li>Olive green and warm sage</li>
              <li>Mustard yellow and golden yellow</li>
              <li>Warm reds — tomato, brick, coral red</li>
              <li>Ivory (over stark white)</li>
              <li>Warm chocolate brown</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Cool lavender, ashy grey, icy blue, stark white, cool fuchsia. These introduce a coolness that clashes with the warm golden base, making the skin appear slightly greenish or dull.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Colours for Fair Skin with Cool Undertone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A cool undertone has a pink, blue, or red base. For fair cool undertone skin, soft cool tones and jewel colours create the most flattering harmony:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Powder blue and soft sky blue</li>
              <li>Lavender and muted violet</li>
              <li>Soft rose and dusty pink</li>
              <li>Cool mint and eucalyptus</li>
              <li>Cobalt blue and sapphire</li>
              <li>Burgundy and deep wine</li>
              <li>Navy and midnight blue</li>
              <li>Stark white (creates clean contrast)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Mustard yellow, warm orange, camel, earthy brown, golden yellow. These warm colours create a yellowish cast against a pink-based undertone.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Low-Contrast Challenge for Fair Skin?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Some fair Indian women have low contrast between their hair, skin, and eyes — medium brown hair, medium brown eyes, fair skin. This low-contrast colouring has specific needs: it looks best in muted, greyed, and medium-depth colours rather than the extremes of very dark or very bright.
            </p>
            <p className="text-gray-600 leading-relaxed">
              High-contrast colour combinations (e.g., jet black top + stark white bottom) can overwhelm low-contrast colouring — the outfit becomes stronger than the person wearing it. Tone-on-tone and muted palette choices allow the face to remain the focal point.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Chromatic Harmony Mapping™ Work for Fair Skin?</h2>
            <p className="text-gray-600 leading-relaxed">
              CHM identifies undertone type AND contrast level simultaneously. For fair Indian women, the contrast level assessment is particularly important — it determines whether bold colour contrasts or tonal combinations are more flattering. Combined with the undertone type, this produces a 10-colour palette that works for your specific fair skin profile, not a generic &quot;fair skin&quot; category.
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
              <li>→ <Link href="/colour-analysis/best-colours-dusky-skin" className="underline hover:opacity-70">Best Colours for Dusky Skin</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-wheatish-skin-india" className="underline hover:opacity-70">Best Colours for Wheatish Skin</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your exact colour palette in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Iconik&apos;s Chromatic Harmony Mapping™ identifies your specific undertone and contrast level, then builds your exact 10-colour palette.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Best Colours for Fair Skin Tone: Indian Women&apos;s Guide.&quot; Iconik, 2025. https://www.iconik.pro/colour-analysis/best-colours-fair-skin-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
