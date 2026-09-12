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

const path = "/colour-analysis/seasonal-colour-analysis-india";
const title = "Seasonal Colour Analysis for Indian Skin: Does It Work?";
const description =
  "A balanced guide to Spring, Summer, Autumn and Winter colour analysis for Indian skin—what remains useful, where simplified quizzes fail, and how to test your result.";
const published = "2025-04-01";
const modified = "2026-07-24";

export const metadata: Metadata = buildArticleMetadata({
  title,
  description,
  path,
  datePublished: published,
  dateModified: modified,
  authorPath: "/about#jasmine-rana",
  keywords: [
    "seasonal colour analysis India",
    "seasonal colour analysis Indian skin",
    "Spring Summer Autumn Winter colour analysis",
    "12 season colour analysis India",
  ],
  image: {
    path: "/images/seo/neutral-olive-wheatish-palette-iconik.webp",
    width: 1003,
    height: 1568,
    alt: "Indian skin shown with a balanced, non-seasonal colour palette.",
  },
});

const faqs = [
  {
    q: "Am I automatically Autumn or Winter if I have dark hair and eyes?",
    a: "No. Dark features may increase apparent depth or contrast, but they do not establish undertone or clarity. Compare warm versus cool and muted versus clear drapes before choosing a season.",
  },
  {
    q: "Is seasonal colour analysis accurate for Indian women?",
    a: "It can be useful when the practitioner uses representative drapes, observes depth and clarity carefully, and does not use Eurocentric hair or eye stereotypes as shortcuts. A quiz based mainly on dark hair and brown eyes is much less informative.",
  },
  {
    q: "Are 12-season and 16-season systems better?",
    a: "More categories can describe nuance, but extra labels do not fix poor lighting, weak drapes or demographic assumptions. The test process matters more than the number of seasons.",
  },
  {
    q: "What if my best colours come from two seasons?",
    a: "That is normal. Seasonal categories are organising tools, not natural boundaries. Keep the shared qualities—such as cool, deep and clear—and build a practical palette from the fabrics that repeatedly work.",
  },
  {
    q: "Can I test seasonal colour at home?",
    a: "Yes, as a starting point. Compare temperature, depth and clarity one variable at a time under stable daylight. Avoid typing yourself from one selfie because cameras automatically change exposure, white balance and contrast.",
  },
];

const seasonCards = [
  {
    name: "Spring",
    shorthand: "Usually warm, lighter and clearer",
    usefulQuestion: "Do fresh warm colours work better than earthy or heavily muted ones?",
  },
  {
    name: "Summer",
    shorthand: "Usually cool, lighter and softer",
    usefulQuestion: "Do blue-based colours work best when they are softened rather than highly saturated?",
  },
  {
    name: "Autumn",
    shorthand: "Usually warm, deeper and softer",
    usefulQuestion: "Do earthy warm colours integrate better than bright warm colours?",
  },
  {
    name: "Winter",
    shorthand: "Usually cool, deeper and clearer",
    usefulQuestion: "Does the face remain defined beside cool saturation and stronger contrast?",
  },
];

export default function SeasonalColourAnalysisIndiaPage() {
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    articleNode({
      title,
      description,
      path,
      datePublished: published,
      dateModified: modified,
      images: ["/images/seo/neutral-olive-wheatish-palette-iconik.webp"],
      about: ["Seasonal colour analysis", "Indian skin tones", "Personal colour analysis"],
    }),
    faqPageNode(faqs),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Colour Analysis", path: "/colour-analysis" },
      { name: "Seasonal Colour Analysis India", path },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoArticleLayout
        hero={{
          eyebrow: "Colour-system comparison",
          title,
          summary:
            "Yes—seasonal colour language can be useful for Indian skin. It becomes unreliable when dark hair and brown eyes automatically produce an Autumn or Winter label, when examples exclude South Asian skin, or when a quiz replaces controlled draping.",
          breadcrumbs: [
            { label: "Home", href: "/" },
            { label: "Colour Analysis", href: "/colour-analysis" },
            { label: "Seasonal Colour Analysis India" },
          ],
          published: "1 April 2025",
          updated: "24 July 2026",
          reviewer: "Jasmine Rana",
          readingTime: "10 min read",
        }}
        quickAnswer={
          <SeoQuickAnswer
            answer="Use the seasons as descriptive shorthand, not as four rigid boxes. Test temperature, depth and clarity directly on your face."
            detail="A well-conducted seasonal analysis can work across Indian skin tones. A dark-feature quiz that skips representative draping cannot."
          />
        }
        tableOfContents={[
          { href: "#what-it-is", label: "What seasonal analysis is" },
          { href: "#four-seasons", label: "The four seasons" },
          { href: "#where-it-breaks", label: "Where it breaks down" },
          { href: "#test-result", label: "How to test your result" },
          { href: "#chm-comparison", label: "Seasonal analysis vs CHM" },
        ]}
        afterArticle={
          <>
            <SeoFaqSection faqs={faqs} />
            <SeoAuthorReview>
              <p>
                Jasmine reviews ICONIK&apos;s colour guidance and its use across Indian, western and
                fusion wardrobes. This comparison explains practical differences without claiming that
                one colour system is universally correct.
              </p>
            </SeoAuthorReview>
            <SeoRelatedGuides
              links={[
                {
                  href: "/colour-analysis/indian-skin-tones",
                  title: "Colour Analysis for Indian Skin",
                  description: "Separate skin depth, undertone, clarity and contrast.",
                },
                {
                  href: "/colour-analysis/how-to-find-undertone",
                  title: "How to Find Your Undertone",
                  description: "Run a controlled fabric comparison at home.",
                },
                {
                  href: "/vs/chromatic-harmony-mapping-vs-seasonal-colour-analysis",
                  title: "CHM vs Seasonal Colour Analysis",
                  description: "Compare the two systems feature by feature.",
                },
              ]}
            />
            <SeoBlueprintCta
              title="Prefer a practical palette over another quiz label?"
              description="The ICONIK Blueprint applies colour, proportion and face-framing observations to 20 outfit formulas for your real wardrobe."
            />
          </>
        }
      >
        <section id="what-it-is">
          <h2>What seasonal colour analysis actually describes</h2>
          <p>
            Seasonal colour analysis groups colour characteristics into memorable families. The basic
            four-season model uses three useful observations:
          </p>
          <ul>
            <li><strong>Temperature:</strong> warm, cool or balanced.</li>
            <li><strong>Depth:</strong> lighter, medium or deeper colour relationships.</li>
            <li><strong>Clarity:</strong> clear, bright colour versus softened or muted colour.</li>
          </ul>
          <p>
            The seasons are names for combinations of those qualities. They are not biological types,
            and the edges between them are not fixed. Expanded 12- and 16-season systems add
            subcategories, but the quality of the observation still matters more than the label count.
          </p>
        </section>

        <section id="four-seasons">
          <h2>The four seasons as useful questions</h2>
          <div className="not-prose grid gap-4 md:grid-cols-2">
            {seasonCards.map((season) => (
              <article key={season.name} className="rounded-2xl border border-[rgba(44,38,34,0.12)] bg-white/35 p-6">
                <p className="seo-eyebrow">{season.name}</p>
                <h3 className="mt-3 font-[family-name:var(--font-fraunces)] text-2xl font-normal text-[var(--seo-ink)]">
                  {season.shorthand}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[rgba(44,38,34,0.66)]">{season.usefulQuestion}</p>
              </article>
            ))}
          </div>
          <p>
            These are comparison prompts, not demographic descriptions. An Indian woman can show any
            of these colour relationships, and many people sit between two families.
          </p>
        </section>

        <SeoTeachingVisual
          src="/images/seo/neutral-olive-wheatish-palette-iconik.webp"
          alt="Neutral olive Indian skin with navy, cocoa, aubergine, dusty rose, muted teal and stone."
          caption="A useful palette can cross seasonal boundaries while preserving shared qualities such as depth, softness and balanced temperature."
          width={1003}
          height={1568}
          priority
        />

        <section id="where-it-breaks">
          <h2>Where simplified seasonal analysis breaks down</h2>
          <h3>Dark-feature shortcuts</h3>
          <p>
            If a quiz treats dark hair and brown eyes as decisive, many South Asian users are pushed
            toward Autumn or Winter before undertone and clarity have been tested.
          </p>
          <h3>Unrepresentative examples</h3>
          <p>
            A system is harder to use when its teaching images and drapes do not show olive undertones,
            deeper skin or the range of contrast found across Indian faces.
          </p>
          <h3>Selfie-only typing</h3>
          <p>
            Phone cameras alter exposure, white balance, contrast and skin rendering. One processed
            selfie cannot substitute for repeated comparisons in stable light.
          </p>
          <h3>No wardrobe translation</h3>
          <p>
            A label is incomplete if it does not help choose a saree blouse, dupatta, work neutral,
            jewellery finish or the amount of contrast in an Indian occasion outfit.
          </p>
        </section>

        <SeoInsightCard eyebrow="A fair conclusion" title="The system is not the same as the shortcut">
          <p>
            It is inaccurate to say seasonal colour analysis simply “fails Indian women.” A careful
            practitioner with representative drapes can use it well. The problem is rigid typing,
            weak examples and conclusions based on hair and eye colour rather than controlled
            comparison.
          </p>
        </SeoInsightCard>

        <section id="test-result">
          <h2>How to test a seasonal result before changing your wardrobe</h2>
          <ol>
            <li>Write down the three claimed qualities—for example cool, deep and clear.</li>
            <li>Test each quality separately with two similarly deep fabrics.</li>
            <li>Use indirect daylight and keep makeup, camera and position unchanged.</li>
            <li>Check whether the face remains defined and whether unwanted casts increase.</li>
            <li>Repeat the strongest comparison before buying a palette or replacing clothing.</li>
          </ol>
          <p>
            If the season is partly right, keep the useful qualities. A person typed as Winter may
            retain “cool” and “deep” but discover that slightly softer colour is easier than maximum
            clarity. That is a refinement, not a failed result.
          </p>
          <p>
            Follow the full <Link href="/colour-analysis/how-to-find-undertone" className="underline">controlled undertone test</Link> for setup and observation cues.
          </p>
        </section>

        <section id="chm-comparison">
          <h2>How Chromatic Harmony Mapping™ differs</h2>
          <p>
            ICONIK&apos;s CHM framework does not assign a season. It records temperature, skin depth,
            clarity, contrast and wardrobe context, then selects a focused set of reference colours
            and practical applications.
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Seasonal analysis</th>
                  <th>ICONIK CHM™</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Primary output</td>
                  <td>Season or sub-season palette</td>
                  <td>Focused reference colours and outfit applications</td>
                </tr>
                <tr>
                  <td>Indian garment context</td>
                  <td>Depends on the practitioner</td>
                  <td>Included in the framework</td>
                </tr>
                <tr>
                  <td>Human review</td>
                  <td>Depends on service</td>
                  <td>Included in the ICONIK Blueprint</td>
                </tr>
                <tr>
                  <td>Scientific status</td>
                  <td>Styling framework</td>
                  <td>Proprietary styling framework</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Neither framework should override comfort, culture or a colour you enjoy wearing. Read
            the <Link href="/methodology/chromatic-harmony-mapping" className="underline">canonical CHM methodology page</Link> for its full scope and limitations.
          </p>
        </section>
      </SeoArticleLayout>
    </>
  );
}
