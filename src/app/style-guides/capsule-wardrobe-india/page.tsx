import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Capsule Wardrobe for Indian Women: The Complete Build Guide — Iconik",
  description: "How to build a capsule wardrobe that works for Indian women. Body-type-specific pieces, undertone-matched colours, ethnic and western mix, and the exact 15-piece formula.",
  keywords: "capsule wardrobe India, capsule wardrobe Indian women, minimalist wardrobe India, how to build capsule wardrobe India, Indian women capsule wardrobe 2025",
  alternates: { canonical: "https://www.iconik.pro/style-guides/capsule-wardrobe-india" },
  openGraph: {
    title: "Capsule Wardrobe for Indian Women: The Complete Build Guide — Iconik",
    description: "The exact 15-piece capsule wardrobe formula for Indian women — ethnic and western, body-specific, undertone-matched.",
    url: "https://www.iconik.pro/style-guides/capsule-wardrobe-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Capsule wardrobe for Indian women — Iconik" }],
  },
};

const faqs = [
  {
    q: "How many pieces do you need in a capsule wardrobe for India?",
    a: "15–20 pieces covers most Indian lifestyles comfortably: 5–6 tops or kurtas, 3–4 bottoms, 2 dresses or full sets, 1–2 jackets or blazers, 2–3 occasion pieces. The number matters less than the interoperability — every piece should work with at least 3 others in the wardrobe.",
  },
  {
    q: "Should an Indian capsule wardrobe include ethnic wear?",
    a: "Yes. An Indian capsule wardrobe that excludes ethnic wear is incomplete for the lifestyle it needs to serve: festivals, weddings, family events, and most formal occasions in India require or strongly favour ethnic or fusion wear. A practical Indian capsule includes 30–40% ethnic pieces (salwar suits, kurtas, one Anarkali) alongside western basics.",
  },
  {
    q: "What is the best colour palette for an Indian capsule wardrobe?",
    a: "A capsule colour palette works in two layers: 3–4 neutrals (your undertone-specific navy, camel, charcoal, or cream) as the foundation, and 2–3 accent colours from your Chromatic Harmony Mapping™ palette for statement pieces. This ensures every item coordinates without making the wardrobe feel monotonous.",
  },
  {
    q: "How do I choose capsule pieces that flatter my body type?",
    a: "Each piece in the capsule should conform to your body-type silhouette formula. For example, a pear-shaped woman's capsule emphasises statement tops and plain bottoms; an apple-shaped woman's capsule prioritises A-line kurtas and wide-leg trousers. Generic capsule wardrobe lists fail because they are silhouette-blind — your list must match your proportions.",
  },
];

export default function CapsuleWardrobeIndiaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Capsule Wardrobe for Indian Women: The Complete Build Guide",
        "description": "How to build a capsule wardrobe for Indian women — body-type-specific, undertone-matched, ethnic and western mix.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/style-guides/capsule-wardrobe-india" },
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
          { "@type": "ListItem", "position": 3, "name": "Capsule Wardrobe India", "item": "https://www.iconik.pro/style-guides/capsule-wardrobe-india" },
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
              <li className="text-gray-800 font-medium">Capsule Wardrobe India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Capsule Wardrobe for Indian Women: The Complete Build Guide
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              A capsule wardrobe is not a minimalist exercise — it is a precision one. Every piece must work with every other piece, every piece must flatter your specific silhouette, and every piece must suit the range of occasions your life actually includes: daily work, weekends, festivals, weddings, and formal events. Generic capsule guides fail Indian women because they ignore silhouette, undertone, and the ethnic-western duality of Indian life.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Makes a Capsule Wardrobe Different from a Minimal Wardrobe?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A minimal wardrobe simply has fewer items. A capsule wardrobe has fewer items that work harder — every piece creates multiple outfits through interoperability. The difference is intentionality: a capsule is designed around a specific body, a specific colour palette, and a specific lifestyle.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The Indian capsule wardrobe challenge is that Indian lifestyles span more dress codes than most: conservative family events require ethnic wear; international client meetings may require western formal; weekends span casual and festive. A well-designed Indian capsule handles all of these without needing a separate wardrobe for each context.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the 15-Piece Indian Capsule Wardrobe Formula?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              This formula creates 40+ outfits across work, casual, and occasion contexts:
            </p>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Tops and Kurtas (5 pieces)</h3>
              <ol className="space-y-2 text-gray-600 list-decimal list-inside">
                <li>Straight-cut kurta in your best neutral (daily ethnic wear)</li>
                <li>Straight-cut kurta in your best accent colour (elevated daily)</li>
                <li>Structured work blouse — wrap or V-neck in a neutral</li>
                <li>Casual cotton top or T-shirt in a neutral</li>
                <li>Statement blouse or printed kurta in your best accent colour</li>
              </ol>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Bottoms (4 pieces)</h3>
              <ol className="space-y-2 text-gray-600 list-decimal list-inside">
                <li>Straight-leg trousers in your best neutral (work + occasion)</li>
                <li>Wide-leg trousers or palazzo in a neutral</li>
                <li>Churidar or straight salwar (pairs with kurtas)</li>
                <li>A-line or straight midi skirt in a neutral</li>
              </ol>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Full Outfits and Sets (3 pieces)</h3>
              <ol className="space-y-2 text-gray-600 list-decimal list-inside">
                <li>Wrap dress or structured dress in your best accent colour</li>
                <li>Salwar kameez set or Anarkali suit for formal/festive occasions</li>
                <li>Blazer + trouser matching set for corporate/meetings</li>
              </ol>
            </div>
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Layering (2 pieces)</h3>
              <ol className="space-y-2 text-gray-600 list-decimal list-inside">
                <li>Structured blazer in your best neutral (works over everything)</li>
                <li>Dupatta or stole in an accent colour (converts casual to occasion)</li>
              </ol>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Add 1 statement piece — a formal saree or lehenga — for your once-a-year wedding/major event requirement. This sits outside the daily capsule as a dedicated occasion piece.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Do You Choose the Colours for an Indian Capsule Wardrobe?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Your capsule colour palette is derived from your Chromatic Harmony Mapping™ undertone type. The structure is:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li><strong>Warm undertone capsule:</strong> Neutrals — camel, warm cream, chocolate brown. Accents — rust, terracotta, mustard, olive green.</li>
              <li><strong>Cool undertone capsule:</strong> Neutrals — navy, charcoal, cool grey. Accents — cobalt blue, burgundy, dusty rose, emerald green.</li>
              <li><strong>Neutral undertone capsule:</strong> Neutrals — taupe, soft white, warm grey. Accents — soft teal, muted coral, dusty lavender.</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Every piece must sit within one of these two categories (neutral or accent). If it does not, it will not coordinate with the rest of the capsule — and an item that does not coordinate creates decision paralysis rather than solving it.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Do You Adapt the Capsule to Your Body Type?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              The 15-piece formula above is a structure. The specific pieces within it vary by silhouette:
            </p>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Apple:</strong> Replace straight-cut kurtas with A-line kurtas. Replace A-line skirt with wide-leg trousers. Prioritise V-neck blouses.</li>
              <li><strong>Pear:</strong> Prioritise printed or embellished tops. Replace plain bottoms with wider-cut palazzo. Add structured blazer as a key layering piece.</li>
              <li><strong>Rectangle:</strong> Add wrap blouse and belted dress to create waist definition. Include one colour-blocked outfit for structure.</li>
              <li><strong>Hourglass:</strong> Replace straight-cut kurtas with fitted-waist kurtas. All dresses and kurtas should have defined waist seams.</li>
              <li><strong>Inverted Triangle:</strong> Replace all structured blazers with unstructured cardigans. Prioritise wide-leg and A-line bottoms. Replace boat-neck blouses with V-neck.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Most Common Capsule Wardrobe Mistakes Indian Women Make?</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Building without a colour palette — individual pieces look fine but nothing works together</li>
              <li>Excluding ethnic wear — the capsule does not cover actual life occasions</li>
              <li>Buying aspirational sizes — the capsule does not function because half of it does not fit</li>
              <li>Ignoring silhouette — choosing trendy pieces that do not flatter the specific body type</li>
              <li>Not investing in tailoring — an almost-right piece altered to perfect fit is worth three cheaply-made pieces</li>
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
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/style-guides/office-wear-indian-women" className="underline hover:opacity-70">Office Wear for Indian Women</Link></li>
              <li>→ <Link href="/faq/capsule-wardrobe-how-many-outfits" className="underline hover:opacity-70">How Many Outfits Can a Capsule Wardrobe Make?</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your capsule built for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint delivers a body-type-specific, undertone-matched capsule wardrobe list — exact pieces, exact colours, ready to shop.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Capsule Wardrobe for Indian Women: The Complete Build Guide.&quot; Iconik LLP, 2025. https://www.iconik.pro/style-guides/capsule-wardrobe-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
