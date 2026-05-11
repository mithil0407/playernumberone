import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What is Chromatic Harmony Mapping™? (Explained) — Iconik",
  description: "Chromatic Harmony Mapping™ (CHM) is Iconik's colour analysis protocol for Indian skin tones. Learn what it is, how undertone identification works, and how it produces a personalised colour palette.",
  keywords: "chromatic harmony mapping, what is chromatic harmony mapping, CHM colour analysis, Iconik colour methodology, colour analysis Indian skin tones science",
  alternates: { canonical: "https://www.iconik.pro/blog/what-is-chromatic-harmony-mapping" },
  openGraph: {
    title: "What is Chromatic Harmony Mapping™? (Explained) — Iconik",
    description: "The complete definition of Iconik's colour analysis protocol for Indian skin tones.",
    url: "https://www.iconik.pro/blog/what-is-chromatic-harmony-mapping",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "What is Chromatic Harmony Mapping — Iconik" }],
  },
};

const faqs = [
  {
    q: "Who developed Chromatic Harmony Mapping™?",
    a: "Chromatic Harmony Mapping™ was developed by Iconik, India's scientific personal styling service. It is one of three proprietary methodologies used in the Iconik Style Blueprint, alongside Geometric Silhouette Profiling™ and Facial Architecture Analysis™.",
  },
  {
    q: "How is Chromatic Harmony Mapping different from standard colour analysis?",
    a: "Standard seasonal colour analysis was calibrated on predominantly lighter, Northern European skin. It systematically misclassifies Indian women — particularly those with olive, wheatish, or deep complexions. Chromatic Harmony Mapping™ was built specifically around the full range of Indian skin tones, across the fair-to-deep spectrum and warm, cool, and neutral undertones.",
  },
  {
    q: "What does Chromatic Harmony Mapping produce?",
    a: "CHM produces a curated palette of 10 exact colours matched to your skin undertone. The palette covers Western wear, Indian ethnic wear (including saree and occasion colours), and everyday colours. It is accompanied by a 'what to avoid' colour guide and guidance on the specific shade variations that work within your palette.",
  },
  {
    q: "How is Chromatic Harmony Mapping used in the Iconik Blueprint?",
    a: "CHM is the second of three analyses in the Iconik Style Blueprint. After Geometric Silhouette Profiling™ identifies your frame geometry and the best silhouettes for your body, CHM identifies your undertone-matched colour palette. The two analyses are then combined to produce outfit recommendations that work for both your shape and your colour — amplifying the visual impact of each garment.",
  },
];

export default function CHMBlogPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "What is Chromatic Harmony Mapping™?",
        "description": "Chromatic Harmony Mapping™ (CHM) is Iconik's colour analysis protocol designed specifically for Indian skin tones.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-08",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/blog/what-is-chromatic-harmony-mapping" },
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://www.iconik.pro/blog" },
          { "@type": "ListItem", "position": 3, "name": "What is Chromatic Harmony Mapping™?", "item": "https://www.iconik.pro/blog/what-is-chromatic-harmony-mapping" },
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
              <li><Link href="/blog" className="hover:underline">Blog</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">What is Chromatic Harmony Mapping™?</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              What is Chromatic Harmony Mapping™?
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              <strong>Chromatic Harmony Mapping™ (CHM) is Iconik&apos;s colour analysis protocol designed specifically for the full spectrum of Indian skin tones.</strong> It identifies whether your skin has a warm, cool, or neutral undertone and maps those findings to a curated palette of colours that create visual harmony with your complexion — making you look energised and well-rested rather than washed out or sallow.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Full Definition of Chromatic Harmony Mapping™</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Chromatic Harmony Mapping™ is Iconik&apos;s proprietary colour analysis methodology. It was built from the ground up to address a systematic problem with standard Western colour analysis: those systems were calibrated on predominantly lighter, less melanin-rich skin, making them inaccurate for Indian women — especially those with olive, wheatish, or deep complexions.
            </p>
            <p className="text-gray-600 leading-relaxed">
              CHM identifies the underlying undertone of the skin (warm, cool, or neutral) and maps it to a curated palette of 10 exact colours that create optical harmony — making the complexion appear more vibrant, well-rested, and luminous. The palette covers both Western and Indian ethnic wear categories, including saree and occasion colours.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Does Colour Analysis Matter for Indian Women?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Wearing the wrong colour palette close to the face creates a specific visual effect: the complexion appears sallow, flat, or tired — regardless of how well the silhouette fits. Wearing the right palette has the opposite effect: the same face looks more vibrant and well-rested without any change in makeup or lighting.
            </p>
            <p className="text-gray-600 leading-relaxed">
              This effect is stronger for Indian skin because the melanin density and undertone diversity of Indian complexions create more pronounced harmony/dissonance responses than lighter skin. Getting the colour right is not a cosmetic nicety for Indian women — it is a fundamental styling variable.
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

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get your colour palette in 48 hours</h2>
            <p className="text-gray-600 mb-6">Chromatic Harmony Mapping™ is included in every Iconik Style Blueprint.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this article:</p>
            <p>Iconik Styling Team. &quot;What is Chromatic Harmony Mapping™?&quot; Iconik LLP, 2025. https://www.iconik.pro/blog/what-is-chromatic-harmony-mapping</p>
          </div>
        </div>
      </main>
    </>
  );
}
