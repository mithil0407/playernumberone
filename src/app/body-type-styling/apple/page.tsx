import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Apple Body Shape Styling Guide for Indian Women — Iconik",
  description: "Complete apple body shape styling guide for Indian women. Discover which cuts, kurta lengths, saree drapes, and silhouettes elongate the torso and create a defined waist.",
  keywords: "apple body shape India, how to dress apple body type Indian women, apple body type outfits India, clothes for apple body shape India, apple silhouette styling India",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/apple" },
  openGraph: {
    title: "Apple Body Shape Styling Guide for Indian Women — Iconik",
    description: "Exact cuts, silhouettes, and Indian garment recommendations for the apple body type.",
    url: "https://www.iconik.pro/body-type-styling/apple",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Apple body shape styling guide — Iconik" }],
  },
};

const faqs = [
  {
    q: "How should an apple body type dress for work in India?",
    a: "For office wear, an apple silhouette works best with straight-cut kurtas at hip length, worn over cigarette trousers. The vertical line from shoulder to hem elongates the torso. V-necks and boat necks draw attention upward. Avoid cropped kurtis, which cut the torso at its widest point.",
  },
  {
    q: "What Indian ethnic wear suits an apple body type?",
    a: "Anarkali suits with a fitted yoke and flared skirt are excellent — they skim the midsection without clinging. For sarees, opt for a side-pleat draping style rather than the tight front-pleat Nivi drape, which adds volume at the waist. Salwar kameez in straight-cut styles work better than churidar sets.",
  },
  {
    q: "What colours should an apple body type wear?",
    a: "Dark, solid colours at the midsection zone create a slimming effect. Avoid loud prints at the waist. Use your undertone-matched palette (from Chromatic Harmony Mapping™) for the overall colour choice, then apply the darker shades from that palette to any garment that covers the midsection.",
  },
  {
    q: "What cuts should an apple body type avoid?",
    a: "Avoid high-waisted trousers that sit at the widest part of the midsection. Avoid boxy, blousy tops that add volume without structure. Avoid clingy fabrics across the stomach zone. Avoid wide horizontal belts at the natural waist.",
  },
];

export default function AppleBodyTypePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "Apple Body Shape Styling Guide for Indian Women",
        "description": "Complete apple body shape styling guide for Indian women using Geometric Silhouette Profiling™.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "datePublished": "2025-01-01",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/apple" },
      },
      {
        "@type": "HowTo",
        "name": "How to Dress for an Apple Body Shape",
        "description": "A step-by-step guide to dressing an apple body shape using Geometric Silhouette Profiling™",
        "step": [
          { "@type": "HowToStep", "name": "Identify your silhouette", "text": "If your midsection carries the most weight, your bust and hips are similar in width, and you have slimmer legs, you likely have an apple silhouette." },
          { "@type": "HowToStep", "name": "Choose the right cut", "text": "Empire waist cuts and A-line silhouettes skim the stomach and create the appearance of a defined waist without adding volume." },
          { "@type": "HowToStep", "name": "Apply colour strategically", "text": "Use your undertone-matched darker shades at the midsection zone. Avoid loud prints at the waist." },
          { "@type": "HowToStep", "name": "Select Indian garments", "text": "Anarkali suits with a fitted yoke, straight-cut kurtas at hip length, and sarees with side-pleat draping minimise midsection volume." },
        ],
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
          { "@type": "ListItem", "position": 3, "name": "Apple Body Type", "item": "https://www.iconik.pro/body-type-styling/apple" },
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
              <li className="text-gray-800 font-medium">Apple Body Type</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Apple Body Shape: Complete Styling Guide for Indian Women
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              An apple body shape carries more volume at the midsection relative to the shoulders and hips, with slimmer legs. The primary styling goal is to elongate the torso and create the visual appearance of a defined waist — using cut, colour, and draping rather than shapewear.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              How Do You Know If You Have an Apple Body Type?
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              If your waist measurement is similar to or larger than your bust and hip measurements, and your legs are proportionally slimmer, you likely have an apple silhouette. Iconik&apos;s Geometric Silhouette Profiling™ goes beyond these basic measurements — it maps the distribution of your soft tissue and the proportional relationship between your frame zones to give you a precise profile rather than a broad category.
            </p>
          </section>

          <div className="mb-12">
            <Image
              src="/apple-styling-examples.webp"
              alt="Apple body type outfit examples for Indian women — empire-waist kurta, Anarkali suit, and V-neck blouse combinations"
              width={800}
              height={600}
              className="w-full rounded-xl"
              priority
            />
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              How Should an Apple Body Type Dress for Work in India?
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              For office wear, the apple silhouette works best with <strong>straight-cut kurtas at hip length</strong>, worn over cigarette trousers or straight-leg pants. The unbroken vertical line from shoulder to hem elongates the torso without drawing attention to the midsection. V-necks and boat necks create an upward focal point.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Straight-cut kurtis in solid or vertical-print fabrics</li>
              <li>Salwar kameez in straight-cut styles (not churidar)</li>
              <li>Structured blazers open over a fitted cami — the open blazer creates a long vertical line</li>
              <li>Wide-leg trousers with a tucked-in fitted top — draws attention to the legs</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Best Indian Ethnic Wear for the Apple Body Type
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Anarkali suits</strong> with a fitted yoke and flared skirt are the single best garment for apple silhouettes. The yoke defines the upper body while the flared skirt skims the midsection entirely. The length creates visual elongation.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              For <strong>sarees</strong>, the draping style matters more than the fabric. Side-pleat draping (as opposed to the tight front-pleat Nivi drape) avoids adding a shelf of fabric at the waist. A shorter, structured blouse with slight padding at the shoulders balances the silhouette upward.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Colours and Prints for the Apple Body Type
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Use your undertone-matched colour palette as the foundation. Within that palette, apply darker shades to garments covering the midsection and lighter or brighter shades to the upper and lower zones. This creates optical division that shifts focus away from the centre of the body.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Avoid: large, bold prints at the waist; horizontal stripes across the midsection; sheer fabrics at the stomach zone without an opaque layer underneath.
            </p>
          </section>

          {/* FAQ */}
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

          {/* Related spokes */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/body-type-styling/pear" className="underline hover:opacity-70">Pear Body Shape Styling Guide</Link></li>
              <li>→ <Link href="/body-type-styling/rectangle" className="underline hover:opacity-70">Rectangle Body Shape Styling Guide</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Full Body Type Styling Hub</Link></li>
            </ul>
          </section>

          {/* CTA */}
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint — body analysis, colour palette, and 16+ outfit recommendations.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Apple Body Shape: Complete Styling Guide for Indian Women.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/apple</p>
          </div>

        </div>
      </main>
    </>
  );
}
