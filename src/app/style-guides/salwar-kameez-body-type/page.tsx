import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Salwar Kameez for Every Body Type: The Complete Fit Guide — Iconik",
  description: "Which salwar kameez silhouette flatters your body type? Apple, pear, rectangle, hourglass, and inverted triangle formulas for kurta length, salwar style, neckline, and dupatta placement.",
  keywords: "salwar kameez body type India, best salwar kameez for apple shape, salwar suit for pear body, how to choose salwar kameez body type India, kurta for body type Indian women",
  alternates: { canonical: "https://www.iconik.pro/style-guides/salwar-kameez-body-type" },
  openGraph: {
    title: "Salwar Kameez for Every Body Type: The Complete Fit Guide — Iconik",
    description: "Body-type-specific salwar kameez formulas — kurta length, silhouette, salwar style, and neckline for all 5 Indian body types.",
    url: "https://www.iconik.pro/style-guides/salwar-kameez-body-type",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Salwar kameez body type India — Iconik" }],
  },
};

const faqs = [
  {
    q: "What is the most universally flattering salwar kameez silhouette?",
    a: "A straight-cut or A-line kameez at hip length, paired with a straight salwar or churidar in the same or tonal colour. This formula creates a clean vertical line that elongates most body types. The monochromatic colour combination (same colour top and bottom) maximises the elongating effect.",
  },
  {
    q: "Can a pear-shaped woman wear Anarkali suits?",
    a: "Yes — the Anarkali is excellent for pear shapes because the flare begins at or above the widest point of the hip. The fitted bodice emphasises the bust and defines the upper body; the flare draws the eye down and past the hip. Choose an Anarkali with a statement neckline or embellished yoke to add visual weight to the upper body.",
  },
  {
    q: "What kurta length is best for hiding a tummy?",
    a: "A straight-cut or A-line kurta at hip length or below — ending at or past the widest point of the hip. This creates a clean vertical line past the midsection without defining it. Avoid cropped kurtis and kurtis with horizontal embellishment across the midsection.",
  },
  {
    q: "What is the best salwar style for petite Indian women?",
    a: "Churidar: the gathered fabric at the ankle adds visual interest at the bottom without adding bulk at the hip, and the slim fit through the leg creates a long, lean line. Paired with a long straight kurta in the same colour, this is the most height-creating salwar style for petite frames.",
  },
];

export default function SalwarKameezBodyTypePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Salwar Kameez for Every Body Type: The Complete Fit Guide",
        "description": "Body-type-specific salwar kameez formulas for all 5 Indian female silhouettes.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/style-guides/salwar-kameez-body-type" },
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
          { "@type": "ListItem", "position": 3, "name": "Salwar Kameez Body Type", "item": "https://www.iconik.pro/style-guides/salwar-kameez-body-type" },
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
              <li className="text-gray-800 font-medium">Salwar Kameez by Body Type</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Salwar Kameez for Every Body Type: The Complete Fit Guide
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              A salwar kameez is not a single outfit — it is a modular system with dozens of variables: kurta length, kurta silhouette, salwar style, neckline, sleeve length, and dupatta placement. Each variable affects how the outfit reads on your body. This guide maps every variable to your specific body type so you build outfits that flatter by design.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Apple Body Type: Salwar Kameez Formula</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Kurta silhouette:</strong> Straight-cut or A-line — avoid fitted at the waist</li>
              <li><strong>Kurta length:</strong> Hip to knee — creates a vertical line past the midsection</li>
              <li><strong>Neckline:</strong> V-neck or boat neck — draws the eye upward and creates a vertical central line</li>
              <li><strong>Salwar style:</strong> Straight salwar or churidar — slim through the leg to balance the fuller upper body</li>
              <li><strong>Dupatta:</strong> Draped over one shoulder as a stole, pinned at the back — adds a strong diagonal line</li>
              <li><strong>Avoid:</strong> Kurtis with horizontal embellishment at the waist; gathered or flared salwars that add hip volume</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pear Body Type: Salwar Kameez Formula</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Kurta silhouette:</strong> A-line from the hip — fits through the bust and waist, flares past the hip</li>
              <li><strong>Kurta embellishment:</strong> Statement yoke, embroidered neckline, or printed bodice — visual interest at the upper body</li>
              <li><strong>Salwar style:</strong> Wide-leg palazzo or straight salwar in a plain, dark colour — quiet lower body</li>
              <li><strong>Colour strategy:</strong> Printed or coloured top + plain, dark bottom — draws the eye upward</li>
              <li><strong>Dupatta:</strong> Over both shoulders, spread across the chest — adds upper body visual width</li>
              <li><strong>Avoid:</strong> Plain top + heavily printed or embellished salwar</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Rectangle Body Type: Salwar Kameez Formula</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Kurta silhouette:</strong> Wrap-style or belted kurta — creates a waist definition that the silhouette lacks</li>
              <li><strong>Alternative:</strong> Straight kurta with a contrasting narrow belt at the natural waist</li>
              <li><strong>Neckline:</strong> Deep V or asymmetric — adds visual complexity to the upper body</li>
              <li><strong>Salwar style:</strong> Palazzo or flared salwar — adds hip volume, creating the impression of a waist</li>
              <li><strong>Colour strategy:</strong> Colour-blocked (contrasting top and bottom with a belt at the waist) to create the illusion of a waist line</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hourglass Body Type: Salwar Kameez Formula</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Kurta silhouette:</strong> Fitted or semi-fitted at the waist — honours the natural shape</li>
              <li><strong>Avoid:</strong> Oversized or boxy kurtis that obscure the waist definition</li>
              <li><strong>Salwar style:</strong> Any — straight, churidar, palazzo all work well</li>
              <li><strong>Wrap or princess-seam kurtis:</strong> These follow the natural silhouette most precisely</li>
              <li><strong>Dupatta:</strong> Any style — the hourglass proportions are naturally harmonious with all draping options</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Inverted Triangle Body Type: Salwar Kameez Formula</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Kurta silhouette:</strong> A-line or flared from the hip — adds lower body volume to balance wide shoulders</li>
              <li><strong>Neckline:</strong> V-neck — narrows the visual shoulder width</li>
              <li><strong>Avoid:</strong> Boat neck, off-shoulder, cold-shoulder — all add shoulder width</li>
              <li><strong>Salwar style:</strong> Wide palazzo or Patiala — adds maximum hip and lower body volume</li>
              <li><strong>Colour strategy:</strong> Plain, darker top + printed or embellished, lighter bottom — visual weight at the lower body</li>
              <li><strong>Dupatta:</strong> Draped over the arms rather than across the shoulders — avoids adding shoulder width</li>
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
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Full Hub</Link></li>
              <li>→ <Link href="/style-guides/kurti-length-guide" className="underline hover:opacity-70">Kurti Length Guide by Body Type</Link></li>
              <li>→ <Link href="/style-guides/saree-draping-body-type" className="underline hover:opacity-70">Saree Draping by Body Type</Link></li>
              <li>→ <Link href="/style-guides/office-wear-indian-women" className="underline hover:opacity-70">Office Wear for Indian Women</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your exact salwar kameez formula?</h2>
            <p className="text-gray-600 mb-6">Your Iconik Style Blueprint includes precise Indian ethnic wear formulas for your body type — kurta silhouettes, lengths, necklines, and colour combinations.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Salwar Kameez for Every Body Type: The Complete Fit Guide.&quot; Iconik LLP, 2025. https://www.iconik.pro/style-guides/salwar-kameez-body-type</p>
          </div>

        </div>
      </main>
    </>
  );
}
