import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pear Body Shape Styling: The Indian Women's Playbook — Iconik",
  description: "Complete pear body shape guide for Indian women. How to balance a wider hip with Indian ethnic wear — salwar suits, sarees, kurtas, and western wear — using Geometric Silhouette Profiling™.",
  keywords: "pear body shape India, pear body type Indian women, pear silhouette Indian women, how to dress pear body shape India, pear shaped Indian women styling",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/pear-body-shape-india" },
  openGraph: {
    title: "Pear Body Shape Styling: The Indian Women's Playbook — Iconik",
    description: "Exact Indian garment formulas for the pear body shape — how to create upper body balance using kurtas, Anarkalis, and sarees.",
    url: "https://www.iconik.pro/body-type-styling/pear-body-shape-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Pear body shape styling guide for Indian women — Iconik" }],
  },
};

const faqs = [
  {
    q: "Should a pear body shape avoid wearing bright colours on the bottom?",
    a: "As a general principle, yes — brighter colours on the lower body increase visual emphasis on the hip zone. However, this is not absolute. A well-chosen wide-leg palazzo in a vibrant undertone-matched colour can work if the top has equal or greater visual weight. The principle is balance, not elimination.",
  },
  {
    q: "What is the best Anarkali style for a pear shape?",
    a: "An Anarkali with a boat-neck or wide-neck yoke, embellishment concentrated on the bodice (not the skirt), and a full flare from the hip. The embellishment at the yoke draws the eye upward and creates visual width at the shoulders, balancing the hip-dominant silhouette.",
  },
  {
    q: "Do palazzo pants suit a pear body shape?",
    a: "Yes. Palazzo pants are one of the best lower-body options for pear shapes. The volume of the wide leg balances the hip width rather than contrast-emphasising it, and creates an elongated leg line from hip to hem.",
  },
  {
    q: "How is pear different from hourglass?",
    a: "An hourglass has shoulders and hips roughly equal in width with a defined waist. A pear has hips noticeably wider than shoulders. The styling logic is different: hourglass styling emphasises the waist, while pear styling focuses on visual upper body broadening to create proportion.",
  },
];

export default function PearBodyShapeIndiaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Pear Body Shape Styling: The Indian Women's Playbook",
        "description": "Complete pear body shape styling guide for Indian women using Geometric Silhouette Profiling™.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/pear-body-shape-india" },
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
          { "@type": "ListItem", "position": 3, "name": "Pear Body Shape India", "item": "https://www.iconik.pro/body-type-styling/pear-body-shape-india" },
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
              <li className="text-gray-800 font-medium">Pear Body Shape India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Pear Body Shape Styling: The Indian Women&apos;s Playbook
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              A pear body shape has hips and thighs noticeably wider than the shoulders and bust. The styling goal is visual balance — broadening the upper body optically to create proportion. Not covering the lower body. Not hiding the hips. Balancing them. Here are the exact Indian garment formulas that achieve it.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is a Pear Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The pear silhouette is defined by shoulders narrower than hips, with a relatively defined waist. The hip and thigh zone carries the most width. In Geometric Silhouette Profiling™, this is classified as a hip-dominant silhouette.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              It is very common in Indian women — Indian women tend to carry weight and structural width in the hip and thigh zone. This is not a problem or a flaw. It is a specific proportional geometry with a clear styling solution: add visual weight to the upper body to match what exists naturally at the lower body.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Core Styling Principle for a Pear Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The goal is to visually widen the upper body. This is achieved through: structural details at the shoulder zone (boat necks, embellishment, padded shoulders), bright or bold colours at the upper body, volume at the upper body (structured yokes, puffed sleeves in moderation), and dark or plain fabrics at the lower body.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The inverse — adding volume or brightness to the lower body — increases the visual width of the hips and deepens the top-to-bottom proportion disparity. The principle is balance, not concealment.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Indian Ethnic Wear Works Best for a Pear Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Boat-neck and wide-neck kurtas</strong> are the strongest upper-body choice — they create visual width at the shoulder zone, optically balancing the hip width below.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A <strong>printed or embroidered dupatta draped over both shoulders</strong> adds significant upper body visual weight. This is one of the most effective and underused pear-shape tools in Indian dressing.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Boat-neck or wide-neck kurtas with embellishment at the yoke</li>
              <li>Dupatta draped across both shoulders (adds upper body volume)</li>
              <li>A-line Anarkali suits (flow from hip, no emphasis on width)</li>
              <li>Palazzo pants with a fitted, embellished or printed top</li>
              <li>Salwar kameez with a structured boat-neck yoke</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Gathered or lehenga-style skirts with heavy embellishment at the hip zone. Tight churidars without a long kurti. Horizontal border details at the hip line of the kurta. Anything that adds visual weight to the lower body rather than the upper.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Western Wear Works Best for a Pear Body Shape?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Wide-leg trousers</strong> are excellent — the volume of the wide leg visually balances the hip width rather than contrast-emphasising it. Paired with a structured fitted top or blazer with shoulder detail, this creates a fully balanced silhouette.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Wide-leg trousers with a structured or embellished top</li>
              <li>Boat-neck and off-shoulder tops (broaden shoulders visually)</li>
              <li>A-line midi skirts in dark solid colours</li>
              <li>Flared jeans with a bright or structured top</li>
              <li>Wrap dresses (define waist, fall from hip)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Skinny jeans with a fitted top (maximises the visual hip-to-shoulder ratio). Pencil skirts. Tops that end at the hip or create a horizontal line at the hip level.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Should a Pear Shape Wear a Saree?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The pallu is the pear shape&apos;s most powerful tool. Draping the pallu broadly over the left shoulder — with volume and spread — adds significant visual width to the upper body. Choose sarees with heavier embellishment, a bolder border, or a more prominent design in the body fabric at the pallu zone.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Blouse:</strong> Boat neck or bateau neck in structured fabric, with slightly padded or structured shoulders. The blouse should draw the eye outward at the shoulder. Petticoat tied at the natural waist (not at the hip) — this allows the saree to fall cleanly from the waist, not add fabric at the hip.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Colours and Prints for the Pear Body Shape</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              From your Chromatic Harmony Mapping™ palette: apply brighter, bolder colours from your palette to the upper body. Use darker, solid colours from the same palette for the lower body. The colour contrast between top and bottom creates the visual weight shift you need.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Bold prints or metallic fabrics concentrated at the hip and thigh zone. Horizontal stripes or borders at the hip line. Light-coloured palazzos or lehengas with a dark top — this reverses the balance principle entirely.
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
              <li>→ <Link href="/body-type-styling/pear" className="underline hover:opacity-70">Pear Body Type: Styling Guide</Link></li>
              <li>→ <Link href="/body-type-styling/apple-body-shape-india" className="underline hover:opacity-70">Apple Body Shape India Guide</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations specific to your pear silhouette.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Pear Body Shape Styling: The Indian Women&apos;s Playbook.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/pear-body-shape-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
