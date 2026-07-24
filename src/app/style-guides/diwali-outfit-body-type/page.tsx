import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Diwali Outfit by Body Type: What to Wear for the Festival of Lights — Iconik",
  description: "What to wear for Diwali based on your body type. Lehenga, saree, Anarkali, and sharara formulas for apple, pear, rectangle, hourglass, and inverted triangle silhouettes.",
  keywords: "Diwali outfit body type India, what to wear Diwali Indian women, Diwali dress Indian women 2025, Diwali outfit ideas India, Diwali fashion Indian women body type",
  alternates: { canonical: "https://www.iconik.pro/style-guides/diwali-outfit-body-type" },
  openGraph: {
    title: "Diwali Outfit by Body Type: What to Wear for the Festival of Lights — Iconik",
    description: "Body-type-specific Diwali outfit formulas — lehenga, saree, Anarkali, and sharara for every silhouette.",
    url: "https://www.iconik.pro/style-guides/diwali-outfit-body-type",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Diwali outfit by body type India — Iconik" }],
  },
};

const faqs = [
  {
    q: "What colours are most appropriate for Diwali outfits?",
    a: "Diwali is associated with light, gold, and celebration — traditionally gold, deep reds, jewel tones, and warm earthy tones. For your Chromatic Harmony Mapping™ palette, choose your richest jewel-tone accent: warm undertone women look striking in rust, terracotta, deep gold, and warm burgundy; cool undertone women in cobalt blue, emerald green, deep fuchsia, and royal purple.",
  },
  {
    q: "Is a lehenga or Anarkali better for Diwali?",
    a: "Both are appropriate. A lehenga is more festive and formal — ideal for Diwali parties and evening gatherings. An Anarkali is more versatile — it works for pooja in the morning and a party in the evening. The choice depends on the formality of your specific event and your body type — the Anarkali is more universally flattering across silhouettes.",
  },
  {
    q: "What is the best Diwali outfit for an apple body type?",
    a: "A floor-length Anarkali in a rich jewel tone — deep burgundy, emerald, or cobalt depending on undertone. The empire silhouette (fitted at the chest, flared below) requires no waist definition and creates a dramatic, elegant silhouette. A matching dupatta draped as a stole completes the look.",
  },
  {
    q: "Can I wear western or indo-western for Diwali?",
    a: "Yes — indo-western fusion is increasingly common at urban Diwali celebrations. A structured kurta over fitted flared trousers, or a dhoti-style pant with an embellished blouse, are both appropriate. Traditional ethnic wear is not required for most modern Diwali contexts. The key is that the outfit feels festive — rich fabric, embellishment, or jewel-tone colour.",
  },
];

export default function DiwaliOutfitBodyTypePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Diwali Outfit by Body Type: What to Wear for the Festival of Lights",
        "description": "Body-type-specific Diwali outfit formulas for Indian women.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/style-guides/diwali-outfit-body-type" },
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
          { "@type": "ListItem", "position": 3, "name": "Diwali Outfit by Body Type", "item": "https://www.iconik.pro/style-guides/diwali-outfit-body-type" },
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
              <li className="text-gray-800 font-medium">Diwali Outfit by Body Type</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Diwali Outfit by Body Type: What to Wear for the Festival of Lights
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Diwali is the year&apos;s most photographed festival — and the outfit formulas that flatter every day are the same ones that create the best Diwali photographs. This guide maps the full range of Diwali-appropriate Indian garments — lehenga, saree, Anarkali, sharara, indo-western — to your specific body type, so you look your best at every light-lit celebration.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Apple Body Type: Diwali Outfit Formula</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Best choice:</strong> Floor-length Anarkali in a single jewel tone. Empire silhouette — fitted at the chest, flared below — does not require waist definition and creates a dramatic vertical line.</li>
              <li><strong>Second choice:</strong> Saree draped with a vertical pallu, plain body, V-neck blouse</li>
              <li><strong>Lehenga option:</strong> A high-waist lehenga blouse + heavy embellished skirt + dupatta styled to flow diagonally</li>
              <li><strong>Colour:</strong> Deep jewel tones in a single solid — avoid colour blocking that creates a horizontal line at the midsection</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pear Body Type: Diwali Outfit Formula</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Best choice:</strong> Heavily embellished or embroidered blouse + plain lehenga skirt. All the visual interest at the upper body.</li>
              <li><strong>Second choice:</strong> Saree with an embellished, contrasting blouse. The statement blouse draws the eye upward.</li>
              <li><strong>Anarkali option:</strong> A-line Anarkali with an embellished yoke — visual weight at chest and shoulder, flare past the hip</li>
              <li><strong>Colour:</strong> Bold or printed blouse + deep, plain skirt or saree body</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Rectangle Body Type: Diwali Outfit Formula</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Best choice:</strong> Sharara set — the wide flared sharara adds hip volume, creating the impression of a waist by contrast</li>
              <li><strong>Second choice:</strong> Lehenga with a fitted blouse and a waist chain or belt at the natural waist</li>
              <li><strong>Anarkali option:</strong> Wrap-style or empire-waist Anarkali — creates waist definition through fabric manipulation</li>
              <li><strong>Colour:</strong> Colour-blocked (contrasting blouse and skirt) with a matching dupatta used as a belt — creates waist definition</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Hourglass Body Type: Diwali Outfit Formula</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Best choice:</strong> Any silhouette — the hourglass proportions look excellent in the full range of festive Indian wear. A fitted lehenga blouse with a flared skirt is particularly striking.</li>
              <li><strong>Key principle:</strong> Avoid boxy or oversized silhouettes that obscure the natural shape. Every outfit should honour the waist definition.</li>
              <li><strong>Saree option:</strong> Classic Nivi drape with a tailored blouse — the most elegant choice for the hourglass silhouette</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Inverted Triangle Body Type: Diwali Outfit Formula</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li><strong>Best choice:</strong> Lehenga with a heavily embellished skirt + plain, minimal blouse. All visual weight at the lower body.</li>
              <li><strong>Second choice:</strong> Wide-flare Anarkali — the full flare creates lower body volume</li>
              <li><strong>Sharara option:</strong> Wide sharara + minimal plain blouse — the sharara volume at the leg creates hip balance</li>
              <li><strong>Colour:</strong> Dark, plain blouse + bright, embellished skirt — draws the eye to the lower body</li>
              <li><strong>Avoid:</strong> Boat-neck or off-shoulder styles; heavily embellished shoulders or necklines</li>
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
              <li>→ <Link href="/style-guides/indian-wedding-guest-outfit" className="underline hover:opacity-70">Indian Wedding Guest Outfit</Link></li>
              <li>→ <Link href="/style-guides/saree-draping-body-type" className="underline hover:opacity-70">Saree Draping by Body Type</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your Diwali outfit formula?</h2>
            <p className="text-gray-600 mb-6">Your Iconik Style Blueprint includes occasion-specific outfit formulas — including festival wear — for your exact body type and undertone palette.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Diwali Outfit by Body Type: What to Wear for the Festival of Lights.&quot; Iconik LLP, 2025. https://www.iconik.pro/style-guides/diwali-outfit-body-type</p>
          </div>

        </div>
      </main>
    </>
  );
}
