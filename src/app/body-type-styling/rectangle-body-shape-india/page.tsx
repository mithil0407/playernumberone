import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rectangle Body Shape: How to Create Curves with Clothing — Iconik",
  description: "Complete rectangle body shape guide for Indian women. How to create the appearance of a defined waist and curves using Indian garments, western wear, and Geometric Silhouette Profiling™.",
  keywords: "rectangle body shape India, how to dress rectangle body type India, straight body shape Indian women, rectangular silhouette India, create curves rectangle body India",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/rectangle-body-shape-india" },
  openGraph: {
    title: "Rectangle Body Shape: How to Create Curves with Clothing — Iconik",
    description: "Exact Indian garment formulas for the rectangle body shape — how to create a defined waist and curves without shapewear.",
    url: "https://www.iconik.pro/body-type-styling/rectangle-body-shape-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Rectangle body shape guide for Indian women — Iconik" }],
  },
};

const faqs = [
  {
    q: "Can a rectangle body shape wear fitted clothes?",
    a: "Yes, but fitted clothes alone won't create curve. The key is waist definition at the seam level. A fitted dress with a defined waist seam flatters. A fitted shift dress with no waist seam does not. The garment must have structural waist creation, not just body-skimming fabric.",
  },
  {
    q: "What is the difference between rectangle and inverted triangle body shape?",
    a: "Rectangle has shoulders and hips roughly equal in width, with minimal waist definition. Inverted triangle has shoulders notably wider than hips. Styling logic differs: inverted triangle focuses on adding lower body volume to balance wide shoulders; rectangle focuses on defining the waist to create the appearance of a curve.",
  },
  {
    q: "Do belts help rectangle body shapes?",
    a: "Yes, significantly. A belt at the natural waist is one of the quickest and most effective tools for a rectangle silhouette. Even on a plain salwar kameez, a structured belt creates an instant waist. Avoid very wide or very rigid belts — a medium-width structured belt works best.",
  },
  {
    q: "What is the best saree blouse for a rectangle body shape?",
    a: "A blouse with a defined waistband or a crop-style cut that sits just above the natural waist, emphasising the waist zone. The pallu should be draped to add volume at the hip — use a box-pleat or fanned draping style to create the appearance of a hip curve below the waist.",
  },
];

export default function RectangleBodyShapeIndiaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Rectangle Body Shape: How to Create Curves with Clothing",
        "description": "Complete rectangle body shape guide for Indian women — creating waist definition and curves using Indian garments and Geometric Silhouette Profiling™.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/rectangle-body-shape-india" },
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
          { "@type": "ListItem", "position": 2, "name": "Body Type Styling", "item": "https://www.iconik.pro/body-type-styling" },
          { "@type": "ListItem", "position": 3, "name": "Rectangle Body Shape India", "item": "https://www.iconik.pro/body-type-styling/rectangle-body-shape-india" },
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
              <li className="text-gray-800 font-medium">Rectangle Body Shape India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Rectangle Body Shape: How to Create Curves with Clothing
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              A rectangle body shape has shoulders, waist, and hips in roughly equal width, with minimal natural waist definition. The styling goal is to create the illusion of a more defined waist and add visual curve — using structure, draping, and strategic cut. No shapewear required.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is a Rectangle Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The rectangle silhouette — also called a column or straight silhouette — has shoulders, waist, and hips all roughly the same width (within 5cm of each other). There is little or no natural waist indentation. The body tends to be athletic or lean in profile.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              In Geometric Silhouette Profiling™, the rectangle is the column archetype. It is not the same as being thin — a fuller woman can also have a rectangle distribution if her weight is relatively uniform across the shoulder, waist, and hip zones. The defining characteristic is the absence of waist differentiation, not size.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Core Styling Principle for Rectangle Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Create the illusion of a waist. The techniques are: cinching at the natural waist using belts or waist seams, adding volume above and below the waist to create contrast (A-line skirts below + structured shoulders above), and using strong horizontal design details at the hip and bust levels to create the appearance of curves that taper at the centre.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The rectangle has the most flexibility of any silhouette type — it can pull off bold prints, volume, and structural experimentation that other silhouettes cannot. The goal is always to interrupt the straight column line with strategic waist definition.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Indian Ethnic Wear Works Best for a Rectangle Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Lehenga sets</strong> with a defined waist are among the best options — a fitted blouse with a visible waistband or cinched closure, plus a full lehenga skirt, creates a classic hourglass illusion. The full skirt adds hip volume below the cinched waist.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Wrap-style kurtas</strong> with a visible crossover closure at the waist are excellent everyday options. The wrap naturally cinches at the natural waist point.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Lehenga sets with a defined blouse waistline</li>
              <li>Wrap-style kurtas with visible waist crossover</li>
              <li>Anarkali with a fitted bodice and full flare (creates hourglass from straight column)</li>
              <li>Salwar kameez with a belt or defined waist seam</li>
              <li>Dupattas knotted at the waist to create a defined hip zone</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Shift-style kurtis with zero waist definition. Palazzo sets with a boxy straight top — this removes all shape. Garments with no structural waist information.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Western Wear Works Best for a Rectangle Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Peplum tops</strong> are one of the most effective western options — the peplum flare at the hip creates an instant waist-to-hip curve. <strong>Fit-and-flare dresses</strong> achieve the same effect structurally.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Peplum tops (create hip curve from a straight torso)</li>
              <li>Fit-and-flare dresses</li>
              <li>High-waisted skirts with a fitted top</li>
              <li>Belted blazers (create waist on any outfit)</li>
              <li>Wrap dresses</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Straight-cut shift dresses with no waist seam. Boxy oversized tops with straight-leg trousers — this doubles the column effect.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Can Colours and Prints Help a Rectangle Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The rectangle has more freedom with colour and print than most silhouettes — because the goal is to create curve and visual interest, not to minimise a feature. Bold prints, colour-blocking (different colour top and bottom), and strong horizontal design details at bust or hip all add visual curve.
            </p>
            <p className="text-gray-600 leading-relaxed">
              A useful technique: colour-block with a darker waist zone and brighter top and bottom zones. This creates a visual impression of a narrower waist by making the surrounding areas pop. Your Chromatic Harmony Mapping™ palette gives you the right colours to make this work.
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
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Full Hub</Link></li>
              <li>→ <Link href="/body-type-styling/rectangle" className="underline hover:opacity-70">Rectangle Body Type: Styling Guide</Link></li>
              <li>→ <Link href="/body-type-styling/apple-body-shape-india" className="underline hover:opacity-70">Apple Body Shape India Guide</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations specific to your rectangle silhouette.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Rectangle Body Shape: How to Create Curves with Clothing.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/rectangle-body-shape-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
