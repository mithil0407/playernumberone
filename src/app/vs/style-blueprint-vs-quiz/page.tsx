import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Style Blueprint vs Style Quiz: What's the Difference? — Iconik",
  description: "Why a style quiz gives you a personality label but a Style Blueprint gives you a dressing framework. The difference between self-reported quiz outputs and measurement-based body and colour analysis.",
  keywords: "style quiz vs style blueprint India, style quiz India, what is style blueprint, Iconik style blueprint explained, personal style analysis India",
  alternates: { canonical: "https://www.iconik.pro/vs/style-blueprint-vs-quiz" },
  openGraph: {
    title: "Style Blueprint vs Style Quiz: What's the Difference? — Iconik",
    description: "Why a style quiz gives you a personality label and a Style Blueprint gives you a dressing framework — the distinction explained.",
    url: "https://www.iconik.pro/vs/style-blueprint-vs-quiz",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Style Blueprint vs style quiz India — Iconik" }],
  },
};

const faqs = [
  {
    q: "What does a style quiz tell you?",
    a: "A style quiz produces a personality-based style archetype — 'Classic', 'Boho', 'Minimalist', 'Romantic', etc. These are aesthetic categories based on self-reported preferences. They tell you what you like. They do not tell you what flatters your body type, what colours work for your undertone, or how to build outfits that work for your specific proportions.",
  },
  {
    q: "What does the Iconik Style Blueprint tell you?",
    a: "It tells you three things: (1) Your exact body type based on 7 measurements — not a personality label but a geometric classification with specific outfit formulas. (2) Your exact colour palette based on undertone and contrast analysis — not 'wear warm colours' but the specific 10 colours that create harmony with your complexion. (3) 16+ outfit formulas that combine your body type and colour palette for Indian and western garments across your lifestyle contexts.",
  },
  {
    q: "Can I use a style quiz result to shop or get dressed more effectively?",
    a: "Partially. A style archetype can guide aesthetic preferences (you now know you are drawn to 'Classic' over 'Trendy'). But it does not answer the practical questions: which cut flatters my shoulders? Which specific navy is right for my undertone? Should I wear A-line or straight kurtas for my proportions? These require body and colour analysis, not preference classification.",
  },
  {
    q: "Are style quizzes useless?",
    a: "No — they are useful as a starting point for understanding aesthetic direction. The limitation is what they cannot do: body type analysis and colour analysis require measurement or observation that quiz questions cannot provide. A style quiz tells you about your preferences; a style analysis tells you about your body and colouring. Both contribute to a complete picture, but only the latter produces actionable outfit formulas.",
  },
];

export default function StyleBlueprintVsQuizPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Style Blueprint vs Style Quiz: What's the Difference?",
        "description": "The difference between a personality-based style quiz and a measurement-based Style Blueprint for Indian women.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/vs/style-blueprint-vs-quiz" },
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
          { "@type": "ListItem", "position": 2, "name": "Comparisons", "item": "https://www.iconik.pro/vs" },
          { "@type": "ListItem", "position": 3, "name": "Style Blueprint vs Quiz", "item": "https://www.iconik.pro/vs/style-blueprint-vs-quiz" },
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
              <li className="text-gray-800 font-medium">Style Blueprint vs Style Quiz</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Style Blueprint vs Style Quiz: What&apos;s the Difference?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              A style quiz asks what you prefer. A style analysis measures what flatters you. These are different questions with different outputs — one gives you a personality archetype label; the other gives you a dressing framework. Here is exactly what each produces and where each is useful.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Does a Style Quiz Actually Measure?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Style quizzes measure aesthetic preference — which images you are drawn to, which descriptors match your self-perception, which &quot;vibe&quot; you identify with. The output is typically a personality-based style archetype: Classic, Romantic, Boho, Minimalist, Dramatic, Trendy.
            </p>
            <p className="text-gray-600 leading-relaxed">
              These archetypes describe aesthetic direction. They do not describe your body, your undertone, or the specific cuts and colours that will physically flatter you. Two women with identical &quot;Classic&quot; quiz results can have completely different body types and undertones — and therefore need completely different outfits, even within the same aesthetic category.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Does the Iconik Style Blueprint Measure?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The Style Blueprint measures two objective variables:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Body proportions via Geometric Silhouette Profiling™:</strong> 7 measurements produce a proportional classification. This answers questions that quiz questions cannot: Where is my widest point? What is my shoulder-to-hip ratio? Is my torso proportionally long or short? These answers produce specific silhouette formulas.</li>
              <li><strong>Undertone and contrast via Chromatic Harmony Mapping™:</strong> This identifies the warm/cool/neutral base of your complexion and your contrast level. These produce a specific 10-colour palette — not a vague direction like &quot;you suit warm colours&quot; but the exact hues that create harmony with your specific complexion.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Combined, these produce 16+ outfit formulas: specific garment silhouettes in specific colour combinations for specific occasions (work, casual, formal, occasion). This is a dressing framework, not a label.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Side-by-Side: What Each Tells You</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-3 pr-4 font-semibold text-gray-900 w-1/3">Question</th>
                    <th className="py-3 pr-4 font-semibold text-gray-900 w-1/3">Style Quiz</th>
                    <th className="py-3 font-semibold text-gray-900 w-1/3">Iconik Style Blueprint</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  <tr><td className="py-3 pr-4 font-medium">What is my body type?</td><td className="py-3 pr-4">Not answered</td><td className="py-3">Precisely classified</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">Which cut flatters me?</td><td className="py-3 pr-4">Not answered</td><td className="py-3">Specific formulas given</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">What colours suit me?</td><td className="py-3 pr-4">Vague direction</td><td className="py-3">10 specific colours named</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">What is my aesthetic?</td><td className="py-3 pr-4">Style archetype label</td><td className="py-3">Not the focus</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">What to wear to work?</td><td className="py-3 pr-4">Not answered</td><td className="py-3">Specific outfit formulas</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">What ethnic wear works for me?</td><td className="py-3 pr-4">Not answered</td><td className="py-3">Specific garment formulas</td></tr>
                  <tr><td className="py-3 pr-4 font-medium">Useful for shopping?</td><td className="py-3 pr-4">Partially</td><td className="py-3">Yes — precise filter</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">When Is Each Useful?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>A style quiz is useful for:</strong> Understanding your aesthetic direction and identifying the visual world you are drawn to. It is a good starting point for building a Pinterest board, defining your style identity, or deciding between two different aesthetic directions.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>The Iconik Style Blueprint is useful for:</strong> Making daily dressing decisions, building a capsule wardrobe, shopping with precision, and solving specific styling problems (nothing to wear, looking washed out, clothes not fitting well). It answers the &quot;what specifically do I wear?&quot; question that quizzes cannot.
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
              <li>→ <Link href="/faq/what-is-iconik-style-blueprint" className="underline hover:opacity-70">What Is the Iconik Style Blueprint?</Link></li>
              <li>→ <Link href="/methodology/geometric-silhouette-profiling" className="underline hover:opacity-70">Geometric Silhouette Profiling™</Link></li>
              <li>→ <Link href="/methodology/chromatic-harmony-mapping" className="underline hover:opacity-70">Chromatic Harmony Mapping™</Link></li>
              <li>→ <Link href="/vs/iconik-vs-styling-apps" className="underline hover:opacity-70">Iconik vs Styling Apps</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get the framework, not just the label</h2>
            <p className="text-gray-600 mb-6">Body analysis, colour palette, and 16+ outfit formulas — a complete dressing framework delivered in 48 hours.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Style Blueprint vs Style Quiz: What&apos;s the Difference?&quot; Iconik LLP, 2025. https://www.iconik.pro/vs/style-blueprint-vs-quiz</p>
          </div>

        </div>
      </main>
    </>
  );
}
