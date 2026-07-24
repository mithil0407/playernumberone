import type { Metadata } from "next";
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
import { buildMetadata } from "@/lib/seo";
import { FOUNDERS, SITE_URL } from "@/lib/siteFacts";

const path = "/methodology/facial-architecture-analysis";
const canonical = `${SITE_URL}${path}`;

export const metadata: Metadata = buildMetadata({
  title: "Facial Architecture Analysis: ICONIK's Styling Method",
  description:
    "Learn how ICONIK compares face length, forehead, cheekbone and jaw relationships, then tests necklines, eyewear, earrings and hair direction without rigid face-shape rules.",
  path,
  type: "article",
  keywords: [
    "facial architecture analysis",
    "face shape analysis India",
    "neckline for face shape",
    "eyewear for face shape",
    "hairstyle face shape analysis",
  ],
  image: {
    path: "/images/seo/facial-architecture-analysis-hero-iconik-og.webp",
    width: 1200,
    height: 630,
    alt: "Facial architecture analysis showing forehead, cheekbone, jaw and length relationships",
  },
  publishedTime: "2025-01-01",
  modifiedTime: "2026-07-24",
  authors: ["/about#founder"],
});

const faqs = [
  {
    q: "Is Facial Architecture Analysis a medical or scientific diagnosis?",
    a: "No. It is ICONIK's proprietary visual styling framework. It compares visible proportions and tests how clothing and accessories frame the face. It does not assess health, attractiveness, facial symmetry, or any medical condition.",
  },
  {
    q: "Does everyone fit one of seven face shapes?",
    a: "Not neatly. Oval, round, square, rectangle, heart, diamond, and oblong are useful descriptive starting points, not biological categories. Many people sit between families, and hairstyle, camera angle, expression, age, and weight distribution can change what appears dominant.",
  },
  {
    q: "How should face measurements be taken?",
    a: "Use a front-facing image in even daylight with the camera at eye level, hair moved away from the outer face, a relaxed expression, and minimal lens distortion. Compare face length with the widest forehead, cheekbone, and jaw areas. The relationships matter more than exact millimetres.",
  },
  {
    q: "Can Facial Architecture Analysis help choose glasses?",
    a: "It can create a useful shortlist based on frame width, brow relationship, bridge position, lens depth, and whether a frame echoes or balances the face. Comfort, prescription, pupillary distance, and optician fit remain essential and override styling preference.",
  },
  {
    q: "Does the method work for Indian wear?",
    a: "Yes. The same framing logic applies to kurta and blouse necklines, saree drapes, dupatta placement, collars, earrings, bindis, and jewellery scale. Recommendations should still account for bust, shoulder, modesty, occasion, and garment construction.",
  },
  {
    q: "Can I identify my face shape from a selfie?",
    a: "A selfie can be misleading because a close wide-angle lens changes the apparent forehead, nose, jaw, and face length. Use a camera farther away at eye level or ask someone to take the photograph. Repeat the observation rather than treating one image as a definitive result.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": `${canonical}#article`,
      headline: "Facial Architecture Analysis: ICONIK's Face-Framing Styling Method",
      description:
        "How ICONIK compares visible facial proportions and translates them into neckline, eyewear, earring and hairstyle direction.",
      author: {
        "@type": "Person",
        name: FOUNDERS[0].name,
        jobTitle: FOUNDERS[0].title,
        sameAs: FOUNDERS[0].linkedIn,
      },
      publisher: { "@type": "Organization", name: "ICONIK LLP", url: SITE_URL },
      datePublished: "2025-01-01",
      dateModified: "2026-07-24",
      mainEntityOfPage: canonical,
      about: [
        "face proportions",
        "neckline selection",
        "eyewear styling",
        "earring selection",
        "hairstyle direction",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Methodology", item: `${SITE_URL}/methodology` },
        { "@type": "ListItem", position: 3, name: "Facial Architecture Analysis", item: canonical },
      ],
    },
  ],
};

export default function FacialArchitectureAnalysisPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoArticleLayout
        hero={{
          eyebrow: "ICONIK Methodology · Facial Framing",
          title: "Facial Architecture Analysis: Measure Relationships, Then Test the Frame",
          summary:
            "ICONIK's proprietary styling framework compares visible face proportions, then tests how necklines, collars, eyewear, earrings and hair direction echo or balance them. It is a wardrobe tool—not a medical diagnosis or attractiveness score.",
          breadcrumbs: [
            { href: "/", label: "Home" },
            { href: "/methodology", label: "Methodology" },
            { label: "Facial Architecture Analysis" },
          ],
          published: "1 January 2025",
          updated: "24 July 2026",
          reviewer: `${FOUNDERS[0].name}, ${FOUNDERS[0].title}`,
          readingTime: "12 minute read",
        }}
        quickAnswer={
          <>
            <SeoQuickAnswer
              answer={
                <>
                  Facial Architecture Analysis begins with four relationships: face length,
                  forehead width, cheekbone width, and jaw width or direction. It then treats every
                  neckline, frame, earring, and hairstyle as a second shape placed around the face.
                </>
              }
              detail={
                <>
                  The goal is not to “correct” a face. It is to decide where you want to create
                  length, width, softness, definition, or repetition—and to test that effect in the
                  complete outfit.
                </>
              }
            />
            <SeoTeachingVisual
              src="/images/seo/facial-architecture-analysis-hero-iconik.webp"
              alt="South Asian woman's face with subtle forehead, cheekbone, jaw and length guides beside neckline, eyewear and hair framing elements."
              caption="Facial architecture describes relationships; styling decides whether to echo, balance, soften, or emphasise them."
              width={1672}
              height={941}
              priority
            />
          </>
        }
        tableOfContents={[
          { href: "#what-it-is", label: "What the method is" },
          { href: "#measure", label: "How to observe proportions" },
          { href: "#shape-families", label: "Use shape families carefully" },
          { href: "#necklines", label: "Test neckline framing" },
          { href: "#eyewear-earrings", label: "Choose eyewear and earrings" },
          { href: "#hair", label: "Place hair volume and direction" },
          { href: "#full-blueprint", label: "Connect the full Blueprint" },
        ]}
        afterArticle={
          <>
            <SeoFaqSection faqs={faqs} />
            <SeoAuthorReview>
              Jasmine reviews the application of facial framing to Indian and western clothing.
              ICONIK uses this as a proprietary styling framework and does not present it as a
              clinical, biometric, or attractiveness assessment.
            </SeoAuthorReview>
            <SeoRelatedGuides
              links={[
                {
                  href: "/faq/neckline-guide-face-shape-india",
                  title: "Neckline Guide by Face Shape",
                  description: "Compare Indian and western neckline families in more detail.",
                },
                {
                  href: "/methodology/geometric-silhouette-profiling",
                  title: "Geometric Silhouette Profiling",
                  description: "Connect face-level framing with shoulder and body proportions.",
                },
                {
                  href: "/methodology/chromatic-harmony-mapping",
                  title: "Chromatic Harmony Mapping",
                  description: "Add colour temperature, depth, and contrast to the frame.",
                },
              ]}
            />
            <SeoBlueprintCta
              title="Build the frame around your face, wardrobe, and real life."
              description="The ICONIK Blueprint combines facial framing with colour, silhouette, hairstyle, eyewear, and 20 complete outfit formulas."
            />
          </>
        }
      >
        <section id="what-it-is">
          <p className="seo-eyebrow">Scope and limits</p>
          <h2>What Facial Architecture Analysis Is—and What It Is Not</h2>
          <p>
            Facial Architecture Analysis is ICONIK&apos;s name for a face-framing styling process.
            It describes the visible relationship between the forehead, cheekbones, jaw, chin, and
            overall face length. Those relationships are then considered beside the shapes closest
            to the face: neckline, collar, glasses, earrings, hair outline, and sometimes a bindi,
            dupatta, or saree pallu.
          </p>
          <p>
            It is not a claim that facial geometry determines beauty, personality, health, age, or
            one objectively correct hairstyle. It also does not replace an optician for eyewear fit
            or a hairstylist who can assess texture, density, growth pattern, and maintenance.
          </p>
          <SeoInsightCard
            eyebrow="The central idea"
            title="Every styling choice creates a second frame"
            tone="bone"
          >
            <p>
              A deep V introduces a vertical point. A boat neck introduces width. A curved frame
              repeats softness. An angular frame adds definition. None is universally “best”; each
              changes which direction the eye follows.
            </p>
          </SeoInsightCard>
        </section>

        <section id="measure">
          <p className="seo-eyebrow">Stage 01 · Observation</p>
          <h2>How to Observe Facial Proportions Without Distorting Them</h2>
          <p>
            Use a front-facing photograph taken from farther away at approximately eye level. Move
            the hair away from the outer face, keep the expression relaxed, and use even daylight.
            Avoid a close phone selfie: wide-angle perspective can enlarge the centre of the face
            and change the apparent jaw and forehead relationship.
          </p>
          <SeoTeachingVisual
            src="/images/seo/facial-architecture-measurement-guide-iconik.webp"
            alt="Front-facing South Asian woman with guides for face length, forehead width, cheekbone width and jaw width."
            caption="Compare four relationships under neutral conditions; exact millimetres matter less than which dimensions are similar or dominant."
            width={1122}
            height={1402}
          />
          <ol>
            <li>
              <strong>Face length:</strong> compare the hairline-to-chin distance with the widest
              horizontal area.
            </li>
            <li>
              <strong>Forehead:</strong> observe its visible width and whether it narrows or remains
              straight toward the temples.
            </li>
            <li>
              <strong>Cheekbones:</strong> note whether they form the widest point and how strongly
              the face tapers above and below.
            </li>
            <li>
              <strong>Jaw:</strong> observe width, corner definition, curve, and the direction toward
              the chin.
            </li>
          </ol>
          <p>
            Repeat the observation in two images. Hairline visibility, expression, lighting, and
            camera distance can change a first impression. The repeated relationship is more useful
            than forcing a label from one photo.
          </p>
        </section>

        <section id="shape-families">
          <p className="seo-eyebrow">Stage 02 · Description</p>
          <h2>Use Face-Shape Families as Shortcuts, Not Final Answers</h2>
          <p>
            Oval, round, square, rectangle, heart, diamond, and oblong are common descriptive
            families. They help name a dominant relationship, but they are not fixed biological
            types. “Round-square,” “oval-heart,” or another hybrid description may be more accurate
            than choosing one rigid category.
          </p>
          <SeoTeachingVisual
            src="/images/seo/facial-architecture-shape-families-iconik.webp"
            alt="Seven simplified face-shape families arranged as a spectrum with hybrid transitions rather than isolated boxes."
            caption="Shape labels are navigation aids. The useful information is which areas repeat in width, where taper begins, and whether length or width dominates."
            width={1672}
            height={941}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Length dominant", "Longer face with varying amounts of width through forehead, cheeks, and jaw."],
              ["Width dominant", "Length and width appear closer, with either curved or angular outer lines."],
              ["Upper width dominant", "Forehead or temple area leads, then the face tapers toward the chin."],
              ["Cheekbone dominant", "The mid-face is widest, with visible taper toward forehead and jaw."],
              ["Jaw dominant", "Lower-face width or angle carries more visual weight than the upper face."],
              ["Balanced distribution", "No single zone strongly dominates; detail and styling intent matter more."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-[#2c2622]/10 bg-[#f7f3ed] p-5">
                <h3 className="!m-0 !text-xl">{title}</h3>
                <p className="!mt-2 !text-sm">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="necklines">
          <p className="seo-eyebrow">Stage 03 · Garment framing</p>
          <h2>Test Necklines as Directional Shapes Around the Face</h2>
          <p>
            A neckline affects more than face shape. It also interacts with neck length, shoulder
            width, bust, garment structure, jewellery, modesty, and occasion. That is why a list
            saying “round face equals V-neck” is incomplete.
          </p>
          <SeoTeachingVisual
            src="/images/seo/facial-architecture-neckline-framing-iconik.webp"
            alt="Same South Asian woman shown with V, boat, square and soft round necklines to compare vertical, horizontal, angular and curved framing."
            caption="Change one neckline at a time: vertical, horizontal, angular, and curved openings create different face-to-shoulder relationships."
            width={1003}
            height={1568}
          />
          <ul>
            <li>
              <strong>V and open notches:</strong> add a downward direction and reveal more vertical
              space through the neck and chest.
            </li>
            <li>
              <strong>Boat and wide square necks:</strong> create width across the collarbone and can
              connect the face more strongly to the shoulder line.
            </li>
            <li>
              <strong>Soft round and sweetheart shapes:</strong> repeat curvature and can soften a
              very angular garment or jaw relationship.
            </li>
            <li>
              <strong>High collars and closed necks:</strong> reduce visible neck space and place
              more emphasis near the jaw; fabric stiffness changes the result.
            </li>
          </ul>
          <h3>The four-photo neckline test</h3>
          <p>
            Hold four plain fabrics or garments at the same height: V, open round, square, and wide
            horizontal. Keep hair, earrings, expression, and camera unchanged. Compare whether your
            priority—length, width, softness, authority, or modest coverage—is being created without
            causing another part of the outfit to feel disconnected.
          </p>
        </section>

        <section id="eyewear-earrings">
          <p className="seo-eyebrow">Stage 04 · Accessory geometry</p>
          <h2>Choose Eyewear and Earrings by Scale, Position, and Direction</h2>
          <p>
            “Opposite your face shape” is too simple for glasses. A frame must align with the brow,
            sit comfortably on the bridge, fit the temple width, keep the eyes well positioned in
            the lenses, and work with the prescription. Styling comes after physical fit.
          </p>
          <SeoTeachingVisual
            src="/images/seo/facial-architecture-eyewear-earrings-iconik.webp"
            alt="South Asian woman with eyewear and earring comparisons showing echo versus balance, frame width, bridge and vertical drop."
            caption="A useful accessory either echoes a facial line or deliberately balances it—while remaining correctly scaled and physically comfortable."
            width={1672}
            height={941}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <SeoInsightCard title="Eyewear checklist" tone="bone">
              <ul>
                <li>Frame width relates to the widest facial area.</li>
                <li>Top line works with the natural brow.</li>
                <li>Bridge does not slide, pinch, or obscure the eyes.</li>
                <li>Lens depth adds the amount of length or width intended.</li>
              </ul>
            </SeoInsightCard>
            <SeoInsightCard title="Earring checklist" tone="slate">
              <ul>
                <li>Length finishes above, at, or below the jaw intentionally.</li>
                <li>Shape echoes or contrasts the jaw direction.</li>
                <li>Scale works with hair volume and neckline opening.</li>
                <li>Weight remains wearable for the required hours.</li>
              </ul>
            </SeoInsightCard>
          </div>
        </section>

        <section id="hair">
          <p className="seo-eyebrow">Stage 05 · Hair architecture</p>
          <h2>Place Hair Volume Where It Supports the Intended Frame</h2>
          <p>
            Hair changes the visible outline of the head and face more than most accessories.
            Crown volume adds vertical emphasis; cheek or jaw-level volume adds width; a centre part
            creates symmetry; an off-centre part introduces direction. Face-framing layers can
            reveal or partially interrupt the cheekbone and jaw.
          </p>
          <SeoTeachingVisual
            src="/images/seo/facial-architecture-hair-direction-iconik.webp"
            alt="South Asian woman with crown, temple, cheek and jaw volume zones showing how hair placement changes the visible face outline."
            caption="Hair advice should map direction and volume zones, then be adapted by a hairstylist to texture, density, growth pattern, and maintenance."
            width={1122}
            height={1402}
          />
          <p>
            ICONIK&apos;s useful role is to describe the visual objective: more height, more side
            width, a cleaner jaw reveal, softer forehead framing, or controlled asymmetry. A
            hairstylist should then translate that objective into a cut or style that suits your
            curl pattern, density, hairline, lifestyle, and willingness to style it.
          </p>
        </section>

        <section id="full-blueprint">
          <p className="seo-eyebrow">The complete system</p>
          <h2>Facial Framing Must Agree With the Rest of the Outfit</h2>
          <p>
            A neckline can lengthen the face but still be wrong for the bust, shoulder, dress code,
            or modesty preference. A perfect colour can still lose impact if the glasses, earrings,
            neckline, print, and lip colour all compete near the face. The final decision needs
            hierarchy.
          </p>
          <SeoTeachingVisual
            src="/images/seo/facial-architecture-blueprint-checklist-iconik.webp"
            alt="Saveable facial architecture checklist connecting neckline, eyewear, earrings, hair, colour and garment silhouette."
            caption="Before finalising the frame, check direction, scale, colour, comfort, hierarchy, and how the face-level choices connect to the whole silhouette."
            width={1024}
            height={1536}
          />
          <ol>
            <li><strong>Choose the dominant direction:</strong> vertical, horizontal, curved, angular, or asymmetric.</li>
            <li><strong>Choose one hero:</strong> neckline, glasses, earrings, hair, or colour—not all five.</li>
            <li><strong>Check scale:</strong> relate accessory and print size to face, hair, shoulder, and garment scale.</li>
            <li><strong>Check colour:</strong> make metal, frame, hair, neckline, and lip colour support one palette.</li>
            <li><strong>Check comfort and context:</strong> prescription, earring weight, maintenance, modesty, and dress code override theory.</li>
            <li><strong>Photograph the whole outfit:</strong> a face crop cannot reveal whether the frame connects to the body.</li>
          </ol>
          <p className="text-sm">
            Cite this guide: Rana, Jasmine. “Facial Architecture Analysis: ICONIK&apos;s
            Face-Framing Styling Method.” ICONIK LLP. Updated 24 July 2026.
          </p>
        </section>
      </SeoArticleLayout>
    </>
  );
}
