import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Look Taller with Clothing: The Vertical Line Method — Iconik",
  description: "Science-backed guide to looking taller with clothing for Indian women. The vertical line method, best cuts, heel rules, and how Indian garments can add visual height.",
  keywords: "how to look taller with clothes India, dressing to look taller Indian women, vertical line method styling India, petite fashion India, how to appear taller clothing India",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/how-to-look-taller-clothing" },
  openGraph: {
    title: "How to Look Taller with Clothing: The Vertical Line Method — Iconik",
    description: "The vertical line method — how to use clothing geometry to create visual height for Indian women.",
    url: "https://www.iconik.pro/body-type-styling/how-to-look-taller-clothing",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "How to look taller with clothing — Iconik" }],
  },
};

const faqs = [
  {
    q: "Does wearing vertical stripes actually work?",
    a: "Yes, but placement matters. Vertical stripes running the full length of the body create real elongation. Very wide vertical stripes can have the opposite effect — they add visual width as well as length. Narrow pinstripes or fine vertical prints are the most effective.",
  },
  {
    q: "What heel height is best for petite Indian women?",
    a: "A 2–3 inch block heel is practical and effective. The heel colour should match the salwar or trouser, not contrast — this extends the visual leg line rather than cutting it at the ankle. Nude or skin-tone heels elongate the leg by not creating a colour break at the ankle.",
  },
  {
    q: "Can a saree make you look taller?",
    a: "Yes, when draped strategically. A saree in a solid colour with a matching or tonal blouse, worn with the pallu in a vertical fall rather than draped across horizontally, creates excellent height illusion. The petticoat tied at the natural waist (not high) allows the full length of the saree to fall vertically.",
  },
  {
    q: "What is the best kurta length for looking taller?",
    a: "Knee-length or longer, in the same colour as the bottom. The longer the garment, the more vertical line it creates — provided it maintains a straight line without gathering at the waist. A floor-length Anarkali in a single colour is one of the most height-creating garments available.",
  },
];

export default function HowToLookTallerPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "How to Look Taller with Clothing: The Vertical Line Method",
        "description": "The vertical line method for creating visual height in Indian women's styling.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/how-to-look-taller-clothing" },
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
          { "@type": "ListItem", "position": 3, "name": "How to Look Taller with Clothing", "item": "https://www.iconik.pro/body-type-styling/how-to-look-taller-clothing" },
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
              <li className="text-gray-800 font-medium">How to Look Taller with Clothing</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              How to Look Taller with Clothing: The Vertical Line Method
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Height is a proportion problem. Clothing creates the illusion of a longer, leaner silhouette by controlling where the eye travels. The vertical line method — creating unbroken top-to-bottom visual lines — is the single most effective technique, and it applies perfectly to Indian garment categories.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Vertical Line Method?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The human eye follows lines. A vertical line — unbroken from shoulder to hem — makes the body appear taller because the eye travels the full length in one movement. A horizontal line (a contrasting waistband, a colour break, a horizontal print) interrupts that movement and makes the body appear wider and shorter.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The goal of height-creating dressing is to maximise vertical visual movement and minimise horizontal breaks. This does not require heels. It can be achieved entirely through garment choice and colour strategy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Which Cuts Create the Strongest Vertical Lines?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Monochromatic outfits:</strong> Same colour top and bottom — eliminates the horizontal break at the waist entirely.</li>
              <li><strong>Long straight kurtas over matching salwars:</strong> The unbroken vertical from shoulder to ankle creates maximum elongation.</li>
              <li><strong>Vertical-print fabrics:</strong> Pinstripes, narrow vertical paisleys, elongated geometric prints.</li>
              <li><strong>Deep V-necks:</strong> The V draws the eye downward through the chest centre — extending the perceived torso length.</li>
              <li><strong>Bootcut or wide-leg trousers:</strong> Balance the hip width optically, making the legs appear longer.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Indian Ethnic Wear Creates the Most Height?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Floor-length Anarkali suits in a single solid colour</strong> are the most height-creating Indian garment available. The unbroken line from neck to hem — with no waist seam breaking the flow — makes even a petite woman appear significantly taller.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Matching kurta and salwar sets</strong> in the same fabric and colour achieve the same effect in a more versatile, everyday format.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Floor-length Anarkali in solid colour</li>
              <li>Matching kurta-salwar sets (same colour)</li>
              <li>Palazzo sets in solid matching colour</li>
              <li>Sarees with solid-colour body and matching tonal blouse</li>
              <li>Churidar sets with a long straight kurti (same colour)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Lehenga-choli with a contrasting waistband at the natural waist — this creates a strong horizontal break. Embellished waistbands. Kurtas with contrasting yoke or horizontal design details across the upper body.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Do Heels Affect Height Perception?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Even 2–3 inches of heel lifts posture, elongates the calf visually, and raises the body&apos;s overall line. The heel colour matters as much as the heel height: a heel in the same colour as the salwar or trouser extends the visual leg line rather than creating a colour break at the ankle.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Nude or skin-tone heels</strong> are universally effective because they create no ankle colour break — the eye reads the leg as extending all the way to the ground. This is the most elongating heel choice regardless of the outfit colour.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Should You Avoid When You Want to Look Taller?</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Colour blocking with a strong horizontal contrast line at the waist</li>
              <li>Cropped tops or kurtis (create a horizontal break mid-torso)</li>
              <li>Ankle strap shoes (create a horizontal line at the narrowest part of the leg)</li>
              <li>Oversized, shapeless garments (the eye cannot follow a vertical line through shapeless volume)</li>
              <li>Heavy horizontal embellishment or borders at the waist or hem</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Does Monochromatic Dressing Work Best for Height?</h2>
            <p className="text-gray-600 leading-relaxed">
              Wearing one colour head to toe eliminates every horizontal break. A cobalt blue kurta with cobalt salwar and cobalt heels is an unbroken vertical line from shoulder to floor. The eye travels the full length without interruption. Combined with your Chromatic Harmony Mapping™ palette, this creates outfits that are simultaneously height-creating and flattering to your complexion.
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
              <li>→ <Link href="/body-type-styling/short-torso-styling" className="underline hover:opacity-70">Short Torso Styling Guide</Link></li>
              <li>→ <Link href="/body-type-styling/pear-body-shape-india" className="underline hover:opacity-70">Pear Body Shape India Guide</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations that work for your proportions.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;How to Look Taller with Clothing: The Vertical Line Method.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/how-to-look-taller-clothing</p>
          </div>

        </div>
      </main>
    </>
  );
}
