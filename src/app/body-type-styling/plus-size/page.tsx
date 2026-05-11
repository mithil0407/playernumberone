import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Plus Size Indian Women's Style Guide — Iconik",
  description: "A science-backed plus-size styling guide for Indian women. Discover the silhouettes, fabrics, and Indian garment choices that celebrate your frame with confidence and elegance.",
  keywords: "plus size styling guide Indian women, plus size fashion India, plus size outfits India, how to dress plus size Indian women, plus size salwar kameez, plus size saree styling India",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/plus-size" },
  openGraph: {
    title: "Plus Size Indian Women's Style Guide — Iconik",
    description: "Science-backed plus-size styling for Indian women — silhouettes, fabrics, and garments that celebrate your frame.",
    url: "https://www.iconik.pro/body-type-styling/plus-size",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Plus size styling guide for Indian women — Iconik" }],
  },
};

const faqs = [
  {
    q: "What is the best styling approach for plus-size Indian women?",
    a: "The goal of plus-size styling is not to minimise or hide the body — it is to find the proportions, fabrics, and silhouettes that create a composed, elegant, and aligned appearance. This means working with the body's natural geometry rather than fighting it. Iconik's Geometric Silhouette Profiling™ maps the specific geometry of your frame to prescribe the garments that create the most harmonious proportional result.",
  },
  {
    q: "What Indian ethnic wear is most flattering for plus-size women?",
    a: "Anarkali suits with a fitted yoke are universally flattering — the fitted yoke defines the upper body while the flared skirt provides ease and elegance. Straight-cut kurtas at tunic length with palazzos create a long, vertical silhouette. Sarees with a structured blouse and a seedha pallu (straight pallu from shoulder to floor) are extremely elegant on plus-size frames.",
  },
  {
    q: "What fabrics work best for plus-size women in India?",
    a: "Fabrics that drape rather than cling are most flattering — chiffon, georgette, crepe, and cotton-silk blends. Avoid very stiff fabrics that add bulk, and very stretchy fabrics that reveal every contour. Medium-weight fabrics with a slight flow are ideal. In summer, cotton and linen blends in breathable weaves work well without adding visual bulk.",
  },
  {
    q: "Can plus-size women wear prints and colours?",
    a: "Absolutely. Colour and print choices should be guided by your skin undertone (from Chromatic Harmony Mapping™), not by your body size. The placement of the print matters more than its presence — avoid large-scale prints concentrated at the area you want to minimise, but medium and small-scale prints on any part of the body can look excellent.",
  },
];

export default function PlusSizeBodyTypePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Plus Size Indian Women's Style Guide",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/plus-size" },
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map((f) => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.iconik.pro" },
          { "@type": "ListItem", "position": 2, "name": "Body Type Styling", "item": "https://www.iconik.pro/body-type-styling" },
          { "@type": "ListItem", "position": 3, "name": "Plus Size Styling", "item": "https://www.iconik.pro/body-type-styling/plus-size" },
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
              <li><Link href="/body-type-styling" className="hover:underline">Body Type Styling</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Plus Size Styling</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Plus Size Indian Women&apos;s Style Guide
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              This guide is built on one principle: the goal of styling is never to make you look smaller. It is to find the proportions, fabrics, and silhouettes that make you look composed, elegant, and like the most aligned version of yourself. Iconik&apos;s Geometric Silhouette Profiling™ maps your frame geometry to the garments that create the most harmonious result.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Science Behind Plus-Size Styling</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Plus-size bodies are not a single silhouette category — they encompass apple, pear, rectangle, and hourglass geometries at larger proportions. This is why generic &quot;plus-size fashion tips&quot; often fail: they treat all fuller-figured women as if they have the same frame geometry.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Iconik&apos;s approach identifies your specific geometric profile first, then prescribes garments that work with that geometry — accounting for the fuller proportions. The result is styling that is specific to you, not to a category.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Indian Ethnic Garments for Plus-Size Women</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Anarkali suits</strong> with a fitted yoke — the fitted yoke defines and the flared skirt provides ease and flow</li>
              <li><strong>Straight-cut kurtas</strong> at tunic length over palazzos or straight trousers — creates a long, unbroken vertical line</li>
              <li><strong>Sarees with seedha pallu</strong> — a straight pallu from shoulder to floor creates a clean, elegant vertical line</li>
              <li><strong>Kaftan-style kurtis</strong> in flowing fabrics — maximum comfort without adding structural bulk</li>
              <li><strong>Lehenga-choli</strong> with a long blouse and a flared lehenga in a flowing fabric</li>
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

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — tailored to your specific geometry, not a generic &quot;plus-size&quot; category.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Plus Size Indian Women&apos;s Style Guide.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/plus-size</p>
          </div>
        </div>
      </main>
    </>
  );
}
