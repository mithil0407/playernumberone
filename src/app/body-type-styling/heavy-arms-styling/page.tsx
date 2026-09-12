import type { Metadata } from "next";
import Link from "next/link";
import { SeoTeachingVisual } from "@/components/seo/SeoEditorial";

export const metadata: Metadata = {
  title: "What to Wear to Hide Heavy Arms: Indian Women's Complete Guide — Iconik",
  description: "Science-backed guide to arm-flattering clothing for Indian women. Sleeve styles, sleeve lengths, fabric choices, and how to dress heavy arms in kurtas, sarees, and western wear.",
  keywords: "how to dress heavy arms India, clothes for heavy arms Indian women, sleeve styles heavy arms India, what to wear with heavy arms Indian women, flabby arms styling India",
  alternates: { canonical: "https://www.iconik.pro/body-type-styling/heavy-arms-styling" },
  openGraph: {
    title: "What to Wear to Hide Heavy Arms: Indian Women's Complete Guide — Iconik",
    description: "Sleeve cuts, fabrics, and Indian garment formulas for arm-flattering dressing.",
    url: "https://www.iconik.pro/body-type-styling/heavy-arms-styling",
    type: "article",
    siteName: "Iconik",
    locale: "en_IN",
    publishedTime: "2025-01-01",
    modifiedTime: "2026-07-24",
    images: [{ url: "/images/seo/heavy-arms-sleeve-balance-iconik-og.webp", width: 1200, height: 630, alt: "Sleeve-shape comparison for fuller arms on the same Indian woman — Iconik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "What to Wear to Hide Heavy Arms: Indian Women's Complete Guide — Iconik",
    description: "Sleeve cuts, fabrics, and Indian garment formulas for arm-flattering dressing.",
    images: ["/images/seo/heavy-arms-sleeve-balance-iconik-og.webp"],
  },
};

const faqs = [
  {
    q: "Should I avoid sleeveless completely?",
    a: "Not necessarily. A sleeveless garment with a wide, structured armhole — like a structured tank — can work. The problem is a tight, narrow armhole that cuts across the upper arm and creates a compression line. Wide armholes with clean edges are more flattering than tight ones.",
  },
  {
    q: "Do vertical prints help with arms?",
    a: "On the sleeve itself, yes — a vertical stripe or elongated print creates visual length in the arm. Horizontal prints on sleeves add width. A plain sleeve in a slightly darker shade than the body of the garment can also create a slimming effect.",
  },
  {
    q: "What is the best blouse sleeve for a saree if I have heavy arms?",
    a: "A 3/4 sleeve in crepe or dupion silk. The cut should be straight from shoulder to elbow with a slight ease — not fitted. The blouse back should be full — no deep U-backs or low-cut backs that expose the upper arm from behind.",
  },
  {
    q: "Can the Iconik Blueprint include arm-specific recommendations?",
    a: "Yes. Geometric Silhouette Profiling™ accounts for limb proportion, and your Blueprint includes neckline and sleeve recommendations specific to your arm profile — covering both Indian ethnic wear and western wear categories.",
  },
];

export default function HeavyArmsStylingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": "What to Wear to Hide Heavy Arms: Indian Women's Complete Guide",
        "description": "Science-backed arm styling guide for Indian women using Geometric Silhouette Profiling™.",
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik", "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/og-image.webp" } },
        "image": "https://www.iconik.pro/images/seo/heavy-arms-sleeve-balance-iconik.webp",
        "datePublished": "2025-01-01",
        "dateModified": "2026-07-24",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/body-type-styling/heavy-arms-styling" },
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
          { "@type": "ListItem", "position": 3, "name": "Heavy Arms Styling", "item": "https://www.iconik.pro/body-type-styling/heavy-arms-styling" },
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
              <li className="text-gray-800 font-medium">Heavy Arms Styling</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              What to Wear to Hide Heavy Arms: Indian Women&apos;s Complete Guide
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Arm styling is one of the most common fit concerns among Indian women — and one of the most misunderstood. The goal is not to hide your arms. It is to create proportional balance through sleeve cut, fabric choice, and visual line — so your arms look sculpted rather than constrained.
            </p>
          </header>

          <SeoTeachingVisual
            src="/images/seo/heavy-arms-sleeve-balance-iconik.webp"
            alt="Same Indian woman showing a tight cap sleeve ending at the widest upper arm versus an eased elbow-length sleeve."
            caption="The arm stays the same. Sleeve ease, endpoint and neckline direction determine whether the garment grips or creates balance."
            width={1024}
            height={1536}
            priority
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Do Arms Look Heavy? The Geometry</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Arms look disproportionately large for two opposite reasons: fabric that is too tight outlines the muscle and soft tissue directly, while fabric that is too loose and unstructured flaps and adds visual bulk. Neither extreme works.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The sweet spot is a structured fit that grazes the arm without gripping it. The sleeve should follow the arm&apos;s natural line without compression and without excess volume. This principle applies to both Indian ethnic and western garments.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Which Sleeve Lengths Work Best for Heavy Arms?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>3/4 sleeves</strong> are universally the most flattering for heavy arms. They end at the narrowest part of the forearm — below the elbow — which is almost always the slimmest part of the arm. The eye sees this narrow endpoint and perceives the entire arm as narrower.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Full-length sleeves</strong> in structured fabric also work well — they cover the arm entirely, and in a well-cut sleeve, create a clean column silhouette.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Cap sleeves — they end at the widest part of the upper arm and create a visible horizontal line exactly where you don&apos;t want one. Sleeveless garments with tight, narrow armholes create a compression bulge at the top of the arm. Flutter sleeves add volume rather than creating a clean line.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Which Sleeve Cuts Work Best for Heavy Arms?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Bishop sleeves</strong> — fitted at the upper arm, relaxed and slightly voluminous from elbow to wrist — draw the eye downward to the narrowest part of the arm. The contrast between the fitted upper and the looser lower creates an elongating effect.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Raglan sleeves</strong> eliminate the shoulder seam entirely, creating a cleaner, less interrupted line from neck to arm. This reduces the visual emphasis on the upper arm width.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>What to avoid:</strong> Flutter sleeves (add volume at the widest part). Off-shoulder and cold shoulder cuts (expose the upper arm at its widest point). Puffed sleeves (add volume at the shoulder and upper arm together).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Indian Ethnic Wear Works Best for Heavy Arms?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Kurtas</strong> with 3/4 sleeves in georgette or crepe are ideal. The fabric holds structure without clinging. A straight sleeve cut from shoulder to elbow, then slightly eased at the wrist, creates the best line.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Anarkali suits</strong> with bishop sleeves are one of the most flattering options — the wide skirt balances the upper body, and the bishop sleeve creates elongation in the arm.
            </p>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Saree blouses:</strong> A 3/4 sleeve blouse in crepe or dupion silk is the strongest choice. Avoid net sleeves that are sheer without an opaque lining underneath — they add volume without coverage.
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>3/4 sleeve kurtas in georgette or crepe</li>
              <li>Anarkali suits with bishop or straight 3/4 sleeves</li>
              <li>Saree blouses with 3/4 sleeves in structured fabric</li>
              <li>Long-sleeve churidars (full coverage, clean line)</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Which Fabrics Work Best for the Arm Zone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              <strong>Structured fabrics that drape without clinging:</strong> Crepe, georgette, chiffon over an opaque lining, cotton-linen blends, dupion silk. These hold their shape away from the arm without adding volume through stiffness.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Jersey (clings). Velvet (adds visual texture and bulk to the upper arm). Ribbed fabrics (cling). Sheer fabrics without an opaque underlayer (add no coverage while exposing the arm).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Does Shoulder Width Affect How Arms Look?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Yes, significantly. Broadening the shoulder visually makes arms look proportionally smaller by comparison. A boat neck or a slightly structured shoulder seam creates a wider shoulder line, which makes the arm below appear in better proportion.
            </p>
            <p className="text-gray-600 leading-relaxed">
              An overly narrow shoulder line makes arms look larger by contrast. This is why certain sleeveless garments are particularly unflattering — a narrow shoulder strap with a wide exposed upper arm maximises the visual disproportion.
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
              <li>→ <Link href="/body-type-styling/how-to-dress-tummy" className="underline hover:opacity-70">How to Dress if You Have a Tummy</Link></li>
              <li>→ <Link href="/body-type-styling/apple-body-shape-india" className="underline hover:opacity-70">Apple Body Shape: Complete Indian Guide</Link></li>
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want this done for you within 5 working days after the consultation?</h2>
            <p className="text-gray-600 mb-6">Your personalised Iconik Style Blueprint includes arm and sleeve recommendations specific to your silhouette profile — plus 20 complete outfit formulas.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹2,699
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Iconik Styling Team. &quot;What to Wear to Hide Heavy Arms: Indian Women&apos;s Complete Guide.&quot; Iconik LLP, 2025. https://www.iconik.pro/body-type-styling/heavy-arms-styling</p>
          </div>

        </div>
      </main>
    </>
  );
}
