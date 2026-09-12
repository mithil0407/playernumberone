import type { Metadata } from "next";
import Link from "next/link";
import {
  ArticleGrowthTracker,
  TrackedArticleCtaView,
  TrackedArticleLink,
} from "@/components/ArticleGrowthTracker";
import { buildMetadata } from "@/lib/seo";
import { FOUNDERS } from "@/lib/siteFacts";
import {
  SeoEditorialFooter,
  SeoEditorialHeader,
  SeoTeachingVisual,
} from "@/components/seo/SeoEditorial";
import InstagramReelsForArticle from "@/components/seo/InstagramReelsForArticle";

const path = "/colour-analysis/best-colours-wheatish-skin-india";
const growthTracking = {
  article_id: "best_colours_wheatish_skin_india",
  content_cluster: "colour_intelligence",
  audience: "women" as const,
  hook_type: "wheatish_meaning_undertone",
  content_source: "seo_wheatish_skin_article",
};
const glowTestHref =
  "/tools/glow-test?source=seo_wheatish_skin_article&article_id=best_colours_wheatish_skin_india&content_cluster=colour_intelligence&audience=women&hook_type=wheatish_meaning_undertone";

export const metadata: Metadata = buildMetadata({
  title: "Wheatish Skin Tone: Meaning, Undertones and Best Colours",
  description:
    "What does wheatish skin tone mean? Find clothing colours for warm, cool, neutral and olive wheatish Indian skin, including pastels, whites and jewellery.",
  path,
  type: "article",
  keywords: [
    "wheatish skin tone meaning",
    "best colours for wheatish skin India",
    "wheatish skin colour palette",
    "clothing colours for wheatish skin",
  ],
});

const faqs = [
  {
    q: "What colours suit wheatish skin Indian women?",
    a: "Use wheatish only as a broad depth description. Warm-leaning wheatish skin often harmonises with terracotta, olive, coral, cocoa and warm ivory; cool-leaning wheatish skin often suits navy, emerald, berry, cobalt, charcoal and crisp white. Neutral or olive results may depend more on colour clarity and contrast. Treat every list as a starting point for controlled draping.",
  },
  {
    q: "Is wheatish skin warm or cool undertone?",
    a: "Wheatish skin can be warm, cool, neutral or olive. The surface description does not diagnose undertone. Instead of relying on vein colour or one jewellery test, compare warm ivory with crisp white and terracotta with cobalt under the same indirect daylight, then repeat the winning comparisons.",
  },
  {
    q: "Why does 'wear bold colours for wheatish skin' advice often feel wrong?",
    a: "Because boldness combines several variables: temperature, clarity, depth and contrast. A bright colour can have the right temperature but still overpower the face, or the wrong temperature but work when moved away from the neckline. Test the exact fabric and its placement instead of following a brightness rule.",
  },
  {
    q: "What jewellery metal works for wheatish skin?",
    a: "Compare metals of similar size and shine with the neckline colours you wear most. Warm metals may integrate better with a warm-leaning palette and cool metals with a cool-leaning palette, but finish, scale, stones and surrounding fabric can change the result. Skin depth alone cannot choose a metal.",
  },
  {
    q: "Can wheatish skin wear pastels?",
    a: "Yes. Compare pastel temperature and clarity: peach or warm blush may support a warm-leaning palette, while lilac, dusty rose or powder blue may support a cool-leaning palette. If the colour looks chalky, try a clearer version or add a deeper neckline, dupatta, jacket or bag.",
  },
];

export default function BestColoursWheatishSkinPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": "https://www.iconik.pro/colour-analysis/best-colours-wheatish-skin-india#article",
        "headline": "Best Colours for Wheatish Skin Indian Women",
        "description": "Colour science for wheatish skin Indian women — why undertone determines your palette and how Chromatic Harmony Mapping™ works for medium Indian skin tones.",
        "author": { "@type": "Person", "name": FOUNDERS[0].name, "jobTitle": FOUNDERS[0].title, "sameAs": FOUNDERS[0].linkedIn },
        "publisher": {
          "@type": "Organization",
          "name": "Iconik",
          "logo": { "@type": "ImageObject", "url": "https://www.iconik.pro/logopayment.webp" },
        },
        "datePublished": "2026-03-21",
        "dateModified": "2026-07-23",
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://www.iconik.pro/colour-analysis/best-colours-wheatish-skin-india" },
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
          { "@type": "ListItem", "position": 2, "name": "Colour Analysis", "item": "https://www.iconik.pro/colour-analysis" },
          { "@type": "ListItem", "position": 3, "name": "Best Colours for Wheatish Skin", "item": "https://www.iconik.pro/colour-analysis/best-colours-wheatish-skin-india" },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleGrowthTracker {...growthTracking} />
      <div className="seo-editorial min-h-screen">
        <SeoEditorialHeader />
        <main>
          <div className="seo-editorial-shell">
            <div className="seo-classic-article mx-auto max-w-3xl py-16 md:py-24">

          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
            <ol className="flex items-center gap-2 flex-wrap">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link href="/colour-analysis" className="hover:underline">Colour Analysis</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Best Colours for Wheatish Skin</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Wheatish Skin Tone: Meaning, Undertones and Best Colours
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              &quot;Wheatish&quot; describes a surface skin depth — medium, between fair and dusky. It says nothing about your undertone. And it is undertone — warm, cool, or neutral — that determines which colours create harmony with your complexion. Two women with identical wheatish skin can need completely different colour palettes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full border border-gray-200 px-3 py-1">Published 21 March 2026</span>
              <span className="rounded-full border border-gray-200 px-3 py-1">Updated 23 July 2026</span>
              <Link href="/about" className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50">Reviewed by {FOUNDERS[0].name}, {FOUNDERS[0].title}</Link>
            </div>
          </header>

          <aside className="mb-12 overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#9aabb2_0%,#71858e_100%)] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.18)]">
            <div className="rounded-[1.8rem] border border-white/45 bg-white/10 p-6 text-white backdrop-blur-xl md:p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/65">The short answer</p>
              <p className="font-serif text-2xl leading-relaxed text-[#fffaf1]">
                Wheatish describes a medium beige-to-brown surface depth, often with a golden or olive cast. It is not an undertone diagnosis.
              </p>
              <p className="mt-4 leading-relaxed text-white/75">
                Warm wheatish skin often harmonises with terracotta, olive, coral, and cream; cool wheatish skin often suits navy, berry, emerald, and crisp white. Neutral or olive skin benefits from controlled fabric comparisons rather than a rigid label.
              </p>
            </div>
          </aside>

          <SeoTeachingVisual
            src="/images/seo/wheatish-skin-colour-guide-hero-iconik.webp"
            alt="Wheatish Indian skin beside terracotta, navy, olive, berry, ivory and white fabric swatches."
            caption="Wheatish describes a broad skin depth, not one undertone or one colour palette."
            width={1672}
            height={941}
            priority
          />

          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">What Does Wheatish Skin Tone Mean in India?</h2>
            <p className="mb-4 leading-relaxed text-gray-600">
              In Indian usage, wheatish usually describes a medium beige-to-brown complexion between common descriptions of fair and dusky. The term is subjective and shaped by culture; it is not a scientific skin classification and should not be used to rank complexion.
            </p>
            <p className="leading-relaxed text-gray-600">
              For clothing decisions, treat wheatish as a broad depth description. Test three separate qualities: <strong>temperature</strong> (warm or cool), <strong>clarity</strong> (soft or vivid), and <strong>contrast</strong> (light-to-deep difference across the outfit).
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Is Colour Advice for Wheatish Skin So Generic?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Generic advice treats &quot;wheatish&quot; as a complete colouring category. It is not. Two people with a similar visible depth can need different temperatures, different levels of brightness and different amounts of contrast.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Advice such as &quot;wear bright colours&quot;, &quot;avoid pastels&quot;, or &quot;terracotta suits everyone&quot; ignores the exact fabric and where it sits. A colour that is difficult at the neckline can still work in trousers, a bag, a border or footwear. The goal is not to ban colours; it is to control their temperature, clarity and placement.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Identify Your Undertone Within Wheatish Skin</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Wheatish skin can carry a warm, cool, neutral or olive undertone. Vein colour, a white-paper test and one jewellery comparison can produce conflicting results, so use them only as clues. A controlled fabric test is more directly connected to clothing.
            </p>
            <ol className="space-y-3 text-gray-600 list-decimal pl-6 mb-4">
              <li>Use indirect daylight and turn off coloured indoor lighting.</li>
              <li>Keep your face, camera and exposure fixed; remove dominant makeup and large jewellery.</li>
              <li>Compare warm ivory with crisp white, then terracotta with cobalt.</li>
              <li>Watch the face: eye clarity, lip definition, under-eye shadow and unwanted yellow, grey or red cast.</li>
              <li>Repeat the strongest comparison on another day before deciding.</li>
            </ol>
            <p className="text-gray-600 leading-relaxed">
              For a full step-by-step walkthrough, see the <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">complete at-home undertone test guide</Link>.
            </p>
          </section>

          <SeoTeachingVisual
            src="/images/seo/wheatish-skin-drape-test-iconik.webp"
            alt="Wheatish Indian woman conducting a controlled drape test with warm ivory, white, terracotta and cobalt."
            caption="Change one fabric at a time and keep the light, camera and face constant so the comparison is meaningful."
            width={1003}
            height={1568}
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Colours for Wheatish Skin with Warm Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              If repeated drape comparisons show a warm-leaning pattern, begin with earthy reds, warm greens and golden neutrals. Then decide whether you need a clear version or a softer, more muted one:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Terracotta, rust, and burnt orange</li>
              <li>Mustard yellow and golden yellow</li>
              <li>Olive green and warm khaki</li>
              <li>Camel, warm beige, and warm cream</li>
              <li>Warm reds — brick red, tomato red, fire red</li>
              <li>Coral and warm peach</li>
              <li>Earthy browns — cognac, chocolate, warm tan</li>
              <li>Ivory (more flattering than stark white)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>If a cool colour feels difficult:</strong> move it away from the face or separate it with warm ivory, olive, coral or cocoa. Do not discard an entire family based on one fabric.
            </p>
          </section>

          <SeoTeachingVisual
            src="/images/seo/warm-wheatish-skin-palette-iconik.webp"
            alt="Warm wheatish Indian skin palette with terracotta, olive, coral, camel, cocoa and warm ivory."
            caption="A warm wheatish outfit becomes easier to build with one lead colour, one cocoa anchor and one warm light."
            width={1003}
            height={1568}
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Colours for Wheatish Skin with Cool Undertone</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              If cool comparisons repeatedly sharpen the face, use blue-based colours, berries and cool neutrals as the starting rail. Reduce brightness if the clearest version dominates you:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Navy and midnight blue</li>
              <li>Emerald green and jewel green</li>
              <li>Royal purple and amethyst</li>
              <li>Fuchsia and hot pink</li>
              <li>Burgundy and deep wine</li>
              <li>Cobalt blue and sapphire</li>
              <li>Rose pink and dusty rose</li>
              <li>Stark white (creates clean, fresh contrast)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>If a warm colour feels difficult:</strong> move mustard, camel or orange into trousers, footwear or a bag, then use navy, white, berry or charcoal near the face.
            </p>
          </section>

          <SeoTeachingVisual
            src="/images/seo/cool-wheatish-skin-palette-iconik.webp"
            alt="Cool wheatish Indian skin palette with navy, emerald, berry, cobalt, charcoal and crisp white."
            caption="A cool wheatish outfit can use one clear lead, navy as the anchor and crisp white for lift."
            width={1003}
            height={1568}
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What About Neutral or Olive Wheatish Skin?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Neutral does not mean that only muted colour will work, and olive does not automatically mean warm. When temperature tests are mixed, compare colour clarity and the amount of grey instead:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Dusty rose and soft blush</li>
              <li>Warm taupe and stone</li>
              <li>Muted teal and soft jade</li>
              <li>Greyed lavender and dusty lilac</li>
              <li>Soft olive and warm sage</li>
              <li>Camel and warm beige</li>
              <li>Soft mauve and muted plum</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              Also test a few clearer colours—emerald, berry or teal—because balanced colouring can still carry intensity. See the full <Link href="/colour-analysis/neutral-undertone" className="underline hover:opacity-70">neutral undertone guide</Link> for a deeper breakdown.
            </p>
          </section>

          <SeoTeachingVisual
            src="/images/seo/neutral-olive-wheatish-palette-iconik.webp"
            alt="Neutral olive wheatish Indian skin with soft navy, cocoa, aubergine, dusty rose, muted teal and stone."
            caption="Mixed temperature results do not require a colourless wardrobe; compare softness and clarity before ruling out colour."
            width={1003}
            height={1568}
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Can Wheatish Skin Wear Pastels?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Yes. Test the exact pastel rather than the category. Warm peach, soft coral and warm blush may support a warm-leaning palette; lilac, dusty rose and powder blue may support a cool-leaning palette. Olive and neutral colouring may prefer a pastel with less chalky white or a slightly greyed finish.
            </p>
            <p className="text-gray-600 leading-relaxed">
              If a pastel reduces facial definition, add a deeper neckline, jacket, dupatta, saree blouse, bag or border. This restores contrast without changing the colour you wanted to wear.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">White or Ivory, Gold or Silver?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Compare crisp white, soft white and warm ivory in the same indirect daylight. Keep the version that makes the face appear even and defined. A preference for strong or soft contrast can matter as much as undertone.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Compare jewellery with similar size and finish. Polished metal reflects more light than brushed metal, while stones and surrounding fabric alter the effect. Judge the complete neckline composition instead of using skin depth as a metal rule.
            </p>
          </section>

          <SeoTeachingVisual
            src="/images/seo/wheatish-skin-colour-levers-iconik.webp"
            alt="Wheatish Indian office outfit illustrating temperature, clarity and contrast as three colour-selection levers."
            caption="Choose temperature first, refine softness or clarity second, then set the amount of light-to-deep contrast."
            width={1003}
            height={1568}
          />

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How to Translate the Palette Into Real Indian Outfits</h2>
            <ul className="space-y-3 text-gray-600 list-disc pl-6">
              <li><strong>Kurta set:</strong> place your strongest colour in the kurta or dupatta, then repeat one neutral in the trousers and bag.</li>
              <li><strong>Saree:</strong> test the blouse and pallu closest to the face; the body colour can be more flexible.</li>
              <li><strong>Office wear:</strong> let one colour lead and keep prints controlled so the outfit does not compete with the face.</li>
              <li><strong>Occasion wear:</strong> balance fabric sheen, embroidery and jewellery; a colour can feel harsher when every surface is highly reflective.</li>
              <li><strong>Shopping:</strong> photograph fabrics near the face in consistent light. Store lighting can make warm colours yellower and cool colours greyer.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Chromatic Harmony Mapping™ Work for Wheatish Skin?</h2>
            <p className="text-gray-600 leading-relaxed">
              ICONIK&apos;s Chromatic Harmony Mapping™ is a proprietary styling framework. It compares observed temperature, skin depth, facial contrast and colour clarity, then translates the pattern into a practical wardrobe palette. It is a styling prescription—not a medical or biological diagnosis—and it should not reduce wheatish skin to one generic category.
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
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones — Full Guide</Link></li>
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone: 3 At-Home Tests</Link></li>
              <li>→ <Link href="/colour-analysis/warm-cool-neutral-undertone-india" className="underline hover:opacity-70">Warm vs Cool vs Neutral Undertone: Complete Comparison</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-dusky-skin" className="underline hover:opacity-70">Best Colours for Dusky Skin</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-fair-skin-india" className="underline hover:opacity-70">Best Colours for Fair Skin</Link></li>
            </ul>
          </section>

          <section className="mb-10 overflow-hidden rounded-[2rem] bg-[#27353b] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.16)]">
            <TrackedArticleCtaView tracking={growthTracking} />
            <div className="rounded-[1.8rem] border border-white/15 bg-white/10 p-7 text-white backdrop-blur-xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#f0cb80]">Free three-minute diagnostic</p>
              <h2 className="mb-3 font-serif text-3xl text-[#fffaf1]">Test colours already in your wardrobe</h2>
              <p className="mb-6 leading-relaxed text-white/75">Compare tops, dupattas, scarves, or saree fabrics in consistent daylight and score what happens to facial clarity, lift, shadows, and dullness.</p>
              <TrackedArticleLink href={glowTestHref} tracking={growthTracking} className="inline-block rounded-full bg-[#f0cb80] px-7 py-3 font-semibold text-[#27353b] transition hover:bg-[#f6d99e]">
                Take the Free Glow Test →
              </TrackedArticleLink>
            </div>
          </section>

          <InstagramReelsForArticle articlePath={path} />

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Rana, Jasmine. &quot;Wheatish Skin Tone: Meaning, Undertones and Best Colours.&quot; Iconik, updated 23 July 2026. https://www.iconik.pro/colour-analysis/best-colours-wheatish-skin-india</p>
          </div>

            </div>
          </div>
        </main>
        <SeoEditorialFooter />
      </div>
    </>
  );
}
