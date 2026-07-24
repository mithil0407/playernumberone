import type { Metadata } from "next";
import Link from "next/link";
import { SeoTeachingVisual } from "@/components/seo/SeoEditorial";

export const metadata: Metadata = {
  title: "Saree Draping for Your Body Type: The Complete Guide — Iconik",
  description: "How to drape a saree to flatter every body type. Apple, pear, rectangle, hourglass, and inverted triangle saree draping techniques — pallu placement, petticoat height, and blouse guidance.",
  keywords: "saree draping body type India, how to drape saree for apple shape, saree for pear body, saree draping guide Indian women, how to wear saree to look slim India",
  alternates: { canonical: "https://www.iconik.pro/style-guides/saree-draping-body-type" },
  openGraph: {
    title: "Saree Draping for Your Body Type: The Complete Guide — Iconik",
    description: "Body-type-specific saree draping techniques for all 5 silhouettes — pallu, blouse, and petticoat guidance.",
    url: "https://www.iconik.pro/style-guides/saree-draping-body-type",
    images: [{ url: "/images/seo/saree-drape-direction-body-balance-iconik-og.webp", width: 1200, height: 630, alt: "Same Indian woman comparing horizontal and vertical saree pallu direction — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Saree Draping for Your Body Type: The Complete Guide — Iconik",
    description: "Pallu direction, pleat volume and border placement change saree balance while the body remains the same.",
    images: ["/images/seo/saree-drape-direction-body-balance-iconik-og.webp"],
  },
};

const faqs = [
  {
    q: "Which saree draping style makes you look slimmer?",
    a: "The Nivi drape (the most common draping style, where the pallu falls over the left shoulder) with the pallu styled as a vertical fall — hanging straight down from the shoulder rather than spread horizontally across the chest — creates a strong vertical line. Combined with a solid-colour saree without a contrasting border, this creates the most elongating, slimming effect.",
  },
  {
    q: "What is the best petticoat height for creating a taller silhouette?",
    a: "Tie the petticoat at the natural waist — not above it. A petticoat tied above the natural waist creates a high horizontal line that shortens the torso and creates a matronly silhouette. At the natural waist, the full length of the saree falls vertically from the hip, creating maximum elongation.",
  },
  {
    q: "How should a pear-shaped woman drape her pallu?",
    a: "The pallu should be styled to create visual interest and volume at the upper body — draping the pallu across the front at chest level, or pinning it at the shoulder with a brooch and allowing it to fan out slightly across the chest. This draws the eye upward and balances wide hips with upper body visual weight.",
  },
  {
    q: "What blouse length works best for a short torso when wearing a saree?",
    a: "The blouse hem should sit exactly at the natural waist — not cropped above it. A gap of skin between the blouse hem and the petticoat waistband creates a visual horizontal break that makes the torso look shorter. Blouses that end precisely at the natural waist, with the petticoat waistband hidden, create the cleanest, most elongating effect for short torsos.",
  },
];

export default function SareeDrapingBodyTypePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Saree Draping for Your Body Type: The Complete Guide",
        "description": "Body-type-specific saree draping guide for all 5 Indian female silhouettes.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "dateModified": "2026-07-24",
        "image": "https://www.iconik.pro/images/seo/saree-drape-direction-body-balance-iconik.webp",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/style-guides/saree-draping-body-type" },
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
          { "@type": "ListItem", "position": 3, "name": "Saree Draping by Body Type", "item": "https://www.iconik.pro/style-guides/saree-draping-body-type" },
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
              <li className="text-gray-800 font-medium">Saree Draping by Body Type</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Saree Draping for Your Body Type: The Complete Guide
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              The saree is one of the most silhouette-adaptable garments in existence — the same six yards can be draped to elongate, add volume, define the waist, or balance proportions. The secret is knowing which adjustments serve your specific body type. This guide gives you body-type-specific draping techniques, blouse guidance, and pallu placement for all five silhouettes.
            </p>
          </header>

          <SeoTeachingVisual
            src="/images/seo/saree-drape-direction-body-balance-iconik.webp"
            alt="Same fuller-bodied Indian woman with a horizontal pallu stop and a narrower vertical pallu fall in the same navy saree."
            caption="The saree and body stay the same; pallu direction, pleat volume and border placement change the visual balance."
            width={1024}
            height={1536}
            priority
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Three Variables That Determine How a Saree Looks</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Before the silhouette-specific guidance, the three universal variables that affect how any saree looks on any body:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Petticoat position:</strong> Tied at the natural waist (most elongating) vs higher (creates horizontal break). The petticoat waistband should always be hidden by the saree — visible waistbands add bulk at the midsection.</li>
              <li><strong>Pallu position:</strong> Draped vertically over the shoulder (elongating, slimming) vs spread horizontally across the chest (adds width). Pinned vs free-hanging (practical vs formal).</li>
              <li><strong>Blouse length and neckline:</strong> The blouse hem at the natural waist creates the cleanest silhouette. The neckline type follows face shape and body type guidelines.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Apple Body Type: Saree Draping Formula</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The goal for an apple silhouette: create a vertical line through the midsection and draw attention to the face and décolletage rather than the waist area.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Choose a solid-colour saree or a saree with a minimal, tonal print — avoid bold horizontal borders at the hip</li>
              <li>Pleat count: fewer, wider pleats for a cleaner fall over the midsection</li>
              <li>Pallu: over the left shoulder, draped as a clean vertical fall — pinned at the shoulder, not fanned out</li>
              <li>Blouse: boat neck or V-neck, ending exactly at the natural waist</li>
              <li>Avoid: crop blouses that expose the midsection; heavy embroidery at the hip</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pear Body Type: Saree Draping Formula</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The goal for a pear silhouette: add visual interest and weight to the upper body; keep the lower body visually quiet.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Choose a saree with a heavy, embellished pallu — the visual weight at the shoulder and chest balances wide hips</li>
              <li>Blouse: embellished, contrasting, or structured to draw the eye upward — this is where all the visual interest should sit</li>
              <li>Pallu: draped across the chest, fanned or pinned at the shoulder to create upper body volume</li>
              <li>Skirt section: plain, minimal border, solid colour</li>
              <li>The contrast principle: embellished or printed blouse + plain saree body = visual balance for pear proportions</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Rectangle Body Type: Saree Draping Formula</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The goal for a rectangle silhouette: create waist definition where none exists naturally.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>A saree with a contrasting blouse creates a visual waist break — the colour change at the waist defines the waist line</li>
              <li>Blouse: cropped or ending exactly at the natural waist; a fitted blouse with a structured bodice creates shape</li>
              <li>A thin belt or waist chain over the saree at the natural waist is increasingly popular and highly effective for rectangle proportions</li>
              <li>Pallu: draped asymmetrically — one side higher than the other creates an asymmetry that visually implies a waist</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hourglass Body Type: Saree Draping Formula</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The goal for an hourglass silhouette: honour the natural shape without obscuring it.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Any draping style works — the hourglass silhouette is naturally saree-flattering</li>
              <li>Avoid: oversizing the drape or adding excessive fabric at the waist — the saree should follow the natural curve, not pad it</li>
              <li>Blouse: fitted at the bust and waist — a structured blouse that follows the curve is ideal</li>
              <li>The classic Nivi drape with a fitted blouse is the most elegant choice</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Inverted Triangle Body Type: Saree Draping Formula</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The goal for an inverted triangle: add visual volume at the hips to balance wide shoulders.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Choose a saree with a heavy embellished border at the hem — adds visual weight at the bottom</li>
              <li>Draping styles that add volume: the Gujarati or Sindhi drape — both bring the pallu to the front and add volume across the hip area</li>
              <li>Blouse: plain, minimal — a simple V-neck or round-neck blouse. No boat neck (adds shoulder width).</li>
              <li>Pallu: draped to fall at the front rather than over the shoulder — this adds hip and lower body visual weight</li>
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
              <li>→ <Link href="/style-guides/indian-wedding-guest-outfit" className="underline hover:opacity-70">Indian Wedding Guest Outfit Guide</Link></li>
              <li>→ <Link href="/style-guides/salwar-kameez-body-type" className="underline hover:opacity-70">Salwar Kameez by Body Type</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your complete saree formula?</h2>
            <p className="text-gray-600 mb-6">Your Iconik Style Blueprint includes body-type-specific saree draping guidance, blouse neckline formulas, and undertone-matched colour recommendations.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Saree Draping for Your Body Type: The Complete Guide.&quot; Iconik LLP, 2025. https://www.iconik.pro/style-guides/saree-draping-body-type</p>
          </div>

        </div>
      </main>
    </>
  );
}
