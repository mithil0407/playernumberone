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

const path = "/style-guides/kurti-length-guide";
const title = "Kurti Length Guide: Choose the Hem by Proportion";
const description =
  "Choose short, hip, knee, calf or ankle-length kurtis using body landmarks, torso-to-leg proportion, bottom width and outfit context—not rigid height or body-type rules.";
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
    "kurti length guide India",
    "best kurti length by height",
    "kurti length for body type",
    "kurti and trouser proportion",
  ],
  image: {
    path: "/images/seo/look-taller-top-layer-hem-guide-iconik.webp",
    width: 1122,
    height: 1402,
    alt: "Garment hem positions at the waist, widest hip and upper thigh.",
  },
});

const faqs = [
  {
    q: "What is the most versatile kurti length?",
    a: "A hem around the lower hip or upper thigh is versatile because it can work with straight trousers, jeans and some wider bottoms. But the exact point should be judged on your body and with the intended bottom; a fixed inch measurement cannot fit every height or size.",
  },
  {
    q: "Which kurti length can create a taller impression?",
    a: "The strongest length effect usually comes from continuity: a clear shoulder fit, a deliberate waist or rise, limited colour breaks and a hem that does not stop at an awkward widest point. Knee, calf and ankle lengths can all look long when the kurti and bottom create one visual route.",
  },
  {
    q: "Can petite women wear long kurtis?",
    a: "Yes. Keep scale intentional: check sleeve length, side-slit height, print scale, bottom pooling and the amount of fabric. Heels are optional; clean hem and footwear continuity can create direction without them.",
  },
  {
    q: "Do plus-size women need longer kurtis?",
    a: "No. Plus size is not one proportion. Choose length from torso, leg, hip, tummy, shoulder and garment-fit relationships. A shorter structured kurti can work just as well as a longer fluid one.",
  },
  {
    q: "Should a kurti end above or below the widest hip?",
    a: "If you want a smoother vertical line, test a hem clearly above or below the fullest point rather than directly on it. If you want to emphasise the hip or create a strong horizontal break, ending on that point may be intentional.",
  },
];

const lengthGuide = [
  {
    name: "Short or tunic",
    landmark: "Above or around the upper hip",
    worksWith: "Jeans, straight trousers, wide trousers or skirts depending on volume",
    watch: "A boxy shape can lose direction if both top and bottom are equally wide",
  },
  {
    name: "Hip length",
    landmark: "Around the hip or upper thigh",
    worksWith: "Straight trousers, cigarette pants, jeans and controlled palazzos",
    watch: "Move the hem if it cuts exactly across a point you do not want emphasised",
  },
  {
    name: "Knee length",
    landmark: "Above, at or just below the knee",
    worksWith: "Straight trousers, churidars and some palazzos",
    watch: "Check side-slit height and whether the bottom width competes with the kurti",
  },
  {
    name: "Calf length",
    landmark: "Between knee and ankle",
    worksWith: "Straight, narrow or wide bottoms when the proportions are deliberate",
    watch: "Judge where the hem meets the calf and whether fabric gathers around the leg",
  },
  {
    name: "Ankle or floor length",
    landmark: "Near the ankle or shoe",
    worksWith: "Narrow hidden bottoms, full-length layers or occasion silhouettes",
    watch: "Check walking clearance, pooling, flare volume and whether footwear finishes the line",
  },
];

export default function KurtiLengthGuidePage() {
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    articleNode({
      title,
      description,
      path,
      datePublished: published,
      dateModified: modified,
      images: ["/images/seo/look-taller-top-layer-hem-guide-iconik.webp"],
      about: ["Kurti length", "Indian wear", "Proportion styling"],
    }),
    faqPageNode(faqs),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Style Guides", path: "/style-guides" },
      { name: "Kurti Length Guide", path },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoArticleLayout
        hero={{
          eyebrow: "Indian-wear proportion guide",
          title,
          summary:
            "Kurti length is not a number printed on a size chart. It is where the hem lands on your body, how that line interacts with the bottom, and whether the full outfit creates the direction you want.",
          breadcrumbs: [
            { label: "Home", href: "/" },
            { label: "Style Guides", href: "/style-guides" },
            { label: "Kurti Length Guide" },
          ],
          published: "1 January 2025",
          updated: "24 July 2026",
          reviewer: "Jasmine Rana",
          readingTime: "9 min read",
        }}
        quickAnswer={
          <SeoQuickAnswer
            answer="Choose kurti length by body landmark first, then test it with the intended bottom and footwear."
            detail="Two kurtis with the same listed length can land differently because of shoulder slope, bust, torso length, size and pattern cutting."
          />
        }
        tableOfContents={[
          { href: "#measure-landmark", label: "Measure the hem correctly" },
          { href: "#lengths", label: "Five useful length families" },
          { href: "#proportion", label: "Match length to proportion" },
          { href: "#bottoms", label: "Pair the bottom" },
          { href: "#shopping-check", label: "Fitting-room checklist" },
        ]}
        afterArticle={
          <>
            <SeoFaqSection faqs={faqs} />
            <SeoAuthorReview>
              <p>
                Jasmine reviews ICONIK&apos;s Indian-wear guidance across different heights, sizes and
                proportion patterns. The recommendations are tests to try, not rules about what a body
                is allowed to wear.
              </p>
            </SeoAuthorReview>
            <SeoRelatedGuides
              links={[
                {
                  href: "/style-guides/salwar-kameez-body-type",
                  title: "Salwar Kameez by Body Type",
                  description: "Coordinate kurta, bottom and dupatta proportions.",
                },
                {
                  href: "/body-type-styling/how-to-look-taller-clothing",
                  title: "How to Look Taller with Clothing",
                  description: "Understand rise, colour breaks, hems and vertical fall.",
                },
                {
                  href: "/methodology/geometric-silhouette-profiling",
                  title: "Geometric Silhouette Profiling™",
                  description: "Read ICONIK's canonical proportion framework.",
                },
              ]}
            />
            <SeoBlueprintCta
              title="Want kurti formulas based on your real proportions?"
              description="The ICONIK Blueprint combines Indian and western outfit formulas with colour, hairstyle and eyewear guidance after a 30-minute consultation."
            />
          </>
        }
      >
        <SeoTeachingVisual
          src="/images/seo/look-taller-top-layer-hem-guide-iconik.webp"
          alt="Garment hem positions at the waist, widest hip and upper thigh."
          caption="The visual effect comes from where the hem lands on your body—not from a universal inch measurement."
          width={1122}
          height={1402}
          priority
        />

        <section id="measure-landmark">
          <h2>Measure kurti length by body landmark</h2>
          <p>
            Product listings usually measure from the high shoulder point to the hem. That number is
            useful for comparing two products, but it does not predict where the kurti will land on
            every person.
          </p>
          <p>When trying a kurti, record the actual landmark:</p>
          <ul>
            <li>above the hip;</li>
            <li>at the fullest hip;</li>
            <li>upper thigh;</li>
            <li>above, at or below the knee;</li>
            <li>mid-calf; or</li>
            <li>ankle.</li>
          </ul>
          <p>
            Bust projection, shoulder slope, torso length and size can all make the front and back hem
            sit differently. Check both sides, not only the front mirror view.
          </p>
        </section>

        <section id="lengths">
          <h2>Five useful kurti-length families</h2>
          <div className="not-prose space-y-4">
            {lengthGuide.map((item) => (
              <article key={item.name} className="rounded-2xl border border-[rgba(44,38,34,0.12)] bg-white/35 p-6">
                <p className="seo-eyebrow">{item.landmark}</p>
                <h3 className="mt-3 font-[family-name:var(--font-fraunces)] text-2xl font-normal text-[var(--seo-ink)]">{item.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[rgba(44,38,34,0.68)]"><strong>Try with:</strong> {item.worksWith}</p>
                <p className="mt-2 text-sm leading-6 text-[rgba(44,38,34,0.68)]"><strong>Check:</strong> {item.watch}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="proportion">
          <h2>Match length to the proportion you want to create</h2>
          <h3>For a longer leg impression</h3>
          <p>
            Test a shorter kurti with a higher-looking rise, or use a longer kurti and bottom in a
            related colour so the eye follows one route. These are different solutions to the same
            goal.
          </p>
          <h3>For more visible waist direction</h3>
          <p>
            Use a shaped side seam, wrap, panel, belt or controlled tuck. Length alone cannot create a
            waist if the garment remains equally wide from shoulder to hem.
          </p>
          <h3>For less emphasis at the hip or tummy</h3>
          <p>
            Move the hem away from the fullest point, reduce cling, and make sure the fabric falls from
            a stable shoulder or yoke. Longer is not automatically better; a long garment can still
            pull or bunch.
          </p>
          <h3>For stronger lower-body presence</h3>
          <p>
            Use a shorter or cleaner top line with a wider, brighter or more textured bottom. This can
            support an inverted-triangle proportion or simply make the trousers the outfit&apos;s hero.
          </p>
        </section>

        <SeoInsightCard eyebrow="Body shape is secondary" title="Start with the garment outcome">
          <p>
            Instead of asking “What length is allowed for my body type?”, ask whether you want the
            outfit to feel long, waist-directed, fluid, structured or bottom-led. Then choose the hem,
            bottom and fabric that create that effect.
          </p>
        </SeoInsightCard>

        <section id="bottoms">
          <h2>Pair kurti length with bottom width</h2>
          <ul>
            <li><strong>Short + wide:</strong> can look directional when the kurti fits at the shoulder and the trouser falls cleanly.</li>
            <li><strong>Hip length + straight:</strong> an easy workwear formula when the hem and waistband do not compete.</li>
            <li><strong>Knee length + narrow:</strong> creates a clear kurti-led line; check slit height and mobility.</li>
            <li><strong>Knee or calf + wide:</strong> needs intentional volume and enough height in the side slit or shoe line to avoid visual heaviness.</li>
            <li><strong>Ankle length:</strong> check whether the visible bottom, if any, supports rather than interrupts the final line.</li>
          </ul>
          <p>
            Add the dupatta last. A long one-sided drape reinforces vertical direction; a wide
            shoulder drape adds upper-body presence. Neither is universally more flattering.
          </p>
        </section>

        <section id="shopping-check">
          <h2>The kurti fitting-room checklist</h2>
          <ol>
            <li>Does the shoulder seam sit correctly?</li>
            <li>Is the front hem being lifted by bust or tummy fit?</li>
            <li>Does the hem land at an intentional body landmark?</li>
            <li>Can you sit, walk and raise your arms without the kurti riding up?</li>
            <li>Does the side slit begin at a comfortable and useful point?</li>
            <li>Does the bottom width support the kurti rather than compete with it?</li>
            <li>Does the footwear finish the line without avoidable pooling?</li>
          </ol>
          <p>
            Photograph the complete outfit from a consistent distance before altering the length.
            Compare one hem change at a time. Continue with the <Link href="/body-type-styling" className="underline">body-type styling hub</Link> for more proportion guidance.
          </p>
        </section>
      </SeoArticleLayout>
    </>
  );
}
