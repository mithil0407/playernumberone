import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kurti Length Guide by Body Type and Height — Iconik",
  description: "Which kurti length flatters your body type and height? The complete guide to short, hip-length, knee-length, calf-length, and floor-length kurtis — and which works for which silhouette.",
  keywords: "kurti length guide India, which kurti length for body type, kurti length for short women India, kurti length for tall women, best kurti length Indian women",
  alternates: { canonical: "https://www.iconik.pro/style-guides/kurti-length-guide" },
  openGraph: {
    title: "Kurti Length Guide by Body Type and Height — Iconik",
    description: "Which kurti length flatters each body type — short, hip, knee, calf, and floor-length kurtis mapped to silhouette and height.",
    url: "https://www.iconik.pro/style-guides/kurti-length-guide",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Kurti length guide India — Iconik" }],
  },
};

const faqs = [
  {
    q: "What is the most universally flattering kurti length?",
    a: "Hip-length kurtis (ending at the lower hip, approximately 32–34 inches from shoulder) are the most versatile. They work for most body types, are appropriate for most occasions, and pair well with both straight trousers and leggings. For petite women, a slightly shorter version (30–32 inches) creates a more proportionate silhouette.",
  },
  {
    q: "What kurti length makes you look taller?",
    a: "Knee-length to floor-length kurtis in the same colour as the bottom create the strongest height illusion — the unbroken vertical line from shoulder to hem elongates the full body. Avoid short kurtis with contrasting bottoms for height — the colour break at the waist shortens the perceived height.",
  },
  {
    q: "Can a tall woman wear floor-length kurtis?",
    a: "Yes — tall women can wear any length, including floor-length. A floor-length Anarkali on a tall woman with long legs creates a dramatic, elegant silhouette. The proportional consideration for tall women: avoid very short kurtis (above the hip) without leggings, as very short proportions with long legs can look unbalanced.",
  },
  {
    q: "What kurti length works best for a plus-size or fuller body?",
    a: "Knee-length or longer kurtis with a straight or A-line silhouette create a clean vertical line past the midsection. The longer the kurti, the longer the vertical line and the more elongating the effect. A floor-length Anarkali in a single colour is particularly powerful for fuller bodies — it requires no waist definition and creates a dramatic, elegant silhouette.",
  },
];

export default function KurtiLengthGuidePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Kurti Length Guide by Body Type and Height",
        "description": "Complete guide to choosing kurti length by body type and height — all 5 silhouettes covered.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/style-guides/kurti-length-guide" },
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
          { "@type": "ListItem", "position": 2, "name": "Style Guides", "item": "https://www.iconik.pro/style-guides" },
          { "@type": "ListItem", "position": 3, "name": "Kurti Length Guide", "item": "https://www.iconik.pro/style-guides/kurti-length-guide" },
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
              <li><Link href="/style-guides" className="hover:underline">Style Guides</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Kurti Length Guide</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Kurti Length Guide by Body Type and Height
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Kurti length is one of the most impactful proportion variables in Indian women&apos;s dressing — and one of the most poorly understood. The same silhouette in a knee-length vs a floor-length creates a completely different impression. This guide maps every kurti length category to specific body types, heights, and silhouette goals.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Standard Kurti Length Categories?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Short / tunic length (22–26 inches):</strong> Ends above the hip. Pairs with jeans or leggings only.</li>
              <li><strong>Hip length (28–32 inches):</strong> Ends at the lower hip or upper thigh. The most versatile length — pairs with trousers, leggings, churidars, and palazzos.</li>
              <li><strong>Knee length (34–38 inches):</strong> Ends at or just above the knee. Creates a strong vertical line. Appropriate for casual, work, and semi-formal contexts.</li>
              <li><strong>Calf length (40–46 inches):</strong> Ends between the knee and ankle. Very elongating. Appropriate for formal and semi-formal contexts.</li>
              <li><strong>Floor length / Anarkali (48+ inches):</strong> Ends at or near the ankle. The most formal and most height-creating length. Appropriate for formal and occasion wear.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Which Kurti Length Works for Each Body Type?</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Apple (fuller midsection)</h3>
                <p className="text-gray-600">Best: hip length to knee length in a straight or A-line silhouette. The longer hem creates a vertical line past the midsection. Same colour as the bottom maximises the elongating effect. Avoid: short/tunic kurtis with contrasting bottoms — the horizontal break at the midsection is the least flattering placement.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Pear (wider hips)</h3>
                <p className="text-gray-600">Best: hip length to knee length — the hem ending at the hip or slightly past it creates a clean line. A-line or flared from the hip. Avoid: kurtis that end exactly at the widest point of the hip — this is the least flattering cut line.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Rectangle (minimal waist definition)</h3>
                <p className="text-gray-600">Best: hip length with a defined waistline — either a wrap style or worn with a belt. Colour blocking (contrasting top and bottom) is most effective at hip length. Floor-length Anarkali creates elongation but loses waist definition — add a waist chain if wearing floor-length.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Hourglass (defined waist)</h3>
                <p className="text-gray-600">All lengths work — the hourglass silhouette is proportionally harmonious at any kurti length. The key: the kurti must have a defined waist seam or fit closely at the waist. Oversized or boxy kurtis at any length obscure the natural shape.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Inverted Triangle (wider shoulders)</h3>
                <p className="text-gray-600">Best: hip length to floor-length with A-line or flared silhouettes. The flare adds lower body volume to balance wide shoulders. Avoid: short kurtis that end at the waist — these emphasise the upper body width without adding lower body balance.</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Height Affect Kurti Length?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Petite (under 5&apos;2&quot;):</strong> Hip length works best — it does not cut the body at an awkward mid-leg point. Floor-length kurtis create an elongating vertical line but should be paired with heels. Avoid knee-length kurtis that end at the widest part of the calf.</li>
              <li><strong>Average height (5&apos;2&quot;–5&apos;5&quot;):</strong> All lengths work — choose by body type formula. Hip length and knee length are most versatile for daily wear.</li>
              <li><strong>Tall (above 5&apos;5&quot;):</strong> All lengths work and often look more dramatic. Floor-length kurtis create a particularly striking silhouette on tall frames. Short/tunic kurtis can look disproportionate on long legs unless paired deliberately.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Bottom Pairs with Each Kurti Length?</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Short/tunic (22–26&quot;):</strong> Jeans, leggings, jeggings — pairs with casual bottoms only</li>
              <li><strong>Hip length (28–32&quot;):</strong> Straight trousers, leggings, churidars, palazzos — the most versatile pairing range</li>
              <li><strong>Knee length (34–38&quot;):</strong> Churidars, straight salwars, leggings — bottoms that do not add volume at the hip</li>
              <li><strong>Calf length (40–46&quot;):</strong> Churidars or leggings — full-length slim bottoms</li>
              <li><strong>Floor length (48&quot;+):</strong> Churidars or no visible bottom — the kurti itself is the full outfit</li>
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
              <li>→ <Link href="/style-guides/salwar-kameez-body-type" className="underline hover:opacity-70">Salwar Kameez by Body Type</Link></li>
              <li>→ <Link href="/body-type-styling/how-to-look-taller-clothing" className="underline hover:opacity-70">How to Look Taller with Clothing</Link></li>
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Full Hub</Link></li>
              <li>→ <Link href="/style-guides/office-wear-indian-women" className="underline hover:opacity-70">Office Wear for Indian Women</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your exact kurti formula?</h2>
            <p className="text-gray-600 mb-6">Your Iconik Style Blueprint includes precise kurti length, silhouette, and colour recommendations based on your measured body proportions.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Kurti Length Guide by Body Type and Height.&quot; Iconik LLP, 2025. https://www.iconik.pro/style-guides/kurti-length-guide</p>
          </div>

        </div>
      </main>
    </>
  );
}
