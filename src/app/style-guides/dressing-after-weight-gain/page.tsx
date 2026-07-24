import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dressing After Weight Gain: Style That Works for Your Body Now — Iconik",
  description: "How to dress confidently after weight gain. Body-neutral styling principles for Indian women — what fits your current shape, what to stop avoiding, and how to build a wardrobe that works now.",
  keywords: "dressing after weight gain India, plus size fashion Indian women, style after weight gain, how to dress heavier body India, fashion after gaining weight Indian women",
  alternates: { canonical: "https://www.iconik.pro/style-guides/dressing-after-weight-gain" },
  openGraph: {
    title: "Dressing After Weight Gain: Style That Works for Your Body Now — Iconik",
    description: "Body-neutral styling for Indian women after weight gain — current-body formulas, not aspirational ones.",
    url: "https://www.iconik.pro/style-guides/dressing-after-weight-gain",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Dressing after weight gain India — Iconik" }],
  },
};

const faqs = [
  {
    q: "Should I wait until I lose weight to invest in clothes?",
    a: "No. This is one of the most common style decisions that backfires: wearing ill-fitting clothes 'temporarily' often lasts for years and causes daily discomfort and reduced confidence. 3–5 pieces in your current size that fit well and make you feel confident are worth more than a full wardrobe of aspirational sizes. Your wardrobe should work for the body you have today.",
  },
  {
    q: "What silhouette works best after significant weight gain in the midsection?",
    a: "The A-line silhouette — fitted above the waist, flaring below — is the most universally flattering for midsection weight gain. In Indian garments: A-line kurtas or Anarkali suits. In western wear: wrap dresses, A-line midi skirts, or flared trousers with a tucked blouse. The principle is to define above the weight change, and let the garment flow past it.",
  },
  {
    q: "Which fabrics are most comfortable and flattering after weight gain?",
    a: "Fabrics that drape and move — crepe, viscose, soft cotton-linen — are more forgiving than structured or stiff fabrics. They don't cling to new contours or restrict movement. Avoid very stretchy jersey (clings) and very stiff brocade or raw silk (no give). A fabric that moves with the body always looks better than one that fights it.",
  },
  {
    q: "How do I know if a garment truly fits after my body has changed?",
    a: "A correct fit has three markers: no pulling across the widest point (hips or bust), no bunching at the waist or underarm, and no visible tension lines anywhere. If there are tension lines across the chest, back, or hips — the garment is too small. If there is excess fabric pooling at the shoulders or waist — the garment is too large. A tailor can adjust the latter; the former requires a size up.",
  },
];

export default function DressingAfterWeightGainPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Dressing After Weight Gain: Style That Works for Your Body Now",
        "description": "Body-neutral styling guide for Indian women after weight gain — current-body wardrobe formulas.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/style-guides/dressing-after-weight-gain" },
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
          { "@type": "ListItem", "position": 3, "name": "Dressing After Weight Gain", "item": "https://www.iconik.pro/style-guides/dressing-after-weight-gain" },
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
              <li className="text-gray-800 font-medium">Dressing After Weight Gain</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Dressing After Weight Gain: Style That Works for Your Body Now
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Weight gain changes your silhouette — and the wardrobe that worked before may no longer fit or flatter. This guide does not ask you to wait, hide, or dress &quot;until you lose it.&quot; It gives you the styling principles that work for your current body, right now, using Indian and western garment formulas built around your new proportions.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Do Clothes Feel Wrong After Weight Gain?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              When weight is gained, it is rarely distributed evenly. Most Indian women gain weight primarily in the midsection (waist and abdomen), followed by the hips and thighs, and sometimes the upper arms. Clothes that fit before now create tension lines across the midsection, pull across the back, or refuse to button. The instinct is to size up in everything — but this creates a different problem: shoulders and necklines that now fit poorly.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The solution is to identify where the weight has concentrated and choose garments that fit the widest point accurately, then adjust other areas with a tailor if needed. A garment that fits at the hip with a slightly loose shoulder is fixable. A garment that fits at the shoulder but creates tension lines across the hips is not.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Indian Ethnic Outfits After Weight Gain?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Indian ethnic wear has a significant advantage here: many traditional silhouettes are designed with generous proportions and drape naturally over the body rather than contouring to it.
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>A-line kurta over straight trousers or churidars:</strong> The A-line kurta is cut to fit at the shoulder and bust, then flares gently toward the hem. This covers midsection weight while still being shaped and intentional.</li>
              <li><strong>Anarkali suits:</strong> The empire silhouette — fitted at the chest, flared from below the bust — is one of the most forgiving and most elegant options for midsection weight gain. It requires no definition at the waist.</li>
              <li><strong>Straight-cut salwar kameez in solid colours:</strong> A clean vertical line in an undertone-matched colour creates a slim, elongated impression without fitting tightly anywhere.</li>
              <li><strong>Sarees:</strong> A well-draped saree is among the most adaptable garments — the pleats and pallu can be adjusted to accommodate changing proportions, and the waist is defined by a petticoat tie rather than a seam.</li>
              <li><strong>Palazzo sets in matching colours:</strong> Wide palazzo trousers provide full lower-body coverage with no constriction, while a straight or A-line top creates balance.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Western Outfit Formulas After Weight Gain?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Wrap dress:</strong> Self-adjusting fit — the tie at the waist accommodates different proportions and the V-neck creates a vertical line through the centre. One of the most universally flattering silhouettes.</li>
              <li><strong>Wide-leg trousers + structured blazer worn open:</strong> The wide leg balances hip and thigh weight; the open blazer creates a vertical lapel line down the centre of the body.</li>
              <li><strong>A-line midi skirt + structured blouse:</strong> The A-line skirt requires a good fit at the waist and then flares — covering hips and thighs without contouring them.</li>
              <li><strong>Shirt dress in cotton-linen:</strong> Fits at the shoulders, button-through front creates a vertical line, and the shirt hem falls past the hip.</li>
              <li><strong>Straight-leg trousers + V-neck blouse + blazer:</strong> Classic formula that works at any weight — the blazer provides structure and the V-neck draws the eye upward.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Very fitted jersey or bodycon styles (cling to new contours). Horizontal stripes at the widest point. Waistbands that sit tightly at the natural waist without any give. Any garment that requires constant adjustment during the day.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Colour Choice Help After Weight Gain?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The principle of monochromatic dressing is particularly useful after weight gain: wearing the same colour from shoulder to hem creates an unbroken vertical line that elongates the silhouette and de-emphasises body changes. A deep navy salwar suit or a single-tone wrap dress reads as slimmer than a colour-blocked outfit of the same size.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Your Chromatic Harmony Mapping™ palette is especially important here — wearing your best undertone colour in a monochromatic head-to-toe look creates an outfit that is simultaneously slimming and complexion-enhancing. The right colour makes your face the focal point, not your changed silhouette.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Most Practical Approach to Rebuilding a Wardrobe After Weight Gain?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Start with 3–5 pieces that fit your current body perfectly. These become the anchor of your wardrobe. Identify your new silhouette type (your proportions may have shifted — a previous rectangle may now be apple; a previous pear may now be more hourglass) and build from there.
            </p>
            <ol className="space-y-2 text-gray-600 list-decimal list-inside">
              <li>Identify your current silhouette — measure bust, waist, and hip and reassess</li>
              <li>Find 2 base bottoms that fit perfectly at the hip (alter the waist if needed)</li>
              <li>Find 2–3 tops that fit at the shoulder and do not create tension across the back</li>
              <li>Add one A-line or wrap dress in your best undertone colour</li>
              <li>Add one blazer that fits at the shoulders and closes (or does not need to close) at the front</li>
            </ol>
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
              <li>→ <Link href="/body-type-styling/how-to-dress-tummy" className="underline hover:opacity-70">How to Dress a Tummy</Link></li>
              <li>→ <Link href="/style-guides/capsule-wardrobe-india" className="underline hover:opacity-70">Capsule Wardrobe for Indian Women</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you within 5 working days after the consultation?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis for your current silhouette, undertone palette, and 20 outfit formulas that work for you now.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Dressing After Weight Gain: Style That Works for Your Body Now.&quot; Iconik LLP, 2025. https://www.iconik.pro/style-guides/dressing-after-weight-gain</p>
          </div>

        </div>
      </main>
    </>
  );
}
