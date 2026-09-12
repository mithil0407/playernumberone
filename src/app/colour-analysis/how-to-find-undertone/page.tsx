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

const path = "/colour-analysis/how-to-find-undertone";
const title = "How to Find Your Undertone at Home";
const description =
  "Use a controlled fabric-drape test to compare warm, cool and neutral colour directions on Indian skin, and learn why vein, paper and jewellery tests are only supporting clues.";
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
    "how to find undertone",
    "undertone test at home India",
    "warm cool neutral undertone test",
    "Indian skin undertone",
  ],
  image: {
    path: "/images/seo/skin-depth-undertone-difference-iconik.webp",
    width: 1122,
    height: 1402,
    alt: "Skin depth and undertone shown as separate colour-analysis variables.",
  },
});

const faqs = [
  {
    q: "Is the vein test accurate for Indian skin?",
    a: "Vein colour is not a reliable standalone undertone test. Skin depth, vein depth, lighting and individual colour perception can all change what you see. Treat it as a weak clue and give more weight to repeated fabric comparisons under stable light.",
  },
  {
    q: "Is white paper the best undertone test?",
    a: "No single white-paper comparison can establish undertone. Paper brightness, wall colour, daylight and camera white balance can shift the apparent cast. Fabric drapes are more useful for styling because they test the same material relationship you are trying to choose.",
  },
  {
    q: "What if warm and cool tests both look good?",
    a: "You may be neutral, olive, close to the warm-cool boundary, or simply more affected by depth and clarity than temperature. Compare softer versus clearer colours next and keep notes about the exact fabrics rather than forcing a label.",
  },
  {
    q: "Can dark Indian skin have a cool undertone?",
    a: "Yes. Visible skin depth and undertone are separate observations. Fair, medium and deep skin can each lean warm, cool, neutral or olive, so depth alone should never determine a palette.",
  },
  {
    q: "Does undertone decide every colour I can wear?",
    a: "No. Undertone is one styling variable. Colour depth, clarity, contrast, fabric sheen, print scale, placement and personal preference can all change an outfit. A difficult neckline colour may still work in trousers, a border, footwear or a bag.",
  },
];

const howToSteps = [
  {
    "@type": "HowToStep",
    position: 1,
    name: "Create neutral test conditions",
    text: "Use indirect daylight, turn off coloured indoor lights, remove strong makeup and keep the camera exposure and position fixed.",
  },
  {
    "@type": "HowToStep",
    position: 2,
    name: "Compare two useful light neutrals",
    text: "Place warm ivory and crisp white near the face one at a time. Observe eye definition, lip definition, under-eye shadow and unwanted yellow, grey or red cast.",
  },
  {
    "@type": "HowToStep",
    position: 3,
    name: "Compare one warm and one cool colour",
    text: "Test similar-depth fabrics such as terracotta and cobalt. Similar depth makes temperature the main changing variable.",
  },
  {
    "@type": "HowToStep",
    position: 4,
    name: "Repeat before deciding",
    text: "Repeat the strongest comparison in similar daylight on another day. Record mixed results instead of forcing a warm or cool label.",
  },
];

export default function HowToFindUndertonePage() {
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    articleNode({
      title,
      description,
      path,
      datePublished: published,
      dateModified: modified,
      images: ["/images/seo/skin-depth-undertone-difference-iconik.webp"],
      about: ["Skin undertone", "Colour analysis", "Indian skin tones"],
    }),
    {
      "@type": "HowTo",
      "@id": `https://www.iconik.pro${path}#howto`,
      name: "How to compare your undertone direction at home",
      description: "A controlled four-step fabric comparison for warm, cool and neutral colour direction.",
      step: howToSteps,
    },
    faqPageNode(faqs),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Colour Analysis", path: "/colour-analysis" },
      { name: "How to Find Your Undertone", path },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoArticleLayout
        hero={{
          eyebrow: "At-home colour test",
          title,
          summary:
            "The most useful home test is not reading your veins or holding up white paper. It is a controlled fabric comparison that changes one colour variable at a time and observes the face under consistent light.",
          breadcrumbs: [
            { label: "Home", href: "/" },
            { label: "Colour Analysis", href: "/colour-analysis" },
            { label: "How to Find Your Undertone" },
          ],
          published: "1 January 2025",
          updated: "24 July 2026",
          reviewer: "Jasmine Rana",
          readingTime: "9 min read",
        }}
        quickAnswer={
          <SeoQuickAnswer
            answer="Compare warm and cool fabrics of similar depth beside your face in indirect daylight. Keep the light, camera, makeup and position unchanged."
            detail="Repeat the comparison before labelling yourself. Veins, white paper and jewellery can support an observation, but none should decide the result alone."
          />
        }
        tableOfContents={[
          { href: "#what-undertone-means", label: "What undertone means" },
          { href: "#controlled-test", label: "The controlled drape test" },
          { href: "#read-result", label: "How to read the result" },
          { href: "#weak-clues", label: "Why common tests conflict" },
          { href: "#use-result", label: "Turn the result into outfits" },
        ]}
        afterArticle={
          <>
            <SeoFaqSection faqs={faqs} />
            <SeoAuthorReview>
              <p>
                Jasmine reviews ICONIK&apos;s colour methodology and its translation into Indian,
                western and fusion wardrobes. This guide treats undertone as a styling observation,
                not a medical classification.
              </p>
            </SeoAuthorReview>
            <SeoRelatedGuides
              links={[
                {
                  href: "/colour-analysis",
                  title: "Colour Analysis for Indian Skin Tones",
                  description: "Understand undertone, depth, clarity and contrast as one colour system.",
                },
                {
                  href: "/colour-analysis/warm-cool-neutral-undertone-india",
                  title: "Warm, Cool or Neutral?",
                  description: "Compare the three broad temperature directions without rigid rules.",
                },
                {
                  href: "/methodology/chromatic-harmony-mapping",
                  title: "Chromatic Harmony Mapping™",
                  description: "Read the canonical explanation of ICONIK's colour framework.",
                },
              ]}
            />
            <SeoBlueprintCta
              title="Want a stylist to translate the comparisons into a wardrobe palette?"
              description="The ICONIK Blueprint combines colour direction with silhouette, face-framing guidance and 20 outfit formulas after a 30-minute consultation."
            />
          </>
        }
      >
        <SeoTeachingVisual
          src="/images/seo/skin-depth-undertone-difference-iconik.webp"
          alt="Skin depth and undertone shown as separate variables for Indian colour analysis."
          caption="Skin depth describes how light or deep the visible complexion appears. Undertone is a separate colour-direction observation."
          width={1122}
          height={1402}
          priority
        />

        <section id="what-undertone-means">
          <h2>What undertone does—and does not—mean</h2>
          <p>
            In personal styling, undertone is shorthand for the colour temperature that appears most
            harmonious near the face: broadly warm, cool or balanced. It is not the same as visible
            skin depth. Two people described as fair, wheatish, dusky or deep can respond differently
            to the same fabric.
          </p>
          <p>
            Undertone is also not a health reading or a permanent wardrobe law. Tanning, redness,
            hyperpigmentation, makeup, lighting and camera processing can alter what you see. That is
            why the useful question is not simply “What am I?” but “Which repeated colour
            relationships make my face look clearer and more even under controlled conditions?”
          </p>
        </section>

        <section id="controlled-test">
          <h2>The controlled fabric-drape test</h2>
          <ol>
            <li><strong>Set the light.</strong> Stand in indirect daylight. Turn off yellow, coloured or fluorescent indoor lights.</li>
            <li><strong>Reduce competing colour.</strong> Remove dominant lipstick, tinted foundation, large earrings and bright clothing near the face.</li>
            <li><strong>Fix the comparison.</strong> Keep your face, camera position and exposure unchanged. A mirror is better than an auto-adjusting phone if the phone changes brightness.</li>
            <li><strong>Test light neutrals.</strong> Compare warm ivory with crisp white.</li>
            <li><strong>Test temperature.</strong> Compare similarly deep fabrics such as terracotta and cobalt, or olive and cool emerald.</li>
            <li><strong>Repeat.</strong> Re-test the clearest pair in similar light on another day before deciding.</li>
          </ol>
          <p>
            Use actual garments or opaque fabrics when possible. A small digital swatch on a bright
            phone screen does not reflect light onto the face in the same way.
          </p>
        </section>

        <SeoTeachingVisual
          src="/images/seo/wheatish-skin-drape-test-iconik.webp"
          alt="Indian woman comparing warm ivory, crisp white, terracotta and cobalt fabric drapes under consistent light."
          caption="This example uses wheatish skin, but the method is the same at every skin depth: hold all conditions steady and change one fabric direction."
          width={1003}
          height={1568}
        />

        <section id="read-result">
          <h2>How to read the face, not the colour name</h2>
          <p>For each drape, look for several signals together:</p>
          <ul>
            <li>Are the eyes and lips easy to see, or does the fabric become the only thing you notice?</li>
            <li>Do under-eye shadows appear stronger or softer?</li>
            <li>Does the skin pick up an unwanted yellow, grey, red or green cast?</li>
            <li>Does facial definition improve without requiring more makeup?</li>
            <li>Would the effect still suit the outfit context you are dressing for?</li>
          </ul>
          <p>
            One signal is not enough. A very bright cool blue may sharpen the eyes but overpower the
            face; a softer blue may keep the cool direction without the intensity. That means clarity,
            not temperature, was the second variable to adjust.
          </p>
        </section>

        <SeoInsightCard eyebrow="Record mixed evidence" title="Neutral and olive results are not failures">
          <p>
            If warm and cool comparisons split evenly, do not force a category. Test soft versus clear
            colours, yellow-green versus blue-green, and different depths. Olive skin can be read as
            warm under one light and neutral under another, so the exact fabric matters more than the
            label.
          </p>
        </SeoInsightCard>

        <section id="weak-clues">
          <h2>Why vein, paper and jewellery tests often conflict</h2>
          <h3>Vein colour</h3>
          <p>
            Veins sit below skin and can appear blue, green or indistinct depending on skin depth,
            vein depth and lighting. They do not directly test how clothing reflects colour onto the
            face.
          </p>
          <h3>White paper</h3>
          <p>
            Paper can reveal a cast, but its own brightness and the surrounding room affect the
            comparison. Use white versus ivory fabric instead, because that is a real wardrobe choice.
          </p>
          <h3>Gold versus silver</h3>
          <p>
            Metal finish, shine, scale and stones influence the result. Compare pieces of similar size
            and finish, then judge them with the neckline colours you actually wear.
          </p>
        </section>

        <section id="use-result">
          <h2>Turn the observation into outfits</h2>
          <p>
            Start with three categories instead of a long prohibited-colour list:
          </p>
          <ul>
            <li><strong>One useful light:</strong> crisp white, soft white or warm ivory.</li>
            <li><strong>Two reliable neutrals:</strong> for trousers, jackets, bags and repeat wear.</li>
            <li><strong>Three face colours:</strong> for kurtas, blouses, shirts, dupattas and saree pallus.</li>
          </ul>
          <p>
            Keep colours you love. If one is difficult near the face, move it to a lower garment,
            border, bag or shoe, or separate it from the face with a more supportive neckline colour.
            Continue with the <Link href="/colour-analysis" className="underline">complete colour-analysis guide</Link> or try
            the <Link href="/tools/glow-test" className="underline">free Glow Test</Link>.
          </p>
        </section>
      </SeoArticleLayout>
    </>
  );
}
