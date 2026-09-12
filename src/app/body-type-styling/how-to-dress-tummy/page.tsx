import type { Metadata } from "next";
import Link from "next/link";
import InstagramReelsForArticle from "@/components/seo/InstagramReelsForArticle";
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
import { BLUEPRINT_OFFER, FOUNDERS } from "@/lib/siteFacts";

const path = "/body-type-styling/how-to-dress-tummy";

export const metadata: Metadata = buildArticleMetadata({
  title: "How to Dress If You Have a Tummy: Fit & Proportion Guide",
  description:
    "A practical Indian styling guide for a fuller tummy: choose waist placement, top length, fabric, trousers, kurtas, sarees and occasion wear by proportion—not rigid hiding rules.",
  path,
  datePublished: "2025-01-01",
  dateModified: "2026-07-24",
  authorPath: "/about#jasmine-rana",
  image: {
    path: "/images/seo/tummy-fit-vertical-system-iconik-og.webp",
    width: 1200,
    height: 630,
    alt: "Same fuller-bodied Indian woman showing how a hard waist stop and a clean vertical garment fall change outfit balance.",
  },
  keywords: [
    "how to dress if you have a tummy India",
    "clothes for fuller tummy Indian women",
    "kurta for tummy",
    "palazzo pants for heavy tummy",
    "tummy styling tips India",
  ],
});

const faqs = [
  {
    q: "Do I need to wear dark colours around my tummy?",
    a: "No. Dark colours can reduce contrast, but fit, fabric behaviour and where the garment starts and stops usually matter more. A well-cut garment in a brighter colour can work better than a black garment that pulls, clings or ends at an awkward point.",
  },
  {
    q: "Are high-rise trousers always best for a fuller tummy?",
    a: "No rise works for everyone. Test whether the waistband sits securely without rolling, digging in or creating excess fabric below the waist. A comfortable mid-to-high rise often gives a cleaner base, but the exact position depends on torso length and where you carry volume.",
  },
  {
    q: "What kurta length works best?",
    a: "Use body landmarks rather than a universal number. Compare hems above the fullest part of the stomach, around the upper thigh and below the hip. Keep the version that lets the kurta fall cleanly and works with the width of your chosen bottom.",
  },
  {
    q: "Can shapewear improve the fit?",
    a: "It can change the surface under a garment for a specific occasion, but it should never be required for an outfit to fit. Prioritise comfort, breathing and movement, and choose clothes that work with the body you have without compression.",
  },
];

const related = [
  {
    href: "/body-type-styling/apple-body-shape-india",
    title: "Apple Body Shape Guide",
    description: "Understand when midsection volume is part of a broader apple-shaped silhouette.",
  },
  {
    href: "/body-type-styling/how-to-look-taller-clothing",
    title: "How to Look Taller",
    description: "Use rise, hem placement and uninterrupted lines to manage overall proportion.",
  },
  {
    href: "/style-guides/kurti-length-guide",
    title: "Kurti Length Guide",
    description: "Choose a hem using body landmarks, bottom width and the complete outfit line.",
  },
];

export default function HowToDressTummyPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "How to Dress If You Have a Tummy: Fit & Proportion Guide",
        description:
          "A practical guide to dressing a fuller tummy using garment fit, fabric behaviour, waist placement and complete-outfit proportion.",
        author: {
          "@type": "Person",
          name: FOUNDERS[0].name,
          jobTitle: FOUNDERS[0].title,
          sameAs: FOUNDERS[0].linkedIn,
        },
        reviewedBy: {
          "@type": "Person",
          name: FOUNDERS[0].name,
          jobTitle: FOUNDERS[0].title,
          sameAs: FOUNDERS[0].linkedIn,
        },
        publisher: {
          "@type": "Organization",
          name: "ICONIK LLP",
          url: "https://www.iconik.pro",
        },
        datePublished: "2025-01-01",
        dateModified: "2026-07-24",
        image: `https://www.iconik.pro/images/seo/tummy-fit-vertical-system-iconik.webp`,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://www.iconik.pro${path}`,
        },
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
          { "@type": "ListItem", position: 1, name: "Home", item: "https://www.iconik.pro" },
          {
            "@type": "ListItem",
            position: 2,
            name: "Body Type Styling",
            item: "https://www.iconik.pro/body-type-styling",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "How to Dress a Fuller Tummy",
            item: `https://www.iconik.pro${path}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoArticleLayout
        hero={{
          eyebrow: "Silhouette intelligence · Midsection",
          title: "How to Dress If You Have a Tummy",
          summary:
            "The aim is not to disguise your body. It is to prevent the outfit from gripping, cutting across or stopping at the midsection when you would prefer a cleaner line.",
          breadcrumbs: [
            { href: "/", label: "Home" },
            { href: "/body-type-styling", label: "Body Type Styling" },
            { label: "Dressing a Fuller Tummy" },
          ],
          published: "1 January 2025",
          updated: "24 July 2026",
          reviewer: "Jasmine Rana, Co-Founder and Head Stylist",
          readingTime: "10 minute read",
        }}
        quickAnswer={
          <>
            <SeoQuickAnswer
              answer="Build the outfit around three checks: where the fabric grips, where the eye stops, and whether the line continues above and below the waist."
              detail="A soft neckline, a clean shoulder, controlled ease through the stomach and a bottom that falls vertically will usually do more than simply choosing a loose top or dark colour."
            />
            <SeoTeachingVisual
              src="/images/seo/tummy-fit-vertical-system-iconik.webp"
              alt="Same fuller-bodied Indian woman in two outfits showing a hard midsection stop versus a soft top and full-length trouser line."
              caption="The body does not change. Moving the garment endpoint and continuing the trouser line changes where the eye stops."
              width={1024}
              height={1536}
              priority
            />
          </>
        }
        tableOfContents={[
          { href: "#start-with-fit", label: "Start with fit" },
          { href: "#top-length", label: "Choose the top length" },
          { href: "#trousers", label: "Balance trousers and palazzos" },
          { href: "#indian-wear", label: "Build Indian-wear formulas" },
          { href: "#fabric", label: "Test fabric behaviour" },
          { href: "#colour-print", label: "Use colour and print" },
        ]}
        afterArticle={
          <>
            <InstagramReelsForArticle articlePath={path} />
            <SeoFaqSection faqs={faqs} />
            <SeoAuthorReview>
              This guide treats body-shape language as descriptive styling shorthand—not a
              diagnosis or a rule about what anyone must hide. Test recommendations in motion and
              keep only the ones that support your comfort and intended silhouette.
            </SeoAuthorReview>
            <SeoRelatedGuides links={related} />
            <SeoBlueprintCta
              title="Turn proportion advice into outfits built for your body."
              description={`The ICONIK Blueprint includes ${BLUEPRINT_OFFER.outfitFormulas} outfit formulas, colour, hairstyle and eyewear guidance, reviewed with you in a ${BLUEPRINT_OFFER.consultationMinutes}-minute consultation.`}
              href={BLUEPRINT_OFFER.offerPath}
              label={`Get My Blueprint — ₹${BLUEPRINT_OFFER.currentPriceInr.toLocaleString("en-IN")}`}
            />
          </>
        }
      >
        <section id="start-with-fit">
          <h2>Start with fit—not a promise to “hide” the stomach</h2>
          <p>
            Midsection volume can sit high under the bust, around the natural waist, lower on the
            abdomen, or across several areas. The same garment will behave differently in each
            case. Begin by checking the garment from the front and side while standing, sitting
            and reaching.
          </p>
          <ul>
            <li>Does the fabric pull into horizontal lines across the stomach?</li>
            <li>Does the hem kick forward instead of falling toward the floor?</li>
            <li>Does a waistband roll, dig in or slide down during movement?</li>
            <li>Does the garment fit the stomach but become excessively loose elsewhere?</li>
          </ul>
          <p>
            These are fit observations, not body flaws. Altering the rise, fabric, dart placement,
            side seam or top length may solve the problem without changing the overall size.
          </p>
          <SeoInsightCard
            eyebrow="Fitting-room test"
            title="Photograph the side view before judging the front"
          >
            <p>
              The side view reveals whether a top hangs from the bust, follows the stomach or falls
              vertically. Compare garments from the same camera position so the fabric—not the
              angle—is the variable.
            </p>
          </SeoInsightCard>
        </section>

        <section id="top-length">
          <h2>Choose the top length by where the eye stops</h2>
          <p>
            A hem creates a horizontal ending. If it finishes at the point where the garment is
            already projecting or pulling, the eye notices both the hem and the tension together.
            Moving the hem a little higher or lower can produce a calmer result.
          </p>
          <p>
            Test three landmarks: just below the waistband, upper thigh, and below the fullest part
            of the hip. The best option is the one that hangs cleanly with your chosen bottom. A
            longer top is not automatically better; it can shorten the visible leg or add fabric
            where you do not want it.
          </p>
          <p>
            Necklines also influence the route of attention. An open, soft V, scoop, split neck or
            controlled collar can frame the face and keep the upper body visually intentional.
            Choose by face framing and comfort rather than a rule that one neckline “slims.”
          </p>
        </section>

        <section id="trousers">
          <h2>Palazzos work only when the top and waistband cooperate</h2>
          <p>
            A wide trouser can create a long lower-body line, but it cannot compensate for a top
            that grips the stomach or ends at the point of greatest tension. Judge the top, rise
            and trouser width as one system.
          </p>
          <ul>
            <li>
              Look for a waistband that stays level and secure without requiring a very tight tuck.
            </li>
            <li>
              Let the trouser fall from the hip instead of widening abruptly from a bulky waistband.
            </li>
            <li>
              Use full length when practical so the vertical line reaches the shoe.
            </li>
            <li>
              Pair volume below with a top that has controlled ease—not cling and not excess bulk.
            </li>
          </ul>
          <p>
            Straight-leg and soft bootcut trousers can provide the same balancing effect with less
            volume. The useful cut is the one that works with your torso, footwear and daily
            movement.
          </p>
        </section>

        <section id="indian-wear">
          <h2>Indian wear: coordinate the yoke, flare, slit and drape</h2>
          <h3>Straight and softly shaped kurtas</h3>
          <p>
            Look for enough room through the stomach for the front to hang without catching. A
            vertical seam, placket or open neckline can support direction, while side slits should
            begin where they allow the fabric to move rather than pull.
          </p>
          <h3>A-line and Anarkali shapes</h3>
          <p>
            These can work when the yoke ends at a comfortable point and the flare begins without
            gathering heavily over the stomach. Compare a low-volume A-line with a gathered
            Anarkali; more flare does not automatically create a cleaner silhouette.
          </p>
          <h3>Sarees</h3>
          <p>
            Focus on comfort at the petticoat or underskirt, the bulk and direction of the pleats,
            and how securely the pallu sits. A fluid or softly structured fabric may be easier to
            distribute than a very stiff or slippery one, but the drape technique matters as much
            as the textile.
          </p>
        </section>

        <section id="fabric">
          <h2>Test fabric behaviour instead of shopping by fibre name</h2>
          <p>
            Two fabrics with the same label can behave differently because of weave, weight,
            stretch and finishing. Hold the garment from the shoulder and watch whether it falls,
            collapses or stands away from the body.
          </p>
          <ul>
            <li>
              <strong>Usually easier:</strong> medium-light fabrics with fluid or softly structured
              drape and enough opacity.
            </li>
            <li>
              <strong>Test carefully:</strong> thin clingy knits, stiff fabric with no shaping, and
              shiny textiles placed under tension.
            </li>
            <li>
              <strong>Check in motion:</strong> sit for several minutes, then stand and see whether
              the fabric releases or remains caught.
            </li>
          </ul>
        </section>

        <section id="colour-print">
          <h2>Use colour and print to support the outfit hierarchy</h2>
          <p>
            Dark colour is one option, not an obligation. A low-contrast column can make the eye
            travel continuously, while a brighter neckline, scarf, jewellery or layer can establish
            a clear focal point near the face.
          </p>
          <p>
            With print, inspect placement rather than banning a scale. A large motif centred on the
            stomach behaves differently from the same motif distributed across the whole garment.
            Vertical spacing, an open ground and a print that continues past the waist can feel less
            interruptive than a dense horizontal band.
          </p>
          <p>
            The final question is not whether an outfit makes the stomach disappear. It is whether
            the complete look feels intentional, comfortable and appropriate for where you are
            going.
          </p>
          <p>
            For broader silhouette guidance, read the{" "}
            <Link href="/methodology/geometric-silhouette-profiling">
              Geometric Silhouette Profiling methodology
            </Link>
            .
          </p>
        </section>
      </SeoArticleLayout>
    </>
  );
}
