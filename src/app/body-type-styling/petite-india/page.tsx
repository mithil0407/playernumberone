import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Petite Body Type Styling for Indian Women — Iconik",
  description: "Styling guide for petite Indian women — how to elongate proportions, look taller, and dress a petite frame in both western wear and Indian ethnic wear including sarees and kurtas.",
  keywords: "petite body type India, petite styling Indian women, how to look taller Indian women, petite frame styling India, petite saree style India, petite kurta style India, fashion for short women India",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/petite-india" },
  openGraph: {
    title: "Petite Body Type Styling for Indian Women — Iconik",
    description: "How to elongate proportions and dress a petite frame in western and Indian ethnic wear — including sarees, kurtas, and lehengas.",
    url: "https://www.iconik.pro/body-type-styling/petite-india",
    images: [{ url: "/og-image.webp", width: 1200, height: 630, alt: "Petite body type styling for Indian women — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Petite Body Type Styling for Indian Women — Iconik",
    description: "How to elongate proportions and dress a petite frame in western and Indian ethnic wear — including sarees, kurtas, and lehengas.",
    images: ["/og-image.webp"],
  },
};

const faqs = [
  {
    q: "What is considered petite in India?",
    a: "Petite refers to a height of approximately 5'3\" (160cm) or below, with proportions that are scaled smaller overall — not just short legs or a short torso independently. In Indian fashion, petite is particularly relevant because much standard ethnic wear (kurta lengths, lehenga proportions, saree border placements) is designed for average height and can overwhelm a petite frame. The styling principles for petite focus on elongation and avoiding visual breaks in the silhouette.",
  },
  {
    q: "Can petite women wear sarees?",
    a: "Yes — sarees can be very flattering for petite women when draping and fabric choice are optimised. Key points: choose fabrics with minimal texture and body (chiffon, georgette, lightweight silk) that drape closely rather than adding bulk. Opt for sarees with narrow, subtle borders rather than wide, heavily embellished borders that cut the vertical line. Pin the pallu close to the body to avoid it adding horizontal visual weight. A saree in a single colour or tone-on-tone pattern reads as one continuous vertical line — more elongating than a high-contrast border.",
  },
  {
    q: "What kurta length is best for petite women?",
    a: "Hip-length kurtas (ending at or just above the hip) are the most flattering for petite women — they avoid cutting the silhouette at the mid-thigh or knee, which is where longer kurtas often land on a petite frame and visually shorten the leg. Tunic-length is acceptable when paired with churidar or fitted bottoms that show the full leg length. Avoid ankle-length kurtas or very long Anarkalis unless you have a significant heel, as they tend to overwhelm a petite frame.",
  },
  {
    q: "What should petite women avoid wearing?",
    a: "Avoid styles that interrupt the vertical line of your silhouette: wide, heavily embellished borders on sarees; horizontal stripes across the body; very wide-leg palazzo pants that shorten the leg visually; oversized or boxy tops that add volume at the widest point of the body; and cropped tops with mid-rise bottoms (which create a visual break at the waist rather than a continuous line). Also avoid very large prints, which can overpower a petite frame.",
  },
  {
    q: "Do high heels help petite styling?",
    a: "Heels add height but are not a styling requirement. The elongating effect of the styling choices described in this guide — monochromatic looks, vertical lines, fitted silhouettes, consistent colour from top to bottom — works regardless of footwear. If you do wear heels, nude or skin-tone heels continue the leg line visually, which is more elongating than a shoe in a contrasting colour.",
  },
];

export default function PetiteIndiaPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/body-type-styling/petite-india#article",
        "headline": "Petite Body Type Styling for Indian Women",
        "description": "Complete styling guide for petite Indian women — western wear, sarees, kurtas, and lehengas — with specific elongation and proportion guidance.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2025-04-01",
        "dateModified": new Date().toISOString().split("T")[0],
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/petite-india" },
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
          { "@type": "ListItem", "position": 3, "name": "Petite — India", "item": "https://www.iconik.pro/body-type-styling/petite-india" },
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
              <li className="text-gray-800 font-medium">Petite — India</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Petite Body Type Styling for Indian Women
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Petite styling has one core goal: elongate the silhouette. Create continuous vertical lines, avoid visual breaks that interrupt the body&apos;s length, and choose proportions that don&apos;t overwhelm a smaller frame. This applies to western wear — and to Indian ethnic wear, where standard kurta lengths, saree border widths, and lehenga proportions are all designed for an average height that most petite women are not.
            </p>
          </header>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">The Core Elongation Principles</h2>
            <ul className="space-y-3 text-gray-600 list-disc list-inside">
              <li><strong>Monochromatic dressing:</strong> wearing one colour or tonal shades from top to bottom creates an unbroken vertical line — the single most effective elongating technique</li>
              <li><strong>Vertical lines and patterns:</strong> vertical stripes, pintucks, and seam lines that run up-down elongate; horizontal lines shorten</li>
              <li><strong>Fitted over boxy:</strong> clothes that skim the body show its actual length; boxy or oversized styles add volume that visually shortens</li>
              <li><strong>Avoid mid-body breaks:</strong> colour blocking, wide contrast waistbands, and wide embellished borders at the hip all cut the vertical line at the body&apos;s middle</li>
              <li><strong>Higher hemlines or fitted full-length:</strong> mid-calf hemlines (the most shortening length) should be avoided; hip-length tops or full floor-length are better choices</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Best Western Wear for Petite Frames</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "High-waisted trousers and jeans", desc: "Raise the visual waist point and show maximum leg length — one of the most effective petite styling techniques" },
                { name: "Straight-leg and bootcut trousers", desc: "A slight flare from the knee maintains a vertical line; avoid wide-leg palazzo which shortens the leg" },
                { name: "Monochromatic sets", desc: "Top and bottom in the same colour — the unbroken line is more elongating than anything else in a petite wardrobe" },
                { name: "V-neck and deep scoop neck tops", desc: "Draw the eye upward and downward simultaneously — creating visual length through the neckline" },
                { name: "Mini and midi skirts", desc: "Mini shows maximum leg; fitted midi to the mid-calf is the most flattering long-skirt option for petite" },
                { name: "Fitted blazers (not cropped)", desc: "A blazer that ends at the hip creates a clean line; a cropped blazer can cut the torso too short" },
              ].map((item) => (
                <div key={item.name} className="border border-gray-200 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 mb-1">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Indian Ethnic Wear for Petite Women</h2>
            <div className="space-y-5">
              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Sarees</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Choose lightweight, drapey fabrics — chiffon, georgette, and thin soft silk — that hug rather than stand away from the body. Single-colour or tone-on-tone sarees are most elongating. Narrow or subtle borders work better than wide, heavily embellished borders which create a horizontal break. Pin the pallu neatly close to the body; a voluminous, loosely draped pallu adds bulk. A slightly shorter saree drape (showing a little more of the petticoat) can help show the foot and shoe, extending the visual leg line.</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Kurtas and Suits</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Hip-length kurtas are the most flattering length for petite women — they end at or just above the hip without cutting the silhouette at the thigh. Pair with churidar (fitted, slightly gathered at the ankle) rather than straight salwar, which can appear too wide. Vertical pintucks or front plackets on the kurta add elongating lines. Avoid Anarkali-length or floor-length kurtas unless you have a significant heel — they tend to overwhelm a petite frame and hide the leg entirely.</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Lehengas</h3>
                <p className="text-gray-600 text-sm leading-relaxed">A lehenga is inherently a silhouette that adds vertical length (floor-length skirt), which can work very well for petite women. Key: choose a fitted choli that ends at the natural waist (not below), and a lehenga skirt that is not excessively full or heavily tiered. A moderately full skirt in a lighter fabric hangs and flows rather than adding bulk. High-waist lehenga skirts worn with a fitted blouse are one of the most flattering wedding silhouettes for petite women.</p>
              </div>

              <div className="border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-2">Kurtis and Co-ords</h3>
                <p className="text-gray-600 text-sm leading-relaxed">Short kurtis (ending at the hip) worn with fitted pants or jeans work well. Avoid tunic-length kurtis (mid-thigh) worn over palazzo or wide-leg pants — both the top and bottom are wide at their extremes, which visually multiplies the width without adding length. A short kurti over straight or slim pants in the same or tonal colour is a clean, elongating everyday combination.</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What to Avoid</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Wide, heavily embellished saree borders — cut the vertical line at the hem</li>
              <li>Very wide palazzo or flared pants with tunic-length tops</li>
              <li>Mid-calf skirts and dresses — the most shortening hemline length</li>
              <li>Cropped tops with mid-rise bottoms — creates a break at the waist without adding length</li>
              <li>Oversized or boxy silhouettes — add volume that makes the frame appear shorter</li>
              <li>Very large, bold prints that overpower a smaller frame</li>
              <li>Wide horizontal colour blocks — cut the body into shorter sections</li>
              <li>Heavily tiered or very voluminous lehenga skirts — add horizontal width without vertical length</li>
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
              <li>→ <Link href="/body-type-styling/how-to-look-taller-clothing" className="underline hover:opacity-70">How to Look Taller with Clothing</Link></li>
              <li>→ <Link href="/style-guides/saree-draping-body-type" className="underline hover:opacity-70">Saree Draping by Body Type</Link></li>
              <li>→ <Link href="/style-guides/kurti-length-guide" className="underline hover:opacity-70">Kurti Length Guide</Link></li>
              <li>→ <Link href="/style-guides/salwar-kameez-body-type" className="underline hover:opacity-70">Salwar Kameez by Body Type</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get outfit recommendations built for your proportions</h2>
            <p className="text-gray-600 mb-6">Geometric Silhouette Profiling™ accounts for petite proportions in every recommendation — 16+ outfit formulas in both western and ethnic wear, built specifically for how your body is shaped. Part of your Iconik Style Blueprint.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,499
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;Petite Body Type Styling for Indian Women.&quot; Iconik, 2025. https://www.iconik.pro/body-type-styling/petite-india</p>
          </div>

        </div>
      </main>
    </>
  );
}
