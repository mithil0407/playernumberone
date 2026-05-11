import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Indian Wedding Guest Outfit Guide: What to Wear by Body Type — Iconik",
  description: "What to wear as a wedding guest in India — body-type-specific outfit formulas for Indian weddings. Lehenga, saree, Anarkali, and indo-western options for every silhouette and occasion type.",
  keywords: "Indian wedding guest outfit, what to wear Indian wedding, wedding guest dress India, outfit for Indian wedding female, Indian wedding guest attire body type",
  alternates: { canonical: "https://www.iconik.pro/style-guides/indian-wedding-guest-outfit" },
  openGraph: {
    title: "Indian Wedding Guest Outfit Guide: What to Wear by Body Type — Iconik",
    description: "Body-type-specific wedding guest outfit formulas for Indian weddings — lehenga, saree, Anarkali, and indo-western options.",
    url: "https://www.iconik.pro/style-guides/indian-wedding-guest-outfit",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Indian wedding guest outfit guide — Iconik" }],
  },
};

const faqs = [
  {
    q: "What is the most universally flattering Indian wedding guest outfit?",
    a: "An A-line or flared Anarkali suit in a jewel tone matched to your undertone. The Anarkali silhouette — fitted bodice, flared skirt — flatters almost every body type by defining the upper body while creating graceful volume below. It requires no waist definition and is appropriate for day and evening events.",
  },
  {
    q: "Can I wear a lehenga as a wedding guest if I have an apple body type?",
    a: "Yes, with adjustments. For an apple body type, choose a lehenga with a high-waist or empire-style blouse that creates the waist definition the silhouette lacks, rather than a crop-top blouse style that exposes the midsection. A heavily embellished skirt with a plain blouse draws the eye downward. The dupatta styled as a stole over one shoulder creates a vertical line.",
  },
  {
    q: "What should I wear to an Indian wedding if I want to avoid looking overdressed?",
    a: "For daytime events (mehndi, haldi, sangeet), a salwar suit or simple Anarkali in a mid-intensity colour is appropriate — avoid heavy embroidery and very formal fabrics. For the wedding ceremony and reception, a full lehenga or saree is appropriate. Indo-western (fusion) outfits in structured fabrics are now widely accepted at modern Indian weddings across all sub-events.",
  },
  {
    q: "Is it appropriate to wear black or white to an Indian wedding?",
    a: "Black is now widely accepted at Indian weddings, particularly for evening events and urban contexts. It was traditionally avoided but this has changed significantly. White is still best avoided for most Hindu ceremonies where it is associated with mourning — though pastels and ivory are generally fine. For Christian Indian weddings, white attire advice should be checked against the specific family's preferences.",
  },
];

export default function IndianWeddingGuestOutfitPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Indian Wedding Guest Outfit Guide: What to Wear by Body Type",
        "description": "Body-type-specific wedding guest outfit formulas for Indian weddings — lehenga, saree, Anarkali, and indo-western options.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/style-guides/indian-wedding-guest-outfit" },
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
          { "@type": "ListItem", "position": 3, "name": "Indian Wedding Guest Outfit", "item": "https://www.iconik.pro/style-guides/indian-wedding-guest-outfit" },
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
              <li className="text-gray-800 font-medium">Indian Wedding Guest Outfit</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Indian Wedding Guest Outfit Guide: What to Wear by Body Type
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Indian wedding guest dressing has two variables that most guides ignore: your body type and the specific event within the wedding. The outfit that works for a sangeet is different from what works for a reception, and the formula that flatters an apple silhouette is different from the one that flatters a pear. This guide covers both dimensions.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Dress Code for Each Indian Wedding Event?</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Haldi ceremony:</strong> Wear something you do not mind getting turmeric on. Light cotton salwar suits, simple kurta-legging sets. Avoid embellishment and silk.</li>
              <li><strong>Mehndi:</strong> Colourful, festive, semi-formal. Anarkali suits, palazzo sets, embroidered salwar kameez. Avoid very formal lehengas.</li>
              <li><strong>Sangeet:</strong> Festive and celebratory — the most fashion-forward of all events. Lehengas, sharara sets, indo-western. Bold colours and embellishment are appropriate.</li>
              <li><strong>Wedding ceremony (day):</strong> Formal ethnic wear. A saree, full lehenga, or embellished Anarkali. Rich fabrics — silk, georgette, brocade.</li>
              <li><strong>Reception (evening):</strong> The most formal event. Full lehenga, silk saree, heavily embellished Anarkali. Jewel tones and rich embroidery are expected.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Should Each Body Type Wear to an Indian Wedding?</h2>
            <ul className="space-y-4 text-gray-600 list-disc list-inside">
              <li>
                <strong>Apple (fuller midsection):</strong> Empire-cut Anarkali with a fitted bodice below the bust. Lehenga with a high-waist blouse or a blouse with strategic embellishment at the neckline to draw the eye up. Saree with a boat-neck blouse and a pallu styled to flow vertically.
              </li>
              <li>
                <strong>Pear (wider hips):</strong> Heavily embellished or embroidered blouse with a plain lehenga skirt. Upper body takes the visual interest; lower body stays quiet. A salwar kameez with a statement dupatta and plain palazzo. Saree with a heavily embroidered or contrasting blouse.
              </li>
              <li>
                <strong>Rectangle (minimal waist definition):</strong> Lehenga with a crop blouse and a statement waist-cinching belt. Wrap-style anarkali. Saree with a fitted blouse and a waist-defining belt — increasingly popular at modern weddings.
              </li>
              <li>
                <strong>Hourglass (defined waist):</strong> Any silhouette works — the key is garments that fit at the waist. Avoid oversized or boxy styles that obscure the natural silhouette. Fitted lehenga blouses. Sarees with tailored blouses that define the waist.
              </li>
              <li>
                <strong>Inverted Triangle (wider shoulders):</strong> Lehenga with an embellished skirt and a plain, minimal blouse. Wide-flare Anarkali. Saree draped to add visual volume at the hip (the Gujarati or Bengali draping style adds hip fullness).
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Colours Work Best for Indian Wedding Guest Outfits?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Your Chromatic Harmony Mapping™ palette is your starting filter — choose your outfit colour from your jewel-tone accents. Indian weddings are high-colour events; your best jewel tone worn confidently will be more striking than a &quot;safe&quot; muted choice.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Warm undertone:</strong> Rust, terracotta, deep mustard gold, warm green, coral red, warm burgundy</li>
              <li><strong>Cool undertone:</strong> Cobalt blue, emerald green, deep fuchsia, royal purple, midnight blue, cool crimson</li>
              <li><strong>Neutral undertone:</strong> Deep teal, dusty rose, muted plum, warm taupe with gold embroidery</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Colour considerations:</strong> Traditionally avoid white (mourning), bright red (reserved for brides in many communities), and very similar shades to the bride&apos;s known outfit colour.
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
              <li>→ <Link href="/style-guides/saree-draping-body-type" className="underline hover:opacity-70">Saree Draping by Body Type</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/style-guides/diwali-outfit-body-type" className="underline hover:opacity-70">Diwali Outfit by Body Type</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your wedding outfit formula?</h2>
            <p className="text-gray-600 mb-6">Your Iconik Style Blueprint includes occasion-specific outfit formulas — including wedding events — for your exact body type and undertone palette.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Indian Wedding Guest Outfit Guide: What to Wear by Body Type.&quot; Iconik LLP, 2025. https://www.iconik.pro/style-guides/indian-wedding-guest-outfit</p>
          </div>

        </div>
      </main>
    </>
  );
}
