import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hourglass Body Shape Styling for Indian Women — Iconik",
  description: "Complete styling guide for hourglass body shape Indian women. How to accentuate your proportions in western and Indian ethnic wear — sarees, kurtas, lehengas, and more.",
  keywords: "hourglass body shape India, hourglass body type Indian women, hourglass figure Indian women, how to dress hourglass body India, hourglass saree style India, hourglass kurta style",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/hourglass-india" },
  openGraph: {
    title: "Hourglass Body Shape Styling for Indian Women — Iconik",
    description: "How to dress an hourglass figure in both western and Indian ethnic wear — sarees, kurtas, and lehengas included.",
    url: "https://www.iconik.pro/body-type-styling/hourglass-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Hourglass body shape styling — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hourglass Body Shape Styling for Indian Women — Iconik",
    description: "How to dress an hourglass figure in both western and Indian ethnic wear — sarees, kurtas, and lehengas included.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "What is the hourglass body shape?",
    a: "The hourglass body shape is defined by shoulders and hips that are approximately equal in width, with a significantly narrower waist — typically at least 8–10 inches narrower than the shoulder and hip measurements. The silhouette forms an hourglass curve. The key characteristic is the clearly defined waist, which creates natural proportion that most other body types aim to replicate through styling choices.",
  },
  {
    q: "What Indian ethnic wear suits an hourglass figure best?",
    a: "Sarees are arguably the most flattering garment for hourglass figures because the drape naturally accentuates the waist and hip curve. Fitted churidar suits with a medium-length kurta that hits at the hip are also excellent. Lehengas with a fitted choli and a full skirt showcase the waist-to-hip proportion beautifully. The guiding principle is simple: choose garments that reveal the waist rather than hiding it. Avoid boxy or heavily flared silhouettes that add volume uniformly across the torso.",
  },
  {
    q: "Should hourglass figures avoid anything?",
    a: "The main things to avoid are styles that obscure the waist — the defining feature of an hourglass figure. Specifically: boxy, oversized tops worn untucked; straight A-line kurtas that fall from shoulder to hem without following the body's curve; shapeless kaftans; and high-waisted bottoms worn with tucked-in tops only when the top's cut loses the waist definition. Also avoid very stiff, structured fabrics that do not drape and instead create a boxy silhouette.",
  },
  {
    q: "What saree drape works best for hourglass?",
    a: "The Nivi drape (the most common Indian drape) works beautifully for hourglass figures when the pleats are pinned neatly and the pallu is draped to fall at the front, revealing the fitted blouse and waist. A fitted, short blouse that ends just below the bust or at the natural waist accentuates the curve. Semi-sheer or soft fabrics — chiffon, georgette, soft silk — drape against the body and show the silhouette most clearly. Avoid very stiff or heavy fabrics (like very structured Kanjivaram) if you want the drape to follow your curves.",
  },
  {
    q: "Can hourglass figures wear straight-cut kurtas?",
    a: "Yes, but with important caveats. A straight-cut kurta worn loose and untucked over straight-cut bottoms will create a box-shaped silhouette that hides the hourglass curve. Instead: either tuck in a fitted straight-cut top, or belt a slightly longer straight kurta at the waist, or choose a fitted straight-cut kurta (not boxy) that skims the body rather than hanging away from it. The goal is always to keep the waist visible.",
  },
];

export default function HourglassIndiaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/body-type-styling/hourglass-india#article",
        "headline": "Hourglass Body Shape Styling for Indian Women",
        "description": "Complete guide to dressing an hourglass body shape for Indian women — western wear, sarees, kurtas, lehengas, and proportion principles.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-04-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/hourglass-india" },
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
          { "@type": "ListItem", "position": 3, "name": "Hourglass India", "item": "https://www.iconik.pro/body-type-styling/hourglass-india" },
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
              <li className="text-gray-800 font-medium">Hourglass — India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Hourglass Body Shape Styling for Indian Women
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              The hourglass body shape has balanced shoulders and hips with a clearly defined, narrower waist. The styling principle is simpler than for other body types: choose clothes that reveal the waist rather than hiding it. The challenge is that Indian ethnic wear — with its abundance of flared, boxy, and layered silhouettes — can inadvertently obscure the very proportion that makes an hourglass figure distinctive.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Styling Goal: Reveal the Waist</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              For every other body type, styling involves creating an illusion — adding width here, minimising volume there. For an hourglass figure, the goal is far simpler: don&apos;t hide the waist. The proportions are already there; the job of clothing is to work with them, not over them.
            </p>
            <p className="text-gray-600 leading-relaxed">
              This means: fitted silhouettes over boxy ones. Fabrics that drape over fabrics that stand away from the body. Belted or waist-defining styles over tent-shaped or trapeze silhouettes. Tucked-in tops over all-the-way-untucked. The hourglass figure is rare enough that fashion&apos;s tendency toward relaxed, volume-adding silhouettes is actively counter-productive for this body type.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Western Wear</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "Wrap dresses", desc: "Define and accentuate the waist naturally — one of the most universally flattering silhouettes for hourglass" },
                { name: "Fitted shift or bodycon dresses", desc: "Follow the body's curve — avoid anything with volume added at the waist or below" },
                { name: "High-waisted bottoms with tucked tops", desc: "Accentuate the waist-hip transition — particularly effective with slim-fit or bootcut trousers" },
                { name: "Belted blazers", desc: "A structured blazer belted at the waist accentuates the curve while maintaining polish" },
                { name: "Fitted trousers and jeans", desc: "Straight-leg or slight bootcut — follow the hip and thigh without adding excess volume" },
                { name: "Peplum tops", desc: "Flare at the hip line — can work well for hourglass as they echo the natural hip-waist proportion" },
              ].map((item) => (
                <div key={item.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Indian Ethnic Wear for Hourglass</h2>

            <div className="space-y-5">
              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Sarees</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Sarees are among the most flattering garments for hourglass figures. The drape inherently reveals the waist and accentuates the hip curve. Choose a fitted blouse that ends at or just below the natural waist. Soft, draping fabrics — chiffon, georgette, soft crepe silk — follow the body&apos;s contours. The Nivi drape with neatly pinned pleats and a forward-falling pallu shows the figure best. Avoid very stiff brocade or heavily structured Banarasi if you want the drape to follow your curves.</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Kurtas and Suits</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Fitted churidar suits with a medium-length kurta hitting at the hip are excellent. Princess-cut kurtas — fitted through the torso with side seams that follow the waist and hip curve — are particularly flattering. Avoid straight-cut or A-line kurtas worn loose and untucked; they create a boxy rectangle that hides the waist entirely. If you love straight-cut kurtas, belt them at the waist or tuck them into high-waisted bottoms.</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Lehengas</h3>
                <p className="text-gray-600 text-sm leading-relaxed">A fitted choli with a full lehenga skirt is a classic hourglass silhouette — the fitted top and flared bottom echo the natural proportions. Choose a choli that fits close to the body, ending at the natural waist or just below the rib cage. A slight flare in the skirt (not dramatically full) maintains the proportion without overwhelming the figure.</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Salwar Kameez and Palazzo Suits</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Fitted kameez with straight or churidar salwar shows the hourglass proportion best. Palazzo suits work when the kameez is fitted through the torso — a fitted top with wide-leg pants maintains elegance. Avoid heavily flared or peplum-style kameez with palazzo bottoms — too much volume at both the waist and leg can obscure the figure rather than enhance it.</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What to Avoid</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Boxy, oversized tops worn untucked — hide the waist completely</li>
              <li>Straight A-line kurtas that fall uniformly from shoulder to hem</li>
              <li>Very stiff fabrics that stand away from the body rather than draping against it</li>
              <li>Empire-waist styles — the seam sits above the natural waist, creating a boxy upper body</li>
              <li>Shapeless kaftans and tent-shaped dresses</li>
              <li>Very heavy, voluminous skirts with heavily embellished blouses — too much volume everywhere loses the proportion</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="divide-y divide-gray-200">
              {faqs.map((faq, i) => (
                <div key={i} className="py-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Related Guides</h2>
            <ul className="space-y-2 text-gray-600">
              <li>→ <Link href="/body-type-styling" className="underline hover:opacity-70">Body Type Styling — Complete Guide</Link></li>
              <li>→ <Link href="/body-type-styling/hourglass" className="underline hover:opacity-70">Hourglass Body Type — Western Wear Guide</Link></li>
              <li>→ <Link href="/style-guides/saree-draping-body-type" className="underline hover:opacity-70">Saree Draping by Body Type</Link></li>
              <li>→ <Link href="/style-guides/salwar-kameez-body-type" className="underline hover:opacity-70">Salwar Kameez by Body Type</Link></li>
              <li>→ <Link href="/body-type-styling/apple-body-shape-india" className="underline hover:opacity-70">Apple Body Shape — India</Link></li>
              <li>→ <Link href="/body-type-styling/pear-body-shape-india" className="underline hover:opacity-70">Pear Body Shape — India</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get 20 outfit formulas designed for your body type</h2>
            <p className="text-gray-600 mb-6">Geometric Silhouette Profiling™ builds personalised outfit recommendations for your exact proportions — western and ethnic — as part of your Iconik Style Blueprint.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Hourglass Body Shape Styling for Indian Women.&quot; Iconik, 2025. https://www.iconik.pro/body-type-styling/hourglass-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
