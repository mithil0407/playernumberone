import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Plus Size Fashion India: Styling Guide for Fuller Indian Women — Iconik",
  description: "Complete styling guide for plus size Indian women. Body-type-specific outfit formulas, ethnic and western wear, fabric guidance, and how Geometric Silhouette Profiling™ works for fuller bodies.",
  keywords: "plus size fashion India, plus size Indian women style guide, fashion for fuller figure India, plus size ethnic wear India, plus size outfit Indian women",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/plus-size-india" },
  openGraph: {
    title: "Plus Size Fashion India: Styling Guide for Fuller Indian Women — Iconik",
    description: "Body-type-specific styling for plus size Indian women — ethnic and western wear formulas for fuller figures.",
    url: "https://www.iconik.pro/body-type-styling/plus-size-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Plus size fashion India — Iconik" }],
  },
};

const faqs = [
  {
    q: "Does the same body type advice apply to plus size women as to straight-size women?",
    a: "Yes — the underlying principle is identical. Body type is defined by proportional ratios (shoulder width vs hip width vs waist definition), not by absolute size. A plus size pear has the same shoulder-to-hip ratio as a straight-size pear and benefits from the same styling principles: upper body visual interest, quieter lower body, A-line silhouettes. Size changes the scale but not the proportion logic.",
  },
  {
    q: "What is the most flattering outfit formula for a plus size apple body type?",
    a: "A straight-cut or A-line kurta at hip length or below, in a solid undertone-matched colour, over straight trousers or a straight salwar in the same colour. The monochromatic combination creates an unbroken vertical line that elongates the full silhouette. A V-neckline or boat-neck draws the eye to the face rather than the midsection.",
  },
  {
    q: "How do I find well-fitting plus size ethnic wear in India?",
    a: "The most reliable source for well-fitting plus size ethnic wear is a local tailor — standard sizes in ready-to-wear rarely accommodate the range of plus size proportions accurately. Provide 7 measurements (bust, underbust, waist, hip, shoulder width, arm length, height) and choose the silhouette formula for your body type. Many larger Indian fashion brands now offer XXL–5XL in ethnic categories; Nykaa Fashion, Myntra, and Ajio all carry extended sizes.",
  },
  {
    q: "Should plus size women avoid bodycon or form-fitting clothes?",
    a: "This is a personal choice, not a style rule. From a pure proportion standpoint: form-fitting garments show the body exactly as it is — they do not create illusions of elongation or balance. For women who want to elongate, define, or balance their proportions, garments with strategic structure and fit (A-line, wrap, empire) achieve more specific optical effects than pure bodycon. But there is no rule that says plus size women cannot wear form-fitting clothing.",
  },
];

export default function PlusSizeIndiaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Plus Size Fashion India: Styling Guide for Fuller Indian Women",
        "description": "Body-type-specific styling guide for plus size Indian women.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/plus-size-india" },
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
          { "@type": "ListItem", "position": 3, "name": "Plus Size India", "item": "https://www.iconik.pro/body-type-styling/plus-size-india" },
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
              <li className="text-gray-800 font-medium">Plus Size India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Plus Size Fashion India: Styling Guide for Fuller Indian Women
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Plus size styling follows the same proportional principles as all body type styling — the variables are the same, the scale is different. A well-fitted garment in the right silhouette and the right colour will always look better than a poorly fitted garment in the &quot;correct&quot; size. This guide applies Iconik&apos;s body type framework specifically to fuller Indian figures.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Does &quot;Body Type&quot; Mean for Plus Size Women?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Body type is a proportional classification, not a size classification. A plus size woman has a body type — apple, pear, rectangle, hourglass, or inverted triangle — defined by the same ratios as a straight-size woman:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Shoulder width vs hip width</li>
              <li>Waist definition relative to hip and bust</li>
              <li>Torso vs leg proportion</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Geometric Silhouette Profiling™ uses these measurements for all body sizes. The styling formulas that result — which silhouettes create elongation, which create waist definition, which create balance — apply identically at any size.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Indian Ethnic Outfits for Plus Size Women?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Indian ethnic wear has an inherent advantage for plus size dressing: many traditional silhouettes are designed with volume, drape, and generous proportions — not the skin-tight fits of western fast fashion.
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Anarkali suits:</strong> The empire silhouette — fitted at the chest, flared from below the bust — is one of the most universally flattering for fuller bodies. It requires no waist definition and creates dramatic, elegant length.</li>
              <li><strong>Straight-cut salwar kameez:</strong> A well-fitted straight-cut kameez (fitted at the shoulder, straight through the torso) over a matching salwar creates a clean vertical line.</li>
              <li><strong>Palazzo kameez sets in solid undertone colours:</strong> Wide palazzo trousers provide comfortable lower body coverage; a straight or A-line kameez creates the upper body balance.</li>
              <li><strong>Sarees:</strong> A saree accommodates any body size without seams or waistbands — the drape adjusts to the body rather than the body adjusting to the garment. One of the most body-positive garments in existence.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Western Outfits for Plus Size Indian Women?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Wrap dress:</strong> Self-ties adjust to body proportions and accommodate size changes. The V-neck creates a vertical central line. One of the most consistently flattering western silhouettes for fuller bodies.</li>
              <li><strong>Wide-leg trousers + structured blazer worn open:</strong> The open blazer creates vertical lapel lines; wide-leg trousers balance the hip. Together, they create a strong elongating effect.</li>
              <li><strong>A-line midi dress:</strong> A well-fitted bodice with an A-line skirt — defines above the waist, flows past the hip. In a solid undertone colour, this is a simple, striking, complete outfit.</li>
              <li><strong>Shirt dress in structured fabric:</strong> Button-through, no waistband, fits at the shoulder — very adaptable and size-inclusive.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Fabrics Work Best for Plus Size Dressing?</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Crepe:</strong> Structured drape, holds shape, does not cling — excellent for kurtas and trousers</li>
              <li><strong>Cotton-linen blend:</strong> Breathable, structured, drapes well — particularly good for Indian heat</li>
              <li><strong>Viscose/rayon:</strong> Soft drape — good for Anarkalis and palazzo sets</li>
              <li><strong>Georgette:</strong> Excellent for Anarkalis and formal occasions — falls beautifully on fuller figures</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Thin jersey and chiffon that cling without structure; stiff brocades that add bulk without drape; any fabric that gaps at the bust or pulls across the back.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Colour and Print Guidance for Plus Size Indian Women</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The most effective colour strategy for plus size women is monochromatic dressing — wearing the same colour from shoulder to hem creates a vertical visual line that elongates the full silhouette. Your best jewel tone in a head-to-toe monochromatic look is more striking and more slimming than any black outfit.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Prints:</strong> Medium-scale prints in undertone-matched colours work well. Avoid very small, tight prints across the midsection (can create a busy, visually expanding effect); avoid very large prints at the widest point. Vertical or diagonal prints are more elongating than horizontal patterns.
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
              <li>→ <Link href="/body-type-styling/apple-body-shape-india" className="underline hover:opacity-70">Apple Body Shape India Guide</Link></li>
              <li>→ <Link href="/style-guides/dressing-after-weight-gain" className="underline hover:opacity-70">Dressing After Weight Gain</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your complete styling formula?</h2>
            <p className="text-gray-600 mb-6">Your Iconik Style Blueprint — body type analysis, undertone-matched colour palette, and 16+ outfit formulas that work for your current proportions.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Plus Size Fashion India: Styling Guide for Fuller Indian Women.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/plus-size-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
