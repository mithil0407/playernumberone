import type { Metadata } from "next";
import Link from "next/link";
import {
  SeoArticleLayout,
  SeoAuthorReview,
  SeoBlueprintCta,
  SeoFaqSection,
  SeoInsightCard,
  SeoQuickAnswer,
  SeoRelatedGuides,
  SeoTeachingVisual,
} from "@/components/seo/SeoEditorial";
import { buildArticleMetadata } from "@/lib/seo";
import {
  articleNode,
  breadcrumbList,
  faqPageNode,
  founderPerson,
  graph,
  organizationNode,
} from "@/lib/structuredData";

const path = "/colour-analysis/indian-skin-tones";
const title = "Colour Analysis for Indian Skin: What Needs Adapting";
const description =
  "Learn how to apply colour analysis across Indian skin depths and undertones without assuming dark hair means Autumn or Winter, or that one palette suits every Indian complexion.";
const published = "2025-01-01";
const modified = "2026-07-24";

export const metadata: Metadata = buildArticleMetadata({
  title,
  description,
  path,
  datePublished: published,
  dateModified: modified,
  authorPath: "/about#jasmine-rana",
  keywords: [
    "colour analysis Indian skin tones",
    "Indian skin undertone",
    "colour palette Indian women",
    "olive undertone India",
  ],
  image: {
    path: "/images/seo/skin-depth-undertone-difference-iconik.webp",
    width: 1122,
    height: 1402,
    alt: "Indian skin depth and undertone shown as separate colour variables.",
  },
});

const faqs = [
  {
    q: "Do all Indian skin tones have a warm undertone?",
    a: "No. Indian skin can lean warm, cool, neutral or olive at every visible depth. Dark hair and eyes do not prove a warm undertone, so use controlled fabric comparisons instead of demographic assumptions.",
  },
  {
    q: "Why do Indian women often get typed as Autumn or Winter?",
    a: "Simplified seasonal quizzes often use dark hair and eyes as dominant inputs. That can funnel many South Asian users toward the two deeper seasons before undertone, clarity and individual contrast have been properly compared.",
  },
  {
    q: "Is seasonal colour analysis useless for Indian skin?",
    a: "No. Temperature, depth, clarity and contrast are useful observations. The difficulty is usually limited examples, unrepresentative drapes or rigid category shortcuts—not the idea of comparing colour itself.",
  },
  {
    q: "What is olive undertone?",
    a: "Olive describes a green-grey or muted cast that can sit across warm, neutral or cool-leaning colour behaviour. It should not automatically be labelled warm. Compare yellow-green with blue-green and soft with clear colours under the same light.",
  },
  {
    q: "Should deeper Indian skin avoid pastels?",
    a: "No. Test the pastel's temperature and amount of white. If a pale shade appears chalky, try a clearer version, a slightly deeper tint or stronger contrast at the neckline instead of banning the whole colour family.",
  },
];

export default function IndianSkinTonesPage() {
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    articleNode({
      title,
      description,
      path,
      datePublished: published,
      dateModified: modified,
      images: [
        "/images/seo/skin-depth-undertone-difference-iconik.webp",
        "/images/seo/dark-skin-depth-undertone-iconik.webp",
      ],
      about: ["Indian skin tones", "Colour analysis", "Undertone", "Skin depth"],
    }),
    faqPageNode(faqs),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Colour Analysis", path: "/colour-analysis" },
      { name: "Indian Skin Tones", path },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoArticleLayout
        hero={{
          eyebrow: "Indian colour analysis",
          title,
          summary:
            "Colour analysis can work across Indian skin tones when the method separates skin depth from undertone, represents olive and neutral results, and translates the palette into Indian garments. The problem is usually the shortcut—not the person being analysed.",
          breadcrumbs: [
            { label: "Home", href: "/" },
            { label: "Colour Analysis", href: "/colour-analysis" },
            { label: "Indian Skin Tones" },
          ],
          published: "1 January 2025",
          updated: "24 July 2026",
          reviewer: "Jasmine Rana",
          readingTime: "10 min read",
        }}
        quickAnswer={
          <SeoQuickAnswer
            answer="Do not use 'Indian skin' as one palette. Separate visible depth, undertone, clarity and contrast, then test the exact fabrics you plan to wear."
            detail="Fair, wheatish, dusky and deep are broad appearance descriptions. None of them decides warm, cool, neutral or olive direction by itself."
          />
        }
        tableOfContents={[
          { href: "#four-variables", label: "The four variables" },
          { href: "#common-shortcuts", label: "Shortcuts that mislead" },
          { href: "#depth-guidance", label: "Depth-specific guidance" },
          { href: "#indian-wardrobe", label: "Apply it to Indian wear" },
          { href: "#method", label: "ICONIK's method" },
        ]}
        afterArticle={
          <>
            <SeoFaqSection faqs={faqs} />
            <SeoAuthorReview>
              <p>
                Jasmine reviews ICONIK&apos;s colour guidance for Indian, western and fusion
                wardrobes. The framework is designed to support decisions, not rank skin colours or
                impose a single cultural beauty standard.
              </p>
            </SeoAuthorReview>
            <SeoRelatedGuides
              links={[
                {
                  href: "/colour-analysis/how-to-find-undertone",
                  title: "How to Find Your Undertone",
                  description: "Run a controlled at-home fabric comparison instead of relying on veins.",
                },
                {
                  href: "/colour-analysis/seasonal-colour-analysis-india",
                  title: "Seasonal Colour Analysis in India",
                  description: "See where seasonal language helps and where rigid categories become limiting.",
                },
                {
                  href: "/methodology/chromatic-harmony-mapping",
                  title: "Chromatic Harmony Mapping™",
                  description: "Read the canonical scope and limitations of ICONIK's colour method.",
                },
              ]}
            />
            <SeoBlueprintCta
              title="Build a palette around your skin and your actual wardrobe."
              description="The ICONIK Blueprint combines colour direction with proportion, face framing and 20 outfit formulas after a 30-minute consultation."
            />
          </>
        }
      >
        <SeoTeachingVisual
          src="/images/seo/skin-depth-undertone-difference-iconik.webp"
          alt="Indian skin depth and undertone shown as separate variables."
          caption="Visible depth and colour direction are related observations, not interchangeable labels."
          width={1122}
          height={1402}
          priority
        />

        <section id="four-variables">
          <h2>Use four variables—not one skin-tone label</h2>
          <h3>1. Skin depth</h3>
          <p>
            Depth describes how light or deep the visible complexion appears. Terms such as fair,
            wheatish, dusky and deep are subjective social descriptions, not complete palette
            categories.
          </p>
          <h3>2. Undertone direction</h3>
          <p>
            Warm, cool, neutral and olive describe colour behaviour observed through comparison.
            Every direction can appear at every depth.
          </p>
          <h3>3. Clarity</h3>
          <p>
            Some faces remain defined beside vivid colour; others look more coherent beside softened,
            greyed or complex shades. This is independent of simply being warm or cool.
          </p>
          <h3>4. Contrast</h3>
          <p>
            Contrast compares light and dark across skin, hair, eyes and the outfit. It helps decide
            whether stark black-and-white, tonal dressing or a medium contrast feels most intentional.
          </p>
        </section>

        <section id="common-shortcuts">
          <h2>Three shortcuts that produce weak advice</h2>
          <h3>“Brown skin is warm”</h3>
          <p>
            Brown skin can lean warm, cool, neutral or olive. A golden surface cast can also coexist
            with cooler colour behaviour. Test fabric rather than assuming.
          </p>
          <h3>“Dark hair means Autumn or Winter”</h3>
          <p>
            Dark hair is common across South Asia, so it cannot do most of the classification work.
            Undertone, clarity and overall contrast still need to be observed.
          </p>
          <h3>“Deeper skin needs only jewel tones”</h3>
          <p>
            Jewel tones can create useful saturation and contrast, but deeper skin can also wear
            pastels, earth tones and neutrals. The exact tint, fabric finish and surrounding contrast
            decide the outcome.
          </p>
        </section>

        <SeoInsightCard eyebrow="Language matters" title="Skin-depth words should describe, not rank">
          <p>
            “Fair”, “wheatish”, “dusky” and “dark” carry cultural history and are used inconsistently.
            Use them only as broad search and appearance terms. Never treat lighter skin as the target
            or deeper skin as a problem to correct.
          </p>
        </SeoInsightCard>

        <section id="depth-guidance">
          <h2>What changes as skin depth changes?</h2>
          <p>
            Depth does not dictate temperature, but it can change how much white, grey or saturation a
            fabric can carry before it appears chalky, dull or overpowering.
          </p>
          <ul>
            <li><strong>Lighter depth:</strong> test whether pale colours need softness or a deeper anchor to preserve facial definition.</li>
            <li><strong>Medium or wheatish depth:</strong> compare temperature first, then check olive and clarity because surface gold can hide mixed results.</li>
            <li><strong>Dusky or medium-deep depth:</strong> test clear and muted versions; avoid assuming all pastels will wash the face out.</li>
            <li><strong>Deep depth:</strong> compare the amount of white in a tint and the outfit&apos;s total contrast. Rich colour is an option, not an obligation.</li>
          </ul>
        </section>

        <SeoTeachingVisual
          src="/images/seo/dark-skin-depth-undertone-iconik.webp"
          alt="Deep Indian skin shown with separate warm, cool, neutral and olive colour directions."
          caption="Deeper skin is not one palette. Undertone and clarity still change which versions of a colour are easiest near the face."
          width={1122}
          height={1402}
        />

        <section id="indian-wardrobe">
          <h2>Translate the palette into Indian garments</h2>
          <p>
            A palette is only valuable when it answers real purchase and outfit questions:
          </p>
          <ul>
            <li><strong>Saree:</strong> test the blouse and pallu nearest the face; the saree body can be more flexible.</li>
            <li><strong>Kurta set:</strong> place the supportive colour in the kurta or dupatta and repeat one neutral below.</li>
            <li><strong>Lehenga:</strong> evaluate blouse, dupatta, zari and stones together because reflected light changes the neckline effect.</li>
            <li><strong>Office wear:</strong> choose two repeatable neutrals before adding statement colours.</li>
            <li><strong>Jewellery:</strong> compare metal finish, scale and stones with the neckline colour rather than selecting metal from skin depth alone.</li>
          </ul>
          <p>
            For controlled comparisons, follow the <Link href="/colour-analysis/how-to-find-undertone" className="underline">at-home undertone guide</Link>.
          </p>
        </section>

        <section id="method">
          <h2>What ICONIK adapts in Chromatic Harmony Mapping™</h2>
          <p>
            ICONIK&apos;s proprietary framework records undertone direction, skin depth, clarity,
            contrast and wardrobe context. It then turns those observations into a limited set of
            reference colours, useful neutrals and outfit applications.
          </p>
          <p>
            It is a styling framework, not a physiological assessment or a scientifically validated
            diagnostic system. The reader&apos;s preferences, culture, dress code and the exact fabric
            can override the framework. Read the <Link href="/methodology/chromatic-harmony-mapping" className="underline">canonical methodology page</Link> for its process and limitations.
          </p>
        </section>
      </SeoArticleLayout>
    </>
  );
}
