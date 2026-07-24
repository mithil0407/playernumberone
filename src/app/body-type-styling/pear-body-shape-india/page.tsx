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

const path = "/body-type-styling/pear-body-shape-india";
const title = "Pear Body Shape Styling for Indian Women";
const description =
  "A practical pear-shape guide for kurtas, sarees, salwar suits, trousers and dresses—focused on fit, proportion and personal preference rather than hiding the hips.";
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
    "pear body shape India",
    "pear body type Indian women",
    "how to dress pear body shape India",
    "pear shape kurta saree",
  ],
});

const faqs = [
  {
    q: "Should a pear body shape avoid bright bottoms?",
    a: "No. Bright colour increases emphasis, but that may be exactly what you want. If you prefer a more distributed visual line, repeat the colour near the face or add comparable detail at the neckline.",
  },
  {
    q: "Do palazzo pants suit a pear body shape?",
    a: "They can. Look for a waistband that lies smoothly, enough ease through the hip and a leg that falls cleanly rather than collapsing into excess gathers. The top length and fabric matter as much as the trouser label.",
  },
  {
    q: "What kurta length works for a pear shape?",
    a: "Test hems above or below the fullest hip point rather than ending exactly on it. The best position also depends on torso length, height, bottom width and whether you want to show or soften the hip line.",
  },
  {
    q: "How is pear different from hourglass?",
    a: "Pear usually describes hips that appear wider than the shoulder line. Hourglass describes a more similar shoulder-to-hip width with a visibly narrower waist. Many people sit between descriptions, so use the label only if it improves fit decisions.",
  },
  {
    q: "Can a pear shape wear fitted clothing?",
    a: "Yes. Fitted garments can follow the body beautifully when seams, stretch, closures and hem placement work. The aim is not to disguise the lower body; it is to control the overall line according to your preference.",
  },
];

export default function PearBodyShapeIndiaPage() {
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    articleNode({
      title,
      description,
      path,
      datePublished: published,
      dateModified: modified,
      images: ["/body-type-diagram.webp"],
      about: ["Pear body shape", "Indian fashion", "Proportion styling"],
    }),
    faqPageNode(faqs),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Body Type Styling", path: "/body-type-styling" },
      { name: "Pear Body Shape India", path },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoArticleLayout
        hero={{
          eyebrow: "Silhouette intelligence · Pear",
          title,
          summary:
            "A pear silhouette is a descriptive starting point for proportions with more visible width through the hip than the shoulder line. You can balance that relationship, celebrate it, or ignore the category—the useful part is knowing which garment variable creates each effect.",
          breadcrumbs: [
            { label: "Home", href: "/" },
            { label: "Body Type Styling", href: "/body-type-styling" },
            { label: "Pear Body Shape India" },
          ],
          published: "1 January 2025",
          updated: "24 July 2026",
          reviewer: "Jasmine Rana",
          readingTime: "9 min read",
        }}
        quickAnswer={
          <SeoQuickAnswer
            answer="Start with the shoulder-to-hip relationship, then test neckline width, top hem, waistband fit and lower-body fall one variable at a time."
            detail="You do not need dark bottoms or oversized tops. The aim is a deliberate line, not making the hips disappear."
          />
        }
        tableOfContents={[
          { href: "#definition", label: "What pear shape means" },
          { href: "#indian-wear", label: "Kurtas and salwar suits" },
          { href: "#sarees", label: "Saree and blouse choices" },
          { href: "#western-wear", label: "Trousers, jeans and dresses" },
          { href: "#shopping-check", label: "The fitting-room check" },
        ]}
        afterArticle={
          <>
            <SeoFaqSection faqs={faqs} />
            <SeoAuthorReview>
              <p>
                Jasmine reviews ICONIK&apos;s proportion guidance for Indian, western and fusion
                wardrobes. Body-shape language on ICONIK is descriptive styling shorthand, never a
                health assessment or beauty score.
              </p>
            </SeoAuthorReview>
            <SeoRelatedGuides
              links={[
                {
                  href: "/body-type-styling",
                  title: "Body Type Styling Hub",
                  description: "Understand the complete proportion framework and its limitations.",
                },
                {
                  href: "/style-guides/salwar-kameez-body-type",
                  title: "Salwar Kameez by Body Type",
                  description: "Compare kurta, bottom and dupatta relationships.",
                },
                {
                  href: "/methodology/geometric-silhouette-profiling",
                  title: "Geometric Silhouette Profiling™",
                  description: "Read the canonical explanation of ICONIK's proportion method.",
                },
              ]}
            />
            <SeoBlueprintCta
              title="Turn broad proportion advice into outfit formulas for your wardrobe."
              description="The ICONIK Blueprint combines proportion, colour and face-framing guidance with 20 outfit formulas after a 30-minute consultation."
            />
          </>
        }
      >
        <SeoTeachingVisual
          src="/body-type-diagram.webp"
          alt="Five broad body-proportion patterns including pear, apple, rectangle, hourglass and inverted triangle."
          caption="Shape families are broad visual descriptions. Real bodies often sit between them, and clothing size is a separate variable."
          width={1200}
          height={500}
          priority
        />

        <section id="definition">
          <h2>What a pear body-shape label actually tells you</h2>
          <p>
            The label usually means the hip line appears wider than the shoulder line, often with a
            visible waist. It does not predict height, clothing size, bust, tummy, thigh shape or how
            you prefer clothes to fit.
          </p>
          <p>
            Do not diagnose the category from one circumference or assume that it is unusually common
            in one ethnicity. Compare the whole outfit from the front and side, and pay attention to
            where garments pull, collapse or stop.
          </p>
          <p>
            If you want visual balance, you can add direction near the shoulder, simplify the hip area
            or continue the lower-body line. If you want to emphasise the hip, use fit, colour or detail
            there. Both are valid styling outcomes.
          </p>
        </section>

        <SeoInsightCard eyebrow="One-variable test" title="Balance does not always mean adding shoulder volume">
          <p>
            A clean neckline, a visible collar, earrings, an open layer or a dupatta can create enough
            upper-body presence. Puff sleeves and padded shoulders are options—not requirements.
          </p>
        </SeoInsightCard>

        <section id="indian-wear">
          <h2>Kurtas, salwar suits and Anarkalis</h2>
          <h3>Choose the top hem deliberately</h3>
          <p>
            A hem that stops exactly at the fullest hip can create a strong horizontal marker. If you
            prefer continuity, test a slightly shorter hem or one that falls clearly below that point.
            Pair the length with the bottom width before judging it.
          </p>
          <h3>Control ease through the hip</h3>
          <p>
            A straight kurta needs enough room to fall without pulling or riding up. An A-line kurta
            can follow the shoulder and release through the hip. Neither shape is automatically better;
            the side seam and fabric weight decide whether it hangs cleanly.
          </p>
          <h3>Use the dupatta as a directional layer</h3>
          <p>
            A dupatta across both shoulders creates horizontal presence; a long one-sided drape creates
            vertical direction. Choose the effect that supports the outfit rather than using one drape
            for every pear-shaped body.
          </p>
        </section>

        <section id="sarees">
          <h2>Saree and blouse choices</h2>
          <ul>
            <li><strong>Blouse neckline:</strong> boat, square, V and soft round necklines can all work; evaluate neckline-to-shoulder scale and comfort.</li>
            <li><strong>Sleeve:</strong> use sleeve shape to create or reduce shoulder presence, but do not sacrifice arm movement.</li>
            <li><strong>Pleats:</strong> distribute them evenly and choose fabric that does not create unwanted stiffness at the hip.</li>
            <li><strong>Pallu:</strong> a wider open pallu adds upper-body presence; a narrow vertical pallu creates length.</li>
            <li><strong>Border:</strong> judge border width in relation to your height, drape and blouse—not body-shape label alone.</li>
          </ul>
          <p>
            See the <Link href="/style-guides/saree-draping-body-type" className="underline">saree draping guide</Link> for complete fabric and pleat considerations.
          </p>
        </section>

        <section id="western-wear">
          <h2>Trousers, jeans, skirts and dresses</h2>
          <p>
            Start at the waistband. It should sit without digging, gaping or creating folds that the
            garment was not designed to make. Then compare the leg line:
          </p>
          <ul>
            <li><strong>Straight leg:</strong> gives a clean fall when it has enough room through the hip and thigh.</li>
            <li><strong>Wide leg or palazzo:</strong> continues width into a long line; avoid excessive front gathers if they feel bulky.</li>
            <li><strong>Bootcut or flare:</strong> repeats some width near the hem and can distribute lower-body emphasis.</li>
            <li><strong>Tapered leg:</strong> highlights the difference between hip and ankle; wear it when that is the effect you want.</li>
            <li><strong>A-line skirt:</strong> works when the waistband fits and the fabric releases instead of clinging.</li>
          </ul>
          <p>
            Fitted dresses are not off-limits. Check seam placement, stretch recovery and whether the
            garment follows the body without twisting or pulling.
          </p>
        </section>

        <section id="shopping-check">
          <h2>The pear-shape fitting-room check</h2>
          <ol>
            <li>Does the shoulder seam sit correctly?</li>
            <li>Can you sit and walk without the garment riding up?</li>
            <li>Does the top hem stop intentionally rather than at an accidental widest point?</li>
            <li>Does the waistband lie flat from front and side?</li>
            <li>Does the lower fabric fall, cling or gather—and is that the effect you want?</li>
            <li>Does the whole outfit have one clear focal point?</li>
          </ol>
          <p>
            Photograph the full outfit from a consistent distance. Fit and line are easier to judge
            than when looking down at yourself in a fitting-room mirror.
          </p>
        </section>
      </SeoArticleLayout>
    </>
  );
}
