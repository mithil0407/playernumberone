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

const path = "/style-guides/capsule-wardrobe-india";
const title = "Capsule Wardrobe for Indian Women: A Practical System";
const description =
  "Build an Indian capsule wardrobe around your actual calendar, climate and laundry cycle, with ethnic and western pieces that mix across work, everyday and occasion dressing.";
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
    "capsule wardrobe India",
    "capsule wardrobe Indian women",
    "Indian western capsule wardrobe",
    "minimal wardrobe India",
  ],
  image: {
    path: "/images/seo/capsule-wardrobe-logic-iconik.webp",
    width: 1003,
    height: 1568,
    alt: "Indian capsule wardrobe combining kurtas, a saree, shirts, trousers, shoes and accessories.",
  },
});

const faqs = [
  {
    q: "How many pieces should an Indian capsule wardrobe contain?",
    a: "There is no universal number. A useful small capsule often begins around 12–18 clothing pieces, excluding underwear, exercise wear and highly specialised occasion garments. Your work pattern, climate, laundry cycle and ethnic-wear needs should decide the final count.",
  },
  {
    q: "Should sarees and occasion wear be inside the capsule?",
    a: "Include any saree or occasion garment you wear often enough to coordinate with the rest. Rare bridal or ceremonial pieces can sit in a separate occasion archive without making the everyday capsule less valid.",
  },
  {
    q: "Does every piece have to match every other piece?",
    a: "No. Aim for useful connection, not mathematical perfection. Each core garment should ideally work in at least three complete outfits, while accent and occasion pieces can have a narrower role.",
  },
  {
    q: "Can a capsule wardrobe include prints and bright colours?",
    a: "Yes. Use one or two lead prints and repeat colours from them across solids, bags, footwear or dupattas. A capsule becomes difficult when several unrelated prints and accents each require their own supporting wardrobe.",
  },
  {
    q: "Should I buy a new wardrobe to build a capsule?",
    a: "No. Start with an audit of what already fits, functions and gets worn. Build ten complete outfits before buying anything; the missing links will become much clearer.",
  },
];

const calendarQuestions = [
  "How many days each week require office, uniform or client-facing clothing?",
  "How often do you wear kurtas, sarees or fusion outfits in ordinary life?",
  "How much heat, humidity, rain or air-conditioning must the clothes handle?",
  "How often can you realistically wash, steam, iron or dry-clean garments?",
  "Which social, religious or family occasions recur often enough to plan for?",
];

export default function CapsuleWardrobeIndiaPage() {
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    articleNode({
      title,
      description,
      path,
      datePublished: published,
      dateModified: modified,
      images: ["/images/seo/capsule-wardrobe-logic-iconik.webp"],
      about: ["Capsule wardrobe", "Indian fashion", "Wardrobe planning"],
    }),
    faqPageNode(faqs),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Style Guides", path: "/style-guides" },
      { name: "Capsule Wardrobe India", path },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoArticleLayout
        hero={{
          eyebrow: "Wardrobe systems · India",
          title,
          summary:
            "A capsule wardrobe is not a beige uniform or a fixed list copied from someone else's climate. It is a small, connected set of clothes that covers your real calendar with fewer dead-end purchases.",
          breadcrumbs: [
            { label: "Home", href: "/" },
            { label: "Style Guides", href: "/style-guides" },
            { label: "Capsule Wardrobe India" },
          ],
          published: "1 January 2025",
          updated: "24 July 2026",
          reviewer: "Jasmine Rana",
          readingTime: "11 min read",
        }}
        quickAnswer={
          <SeoQuickAnswer
            answer="Audit your calendar first, keep the pieces that already work, then build a core of repeatable shapes and colours around the gaps."
            detail="Indian and western clothing belong in the same system when you wear both. A separate ceremonial archive can hold rare wedding or traditional pieces."
          />
        }
        tableOfContents={[
          { href: "#definition", label: "What a capsule is" },
          { href: "#calendar", label: "Start with your calendar" },
          { href: "#three-layers", label: "Core, accent and occasion" },
          { href: "#build", label: "Build the first capsule" },
          { href: "#outfit-test", label: "Run the outfit test" },
          { href: "#shopping-rules", label: "Shop only the gaps" },
        ]}
        afterArticle={
          <>
            <SeoFaqSection faqs={faqs} />
            <SeoAuthorReview>
              <p>
                Jasmine reviews ICONIK&apos;s wardrobe systems for Indian, western and fusion dressing.
                The goal is not owning the fewest clothes; it is reducing pieces that do not serve the
                client&apos;s real life.
              </p>
            </SeoAuthorReview>
            <SeoRelatedGuides
              links={[
                {
                  href: "/style-guides/office-wear-indian-women",
                  title: "Office Wear for Indian Women",
                  description: "Build repeatable professional outfit formulas.",
                },
                {
                  href: "/faq/capsule-wardrobe-how-many-outfits",
                  title: "How Many Outfits Can a Capsule Make?",
                  description: "Use outfit coverage rather than an arbitrary garment count.",
                },
                {
                  href: "/colour-analysis",
                  title: "Colour Analysis for Indian Skin",
                  description: "Choose useful neutrals and accents without banning colours.",
                },
              ]}
            />
            <SeoBlueprintCta
              title="Want a wardrobe system translated into complete outfits?"
              description="The ICONIK Blueprint combines your lifestyle with proportion, colour and face-framing guidance to create 20 outfit formulas."
            />
          </>
        }
      >
        <SeoTeachingVisual
          src="/images/seo/capsule-wardrobe-logic-iconik.webp"
          alt="Indian capsule wardrobe combining kurtas, a saree, dupatta, shirts, trousers, shoes and accessories into core, accent and occasion outfits."
          caption="A useful capsule connects Indian and western pieces across real contexts instead of forcing every garment into one aesthetic."
          width={1003}
          height={1568}
          priority
        />

        <section id="definition">
          <h2>What an Indian capsule wardrobe should do</h2>
          <p>
            A capsule is a deliberately limited set of garments that produces enough complete outfits
            for a defined period or context. The important words are <em>complete outfits</em>. Fifteen
            attractive pieces are not a capsule if five require different shoes, bras, tailoring or
            layers that you do not own.
          </p>
          <p>
            Your capsule can include kurtas, sarees, trousers, shirts, dresses, dupattas and fusion
            layers. It does not need to look minimalist. It only needs a clear internal logic.
          </p>
        </section>

        <section id="calendar">
          <h2>Start with the calendar—not the shopping list</h2>
          <p>Answer these questions using the last four ordinary weeks:</p>
          <ul>
            {calendarQuestions.map((question) => <li key={question}>{question}</li>)}
          </ul>
          <p>
            Convert the answers into outfit demand. Someone in a five-day corporate role may need eight
            to ten work formulas in rotation. Someone working from home with frequent family events may
            need fewer work pieces and more polished Indian separates.
          </p>
        </section>

        <SeoInsightCard eyebrow="A better count" title="Count outfit coverage before garment quantity">
          <p>
            Choose a two-week period. If your small wardrobe can cover every recurring situation in
            that period with realistic laundry, it is large enough. Add pieces only when a repeated
            context is genuinely uncovered.
          </p>
        </SeoInsightCard>

        <section id="three-layers">
          <h2>Build three layers: core, accent and occasion</h2>
          <h3>Core</h3>
          <p>
            These are the repeatable shapes and neutrals that support several outfits: trousers,
            everyday kurtas, shirts, a useful layer, and practical footwear. Core does not have to mean
            black or beige; navy, olive, chocolate, charcoal or deep teal can function as neutrals.
          </p>
          <h3>Accent</h3>
          <p>
            Accent pieces create identity: a printed dupatta, bright blouse, textured layer, jewellery
            or a lead colour. Repeat part of the accent elsewhere so it connects instead of becoming a
            one-outfit purchase.
          </p>
          <h3>Occasion</h3>
          <p>
            Include frequently worn sarees, festive sets or formal pieces if they share blouses,
            jewellery, bags or footwear with the rest of the wardrobe. Store rare ceremonial garments
            separately and document what each one still needs.
          </p>
        </section>

        <section id="build">
          <h2>Build your first 12–18 piece capsule</h2>
          <p>
            Use the range as a starting point, not a target. Exclude underwear, sleepwear, workout
            clothing and highly specialised ceremonial garments.
          </p>
          <ol>
            <li><strong>Keep two to four lower garments</strong> that fit now and cover your main contexts.</li>
            <li><strong>Add five to seven tops or kurtas</strong> that work with at least two of those bottoms.</li>
            <li><strong>Add one or two layers</strong> for office air-conditioning, weather and outfit polish.</li>
            <li><strong>Add one Indian occasion route</strong> such as a saree plus reusable blouse or a coordinated kurta set.</li>
            <li><strong>Add two footwear routes</strong> that cover the majority of hemlines and walking needs.</li>
            <li><strong>Add accessories last</strong> to connect colour and change formality.</li>
          </ol>
          <p>
            The exact distribution should follow the calendar. Do not add a blazer because capsule
            lists always include one if your work and climate never require it.
          </p>
        </section>

        <section id="outfit-test">
          <h2>Run the ten-outfit test</h2>
          <p>
            Before buying anything, create ten complete outfits from the proposed capsule. Include
            underwear requirements, shoes, bag, jewellery, layer and weather needs.
          </p>
          <ul>
            <li>Photograph each outfit from the same distance.</li>
            <li>Record the context it covers.</li>
            <li>Mark pieces that appear in at least three successful outfits.</li>
            <li>Mark pieces that create repeated fit or care problems.</li>
            <li>Identify the smallest number of missing links.</li>
          </ul>
          <p>
            A garment that works once may still deserve a place if that one context matters. The goal
            is not maximum combinations at the expense of identity.
          </p>
        </section>

        <section id="shopping-rules">
          <h2>Shop only the gaps</h2>
          <p>For every proposed purchase, complete this sentence:</p>
          <blockquote>
            This piece completes these three outfits for these two real contexts, and I already own the
            required shoes, layer and care routine.
          </blockquote>
          <p>
            If you cannot complete it, save the item instead of buying it immediately. Check fit,
            alterations, fabric care, climate, sheerness, underwear requirements and return policy.
          </p>
          <p>
            Use the <Link href="/colour-analysis" className="underline">colour-analysis hub</Link> to
            choose a connected palette and the <Link href="/body-type-styling" className="underline">proportion hub</Link> to test garment shapes without turning them into rigid body rules.
          </p>
        </section>
      </SeoArticleLayout>
    </>
  );
}
