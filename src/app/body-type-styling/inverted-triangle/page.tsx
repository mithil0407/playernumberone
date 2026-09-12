import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Inverted Triangle Body Type: Styling Guide for Indian Women — Iconik",
  description: "How to dress an inverted triangle body shape. Balance broad shoulders with the right cuts, necklines, and silhouettes — including sarees, kurtas, and ethnic wear for Indian women.",
  keywords: "inverted triangle body type India, inverted triangle body shape Indian women, how to dress inverted triangle India, broad shoulders styling India, inverted triangle saree style, inverted triangle ethnic wear India",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/inverted-triangle" },
  openGraph: {
    title: "Inverted Triangle Body Type: Styling Guide for Indian Women — Iconik",
    description: "How to dress an inverted triangle body shape. Balance broad shoulders and create curves with the right silhouettes and ethnic wear.",
    url: "https://www.iconik.pro/body-type-styling/inverted-triangle",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Inverted triangle body type styling guide — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inverted Triangle Body Type: Styling Guide for Indian Women — Iconik",
    description: "How to dress an inverted triangle body shape. Balance broad shoulders and create curves with the right silhouettes and ethnic wear.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "How do I know if I have an inverted triangle body type?",
    a: "You have an inverted triangle body type if your shoulders are noticeably wider than your hips, your upper body carries more width than your lower body, and you tend to gain weight in your upper body first. Key markers: your shoulder width is more than 5cm wider than your hip width; your waist may be defined but your hips are narrow relative to your shoulders; you find tops hard to fit (too tight in the shoulders, too loose at the waist) more often than bottoms.",
  },
  {
    q: "Can inverted triangle body types wear sarees?",
    a: "Yes — sarees can be very flattering for inverted triangle body types when draped and styled correctly. The goal is to add volume at the hips and draw attention downward. Choose sarees with heavier embellishment or wider borders on the lower half. Drape the pallu to fall to one side at the hip rather than pinning it to the shoulder — this adds volume below the waist. Keep blouses simple and avoid heavy embroidery on the shoulders or chest area. A broad, heavy border at the saree's hem adds the visual weight you need at the bottom.",
  },
  {
    q: "What are the best ethnic outfits for an inverted triangle body shape?",
    a: "Anarkali suits are one of the best ethnic styles for inverted triangle bodies — the flared skirt adds hip volume naturally. A-line kurtas (fitted at the top, flared below the hip) also work well. Lehengas with a full, voluminous skirt paired with a simple blouse are excellent. Avoid straight kurtas that fall past the hip without any flare — they emphasise the broad shoulder-narrow hip proportion without balancing it. Sharara pants, palazzo suits, and gathered skirts are all strong choices.",
  },
  {
    q: "What necklines work best for inverted triangle body shape?",
    a: "V-necks and deep scoop necks are the most flattering — they draw the eye downward and visually narrow the shoulder area. Wrap necklines also work well. Avoid boat necklines and wide square necks, which follow the line of the shoulders and emphasise their width. Off-shoulder tops can work but often draw attention to shoulder breadth — proceed with care. Asymmetric necklines can help break the horizontal visual line across the shoulders.",
  },
  {
    q: "What should inverted triangle body types avoid wearing?",
    a: "Avoid styles that add visual weight to the upper body: boat necklines, cap sleeves, puff sleeves, structured blazers with strong shoulder seams, heavy embroidery on the chest or shoulders, horizontal stripes on the top half, and cropped tops with low-rise bottoms (which emphasise the waist-hip contrast without adding hip volume). Also avoid very slim, straight-leg trousers or cigarette pants when worn with fitted tops — this silhouette emphasises the width discrepancy between top and bottom.",
  },
];

export default function InvertedTrianglePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/body-type-styling/inverted-triangle#article",
        "headline": "Inverted Triangle Body Type: Styling Guide for Indian Women",
        "description": "Complete styling guide for inverted triangle body shape Indian women — how to balance broad shoulders, best necklines, ethnic wear tips, and what to avoid.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-04-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/inverted-triangle" },
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
          { "@type": "ListItem", "position": 3, "name": "Inverted Triangle", "item": "https://www.iconik.pro/body-type-styling/inverted-triangle" },
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
              <li className="text-gray-800 font-medium">Inverted Triangle</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Inverted Triangle Body Type: Styling Guide for Indian Women
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              The inverted triangle body type has broader shoulders than hips, with the upper body carrying more width and visual weight than the lower body. The styling goal is straightforward: add volume below the waist, minimise visual width at the shoulders, and create the illusion of a more balanced silhouette. This guide covers the best cuts, necklines, and ethnic wear for inverted triangle bodies — including sarees, kurtas, and lehengas.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Understanding the Inverted Triangle Shape</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              An inverted triangle body has its widest point at the shoulders, with hips that are narrower — sometimes significantly so. You may have a defined waist, but the shoulder-to-hip ratio creates a silhouette that is wider at the top than the bottom.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Common experiences for inverted triangle women: finding fitted tops that fit the shoulders but are too wide at the waist; feeling that most silhouettes make you look &quot;top-heavy&quot;; struggling to find ethnic blouses that sit correctly without pulling across the upper back; and finding that simple straight kurtas make you look boxy rather than streamlined.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The styling solution is not to hide the upper body — it is to balance it by creating equivalent visual weight at the lower body, so the proportions read as harmonious rather than top-heavy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Styling Goals</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li>Add visual volume to the hips and lower body</li>
              <li>Draw the eye downward with detail, pattern, and embellishment below the waist</li>
              <li>Choose necklines that narrow rather than extend the shoulder line</li>
              <li>Keep tops fitted and relatively simple; let bottoms carry the visual interest</li>
              <li>Create a defined waist to break the torso and establish proportion</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Tops and Necklines</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { name: "V-neck", desc: "Draws the eye downward and visually narrows the shoulder area — one of the most universally flattering necklines for inverted triangle" },
                { name: "Deep scoop neck", desc: "Similar effect to V-neck — elongates and draws attention toward the centre rather than the shoulders" },
                { name: "Wrap tops", desc: "Create a diagonal line that breaks the shoulder-width emphasis and accentuates the waist" },
                { name: "Fitted, simple blouses", desc: "For Indian ethnic wear — avoid heavy embroidery on the chest or shoulders, keep blouses streamlined" },
                { name: "Asymmetric necklines", desc: "Break the horizontal line across the shoulders and add visual interest without adding width" },
                { name: "Halter necks", desc: "Concentrate fabric at the front centre, visually reducing shoulder width on either side" },
              ].map((item) => (
                <div key={item.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <p className="font-semibold text-red-900 mb-2">Necklines to avoid</p>
              <p className="text-red-800 text-sm leading-relaxed">Boat necklines and wide square necks follow the shoulder line and make it appear wider. Cap sleeves and puff sleeves add visual width to the upper arm and shoulder. Off-shoulder styles can be particularly emphasising for inverted triangle bodies.</p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Bottoms</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { name: "A-line skirts", desc: "Add volume from waist to hem — the most effective silhouette for adding hip width" },
                { name: "Flared and circle skirts", desc: "Maximum volume at the bottom half — excellent for creating balance" },
                { name: "Palazzo pants", desc: "Wide-leg from the hip — adds the volume needed without being overtly voluminous" },
                { name: "Bootcut and wide-leg trousers", desc: "Gentle flare from the knee or hip adds visual balance to the lower body" },
                { name: "Gathered skirts", desc: "The gathering at the waistband creates hip width where there is less natural volume" },
                { name: "Printed or embellished bottoms", desc: "Pattern, embroidery, and detail draw the eye downward — exactly where you want visual attention" },
              ].map((item) => (
                <div key={item.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Indian Ethnic Wear for Inverted Triangle</h2>

            <div className="space-y-5">
              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Sarees</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Choose sarees with a heavier, wider border at the hem — this adds visual weight to the lower half. Drape the pallu to fall at the hip rather than pinning to the shoulder, which adds volume at the waist and hip. Keep the blouse simple: a V-neck or sweetheart blouse, no heavy embroidery on the shoulders or chest. Half-and-half sarees with a plain upper body and embellished lower section are excellent choices.</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Kurtas and Suits</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Anarkali suits are one of the best ethnic styles for inverted triangle bodies — the fitted bodice and dramatically flared skirt section create exactly the right balance. A-line kurtas (fitted at the shoulders, flaring below the hip) are also flattering. Pair with palazzo or patiala pants for maximum lower-body volume. Avoid straight kurtas worn with straight-cut bottoms — the silhouette will appear boxy.</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Lehengas</h3>
                <p className="text-gray-600 text-sm leading-relaxed">A full, voluminous lehenga skirt is ideal — it creates exactly the lower-body width that balances an inverted triangle silhouette. Choose a fitted, V-neck choli with minimal shoulder embellishment. Let the skirt carry the embellishment and detailing. Heavily embroidered blouses with broad straps or sleeves should be avoided.</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Sharara and Palazzo Suits</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Sharara pants — wide-flared from the hip — are one of the most flattering silhouettes for inverted triangle body types. They add dramatic volume at the lower body. Pair with a fitted, simple kurta top with a V or scoop neckline.</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What to Avoid</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Boat necklines and wide square necklines</li>
              <li>Cap sleeves, puff sleeves, and structured shoulder seams</li>
              <li>Heavy embroidery or embellishment on the chest, shoulders, or blouse</li>
              <li>Horizontal stripes or bold patterns on the upper body</li>
              <li>Boxy, oversized tops — they add width without adding balance</li>
              <li>Straight-cut kurtas past the hip without any flare</li>
              <li>Cigarette pants and slim-leg trousers with fitted tops</li>
              <li>Strapless styles without structure — can emphasise shoulder width</li>
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
              <li>→ <Link href="/body-type-styling/apple-body-shape-india" className="underline hover:opacity-70">Apple Body Shape Styling — India</Link></li>
              <li>→ <Link href="/body-type-styling/pear-body-shape-india" className="underline hover:opacity-70">Pear Body Shape Styling — India</Link></li>
              <li>→ <Link href="/body-type-styling/hourglass" className="underline hover:opacity-70">Hourglass Body Type Styling</Link></li>
              <li>→ <Link href="/style-guides/saree-draping-body-type" className="underline hover:opacity-70">Saree Draping by Body Type</Link></li>
              <li>→ <Link href="/style-guides/salwar-kameez-body-type" className="underline hover:opacity-70">Salwar Kameez by Body Type</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get a style plan built for your body type</h2>
            <p className="text-gray-600 mb-6">Geometric Silhouette Profiling™ identifies your body type and builds 20 outfit formulas — western and ethnic — specifically designed to flatter your proportions. Part of your Iconik Style Blueprint.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Inverted Triangle Body Type: Styling Guide for Indian Women.&quot; Iconik, 2025. https://www.iconik.pro/body-type-styling/inverted-triangle</p>
          </div>

        </div>
      </main>
    </>
  );
}
