import type { Metadata } from "next";
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

const path = "/colour-analysis/best-colours-dusky-skin";
const growthTracking = {
  article_id: "best_colours_dusky_skin",
  content_cluster: "colour_intelligence",
  audience: "women" as const,
  hook_type: "undertone_not_depth",
  visual_id: "dusky_skin_drape_test",
  visual_variant: "article_4x5",
  content_source: "seo_dusky_skin_article",
};
const glowTestHref =
  "/tools/glow-test?source=seo_dusky_skin_article&article_id=best_colours_dusky_skin&content_cluster=colour_intelligence&audience=women&hook_type=undertone_not_depth&visual_id=dusky_skin_drape_test&visual_variant=article_4x5";

export const metadata: Metadata = buildMetadata({
  title: "Dusky Skin Tone: Meaning, Undertones & 16 Best Colours",
  description:
    "What does dusky skin tone mean? Learn how warm, cool, and neutral undertones change the colours, pastels, whites, and jewellery that suit dusky Indian skin.",
  path,
  type: "article",
  keywords: [
    "dusky skin tone",
    "dusky skin tone meaning",
    "best colours for dusky skin",
    "colours for dusky skin tone",
    "dusky skin colour palette",
  ],
});

const faqs = [
  {
    q: "Does melanin depth affect which colours work?",
    a: "Yes. Deeper skin tones generally need colours with sufficient chromatic intensity to create visual harmony. Very pale icy pastels can look washed out against deeper skin regardless of undertone. Chromatic Harmony Mapping™ accounts for both undertone and melanin depth, ensuring the palette has the right intensity level.",
  },
  {
    q: "Can a dusky Indian woman wear white?",
    a: "Yes. White works well for cool undertone dusky women — it creates clean, high-contrast brightness. For warm undertone dusky women, warm off-white or ivory is more harmonious than stark white, which can look slightly harsh against a yellow-based undertone.",
  },
  {
    q: "Is gold jewellery always better for dusky skin?",
    a: "Not necessarily. Gold is universally associated with Indian skin, but it is only more flattering than silver for warm undertone women. Cool undertone dusky women look equally stunning — often more so — in silver and white gold. Your undertone determines your metal, not your surface depth.",
  },
  {
    q: "How do I know my undertone if I have deep skin?",
    a: "No single at-home test is definitive. Compare several clues in indirect daylight: whether gold or silver looks more harmonious, whether warm or cool drapes make the face look clearer, and whether white or ivory is more flattering. If the signals conflict, your undertone may be neutral or olive.",
  },
];

export default function BestColoursDuskySkinPage() {
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    articleNode({
      title: "Dusky Skin Tone: Meaning, Undertones & 16 Best Colours",
      description:
        "A practical guide to the meaning of dusky skin tone and the colours that work across warm, cool, and neutral undertones.",
      path,
      datePublished: "2026-03-21",
      dateModified: "2026-07-11",
    }),
    faqPageNode(faqs),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Colour Analysis", path: "/colour-analysis" },
      { name: "Dusky Skin Tone", path },
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
              <li><Link href="/colour-analysis" className="hover:underline">Colour Analysis</Link></li>
              <li aria-hidden="true">›</li>
              <li className="text-gray-800 font-medium">Best Colours for Dusky Skin</li>
            </ol>
          </nav>

          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">
              Dusky Skin Tone: Meaning, Undertones &amp; 16 Best Colours
            </h1>
            <p className="article-summary text-lg text-gray-600 leading-relaxed">
              Dusky skin tone usually describes a medium-to-deep brown surface complexion. It does not tell you whether the undertone is warm, cool, neutral, or olive—and that undertone strongly influences which clothing colours create harmony near the face.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full border border-gray-200 px-3 py-1">Published 21 March 2026</span>
              <span className="rounded-full border border-gray-200 px-3 py-1">Updated 11 July 2026</span>
              <Link href="/about" className="rounded-full border border-gray-200 px-3 py-1 hover:bg-gray-50">
                Reviewed by Mithil Navalakha, Iconik founder
              </Link>
            </div>
          </header>

          <aside className="mb-12 overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#9aabb2_0%,#71858e_100%)] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.18)]">
            <div className="rounded-[1.8rem] border border-white/45 bg-white/10 p-6 text-white backdrop-blur-xl md:p-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/60">The short answer</p>
              <p className="font-serif text-2xl leading-relaxed text-[#fffaf1] md:text-3xl">
                There is no single palette for dusky skin. Start with undertone, then adjust colour intensity and contrast for your skin depth.
              </p>
              <p className="mt-4 leading-relaxed text-white/75">
                Warm undertones tend to harmonise with terracotta, olive, coral, mustard, and warm cream. Cool undertones often suit cobalt, emerald, magenta, burgundy, and crisp white. Neutral and olive undertones need a balanced test rather than a rigid warm-or-cool label.
              </p>
            </div>
          </aside>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Does Dusky Skin Tone Mean?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              In Indian beauty and fashion language, &quot;dusky&quot; is commonly used for brown complexions that sit between medium and deep skin depth. It is a description of visible depth, not a scientific undertone category and not a complete colour diagnosis.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Two people can both be described as dusky while one has a golden undertone, another has a cooler red-blue undertone, and a third has an olive or neutral cast. Treating them as one palette is why generic dusky-skin colour lists often contradict one another.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Is Most &quot;Best Colours for Dusky Skin&quot; Advice Wrong?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Most advice conflates surface tone with undertone. &quot;Wear bold, saturated colours&quot; or &quot;avoid pastels&quot; are based on the assumption that all dusky women have the same colouring. They do not. A dusky woman can have a warm undertone OR a cool undertone — and those require entirely different colour palettes.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The same cobalt blue that looks electric and stunning on a dusky woman with a cool undertone looks jarring and wrong on a dusky woman with a warm undertone. Undertone is the variable. Surface depth is not.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Is the Difference Between Undertone and Surface Tone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Surface tone is what you see: the depth of your skin&apos;s colour, which changes with sun exposure and seasons. Undertone is the fixed hue beneath the surface — warm (yellow/golden), cool (pink/blue), or neutral — and it never changes.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Two women with similar dusky surface tones can have different undertones. Undertone is therefore a stronger starting point than depth alone, while contrast, hair depth, eye depth, and the colour&apos;s intensity refine the final palette.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Colours for Dusky Skin with Warm Undertone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A warm undertone has a golden, yellow, or peachy base. For medium-to-deep warm undertone skin, colours with earthy richness create the strongest harmony:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Terracotta, rust, and burnt orange</li>
              <li>Mustard yellow and golden yellow</li>
              <li>Olive green and warm khaki</li>
              <li>Camel and warm beige</li>
              <li>Warm reds — tomato red, brick red, fire red</li>
              <li>Coral and warm peach</li>
              <li>Earthy browns — cognac, chocolate, warm tan</li>
              <li>Gold and amber</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Icy pastels, ashy grey, cool lavender, stark white, icy blue. These introduce a cool undertone that clashes with the golden base of warm skin.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are the Best Colours for Dusky Skin with Cool Undertone?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              A cool undertone has a pink, blue, or red base. For medium-to-deep cool undertone skin, jewel tones — deeply saturated and cool in temperature — are the most flattering:
            </p>
            <ul className="space-y-2 text-gray-600 list-disc list-inside mb-4">
              <li>Cobalt blue and royal blue</li>
              <li>Emerald green and jewel green</li>
              <li>Royal purple and amethyst</li>
              <li>Fuchsia and hot pink</li>
              <li>Magenta and cool berry</li>
              <li>Burgundy and deep wine</li>
              <li>Navy and midnight blue</li>
              <li>Cool red — crimson, cool scarlet</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              <strong>Avoid:</strong> Mustard, warm orange, camel, earthy brown, warm red. These introduce yellow warmth that clashes with the pink or blue base of a cool undertone.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What About Neutral or Olive Dusky Skin?</h2>
            <p className="text-gray-600 mb-5 leading-relaxed">
              Neutral and olive undertones often receive conflicting results from simple vein or jewellery tests. Instead of forcing a label, compare controlled drapes near the face and watch for changes in shadows, sallowness, redness, and eye clarity.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { name: "Balanced neutrals", colours: "Mushroom, stone, soft navy, cocoa" },
                { name: "Muted colour", colours: "Dusty rose, teal, aubergine, sage" },
                { name: "Test carefully", colours: "Very yellow mustard, icy grey, neon brights" },
              ].map((item) => (
                <div key={item.name} className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <h3 className="mb-2 font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{item.colours}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Can Dusky Skin Wear Pastels?</h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Yes — with the right pastels. The myth that dusky women should avoid pastels is based on icy, washed-out pastels in the wrong temperature. A cool undertone dusky woman can wear muted lavender, dusty rose, or a soft powder blue. A warm undertone dusky woman can wear a muted peach or a soft warm green.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The key is undertone temperature in the pastel itself, not the pastel category as a whole. Iconik&apos;s Chromatic Harmony Mapping™ identifies which specific pastels are within your undertone palette — rather than ruling out an entire colour category.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How Does Chromatic Harmony Mapping™ Work for Dusky Skin?</h2>
            <p className="text-gray-600 leading-relaxed">
              CHM maps two variables simultaneously: undertone (warm, cool, or neutral) and melanin depth. For deeper Indian skin tones, it specifically recommends colours with sufficient chromatic intensity to create visual harmony — very pale icy tints can look washed out against deeper melanin regardless of undertone temperature. The output is a 10-colour palette calibrated for both your undertone type and your melanin depth.
            </p>
          </section>

          <section className="mb-12 overflow-hidden rounded-[2rem] bg-[#27353b] p-1 shadow-[0_20px_55px_rgba(38,52,58,0.16)]">
            <TrackedArticleCtaView tracking={growthTracking} />
            <div className="rounded-[1.8rem] border border-white/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] p-7 text-white backdrop-blur-xl md:p-9">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#f0cb80]">Free 3-minute test</p>
              <h2 className="mb-3 font-serif text-3xl text-[#fffaf1]">Test colours from your own wardrobe</h2>
              <p className="mb-6 max-w-2xl leading-relaxed text-white/70">
                The Glow Test helps you compare tops, dupattas, scarves, or saree fabrics in the same daylight and identify which colours make your face look clearer, lifted, dull, or shadowed.
              </p>
              <TrackedArticleLink
                href={glowTestHref}
                tracking={growthTracking}
                className="inline-flex rounded-full bg-[#f0cb80] px-7 py-3 font-semibold text-[#27353b] transition hover:bg-[#f6d99e]"
              >
                Take the Free Glow Test →
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
              <li>→ <Link href="/colour-analysis" className="underline hover:opacity-70">Colour Analysis for Indian Skin Tones — Full Guide</Link></li>
              <li>→ <Link href="/colour-analysis/how-to-find-undertone" className="underline hover:opacity-70">How to Find Your Undertone: 3 At-Home Tests</Link></li>
              <li>→ <Link href="/colour-analysis/warm-cool-neutral-undertone-india" className="underline hover:opacity-70">Warm vs Cool vs Neutral Undertone</Link></li>
              <li>→ <Link href="/colour-analysis/indian-skin-tones" className="underline hover:opacity-70">Indian Skin Tone Colour Guide</Link></li>
              <li>→ <Link href="/colour-analysis/best-colours-wheatish-skin-india" className="underline hover:opacity-70">Best Colours for Wheatish Skin</Link></li>
            </ul>
          </section>

          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Want your exact colour palette in 48 hours?</h2>
            <p className="text-gray-600 mb-6">Iconik&apos;s Chromatic Harmony Mapping™ identifies your precise undertone and melanin depth, then builds your exact 10-colour palette.</p>
            <Link href="/" className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors">
              Get My Style Blueprint — ₹3,299
            </Link>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-5 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Cite this guide:</p>
            <p>Navalakha, Mithil. &quot;Dusky Skin Tone: Meaning, Undertones &amp; 16 Best Colours.&quot; Iconik, updated 11 July 2026. https://www.iconik.pro/colour-analysis/best-colours-dusky-skin</p>
          </div>

        </div>
      </main>
    </>
  );
}
