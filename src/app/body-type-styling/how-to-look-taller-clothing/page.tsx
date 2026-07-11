import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArticleGrowthTracker,
  TrackedArticleCtaView,
  TrackedArticleLink,
} from "@/components/ArticleGrowthTracker";
import { buildMetadata } from "@/lib/seo";
import {
  articleNode,
  breadcrumbList,
  faqPageNode,
  founderPerson,
  graph,
  organizationNode,
} from "@/lib/structuredData";

const path = "/body-type-styling/how-to-look-taller-clothing";
const growthTracking = {
  article_id: "how_to_look_taller_clothing",
  content_cluster: "silhouette_proportions",
  audience: "women" as const,
  hook_type: "oversized_vs_intentional",
  visual_id: "oversized_intentional_silhouette",
  visual_variant: "article_4x5",
  content_source: "seo_look_taller_article",
};
const proportionQuizHref =
  "/tools/proportion-code?source=seo_look_taller_article&article_id=how_to_look_taller_clothing&content_cluster=silhouette_proportions&audience=women&hook_type=oversized_vs_intentional&visual_id=oversized_intentional_silhouette&visual_variant=article_4x5";

export const metadata: Metadata = buildMetadata({
  title: "How to Look Taller in Clothes: 12 Proportion Rules for Indian Women",
  description:
    "Use rise, garment length, colour continuity, shoulder fit, and vertical fall to look taller—without changing your body or relying on heels.",
  path,
  type: "article",
  keywords: [
    "how to look taller in clothes",
    "how to dress to look taller",
    "petite fashion India",
    "clothes that make you look taller",
    "oversized clothes petite women",
  ],
  image: {
    path: "/seo/oversized-vs-intentional-silhouette-og.webp",
    width: 1200,
    height: 630,
    alt: "Oversized versus intentional silhouette on the same short, curvy Indian woman",
  },
});

const faqs = [
  {
    q: "Does wearing vertical stripes actually work?",
    a: "Vertical stripes can reinforce length, but they are not a guarantee. Placement, stripe width, garment fit, and whether the line continues through the outfit matter more than the stripe alone. A clean open layer or trouser crease can create the same directional effect.",
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
    a: "The best kurta length depends on where it ends relative to your legs. A clean knee-length or longer straight kurta can work when it remains tonal with the bottom, but a hem that lands at the widest part of the calf may shorten the line. Test the full outfit rather than choosing length in isolation.",
  },
];

export default function HowToLookTallerPage() {
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    articleNode({
      title: "How to Look Taller in Clothes: 12 Proportion Rules for Indian Women",
      description:
        "A practical guide to using rise, fit, colour continuity, garment length, and vertical fall to create a taller visual line.",
      path,
      datePublished: "2026-03-21",
      dateModified: "2026-07-11",
      images: [
        "/seo/oversized-vs-intentional-silhouette.webp",
        "/seo/oversized-vs-intentional-silhouette-og.webp",
      ],
    }),
    faqPageNode(faqs),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Body Type Styling", path: "/body-type-styling" },
      { name: "How to Look Taller in Clothes", path },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleGrowthTracker {...growthTracking} />
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
              How to Look Taller in Clothes: 12 Proportion Rules for Indian Women
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Looking taller in clothes is not about hiding your body. It is about controlling where garments divide it. A cleaner shoulder, intentional waist, continuous colour, higher visual rise, and uninterrupted trouser or kurta fall help the eye travel vertically instead of stopping at multiple horizontal breaks.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full border border-gray-200 px-3 py-1">Published 21 March 2026</span>
              <span className="rounded-full border border-gray-200 px-3 py-1">Updated 11 July 2026</span>
              <Link href="/about" className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50">
                Reviewed by Mithil Navalakha, Iconik founder
              </Link>
            </div>
          </header>

          <aside className="mb-12 overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#a7b6bc_0%,#748891_100%)] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.18)]">
            <div className="rounded-[1.8rem] border border-white/45 bg-white/10 p-6 text-white backdrop-blur-xl md:p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/65">The short answer</p>
              <p className="font-serif text-2xl leading-relaxed text-[#fffaf1] md:text-3xl">
                Fit the shoulder, define the intended waist, reduce unnecessary colour breaks, and let the lower half fall in one clean line.
              </p>
              <p className="mt-4 leading-relaxed text-white/75">
                You do not need to wear tight clothes or heels. The strongest improvements often come from removing pooled fabric, dropped seams, low visual waists, and contrasting blocks that divide a shorter frame.
              </p>
            </div>
          </aside>

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
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">Iconik visual diagnosis</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Oversized vs Intentional: Why Fit Direction Matters More Than Size</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Oversized clothing does not automatically make someone look shorter. The problem begins when every construction point becomes ambiguous: the shoulder seam drops, the sleeve pools, the top ends at the widest point, the waist disappears, and the trouser stacks over the shoe. The eye reads width because it cannot find a clear direction.
            </p>
            <p className="text-gray-600 mb-5 leading-relaxed">
              An intentional relaxed outfit can remain comfortable and generous. It simply restores structure in a few places: a clean shoulder, a visible or implied waist, an open neckline, and a trouser or skirt that falls to the floor without excess pooling.
            </p>
            <figure className="mb-8">
              <div className="overflow-hidden rounded-[2rem] bg-[#8fa2aa] shadow-[0_24px_70px_rgba(38,52,58,0.22)]">
                <Image
                  src="/seo/oversized-vs-intentional-silhouette.webp"
                  alt="The same short, curvy Indian woman in an oversized shirt and pooled trousers compared with an intentional fitted-shoulder shirt, defined waist, and full-length vertical trouser fall"
                  width={941}
                  height={1672}
                  sizes="(max-width: 768px) 100vw, 720px"
                  className="h-auto w-full"
                />
              </div>
              <figcaption className="mt-3 text-xs leading-relaxed text-gray-500">
                AI-generated styling reconstruction informed by anonymized patterns observed across Iconik consultations. No real client or celebrity is depicted.
              </figcaption>
            </figure>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <h3 className="mb-3 font-serif text-2xl text-gray-900">Oversized without direction</h3>
                <ul className="space-y-2 text-sm leading-relaxed text-gray-600">
                  <li>• Dropped seam broadens the shoulder line.</li>
                  <li>• Long sleeve and hem hide the body&apos;s division points.</li>
                  <li>• Fabric pooling shortens the visible leg line.</li>
                  <li>• Equal volume above and below creates no hierarchy.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-[#879aa2] bg-[#81949c] p-6 text-white shadow-[0_14px_40px_rgba(38,52,58,0.14)]">
                <h3 className="mb-3 font-serif text-2xl text-[#fffaf1]">Relaxed but intentional</h3>
                <ul className="space-y-2 text-sm leading-relaxed text-white/75">
                  <li>• Shoulder seam aligns or is deliberately structured.</li>
                  <li>• Tuck, seam, or tonal contrast locates the waist.</li>
                  <li>• Full-length hem creates vertical fall.</li>
                  <li>• One dominant silhouette controls the visual line.</li>
                </ul>
              </div>
            </div>
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
              <strong>Floor-length Anarkali suits in one colour family</strong> can create a strong vertical impression when the shoulder fits cleanly, the flare begins at a useful point, and the hem does not overwhelm the wearer. The length alone is not enough; scale and construction still matter.
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
              <strong>Skin-adjacent or tonal footwear</strong> can reduce the visual break at the ankle. The useful colour depends on whether the shoe is seen against bare skin, a trouser, a salwar, or a saree hem; matching the adjacent area is more reliable than choosing one universal nude.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Should You Avoid When You Want to Look Taller?</h2>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Colour blocking with a strong horizontal contrast line at the waist</li>
              <li>Cropped tops that end low while the bottom also has a low rise; a shorter top with a true high rise can lengthen the visible leg line</li>
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

          <section className="mb-12 overflow-hidden rounded-[2rem] bg-[#27353b] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.16)]">
            <TrackedArticleCtaView tracking={growthTracking} />
            <div className="rounded-[1.8rem] border border-white/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-7 text-white backdrop-blur-xl md:p-9">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#f0cb80]">Free proportion test</p>
              <h2 className="mb-3 font-serif text-3xl text-[#fffaf1]">Find where your height actually sits</h2>
              <p className="mb-6 max-w-2xl leading-relaxed text-white/70">
                The Proportion Code uses your height, waist-to-floor measurement, and inseam to show whether your visual length sits in your torso, legs, or a balanced split—then explains rise, tuck, and crop placement.
              </p>
              <TrackedArticleLink
                href={proportionQuizHref}
                tracking={growthTracking}
                className="inline-flex rounded-full bg-[#f0cb80] px-7 py-3 font-semibold text-[#27353b] transition hover:bg-[#f6d99e]"
              >
                Take the Free Proportion Code →
              </TrackedArticleLink>
            </div>
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
            <p>Navalakha, Mithil. &quot;How to Look Taller in Clothes: 12 Proportion Rules for Indian Women.&quot; Iconik, updated 11 July 2026. https://www.iconik.pro/body-type-styling/how-to-look-taller-clothing</p>
          </div>

        </div>
      </main>
    </>
  );
}
