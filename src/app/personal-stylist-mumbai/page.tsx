import type { Metadata } from "next";
import Link from "next/link";
import { ArticleGrowthTracker } from "@/components/ArticleGrowthTracker";
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
import {
  BLUEPRINT_OFFER,
  BRAND_NAME,
  BUSINESS_HOURS,
  CLIENT_PROOF,
  FOUNDERS,
  LEGAL_ENTITY_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_WHATSAPP_URL,
} from "@/lib/siteFacts";

const path = "/personal-stylist-mumbai";
const canonical = `${SITE_URL}${path}`;
const growthTracking = {
  article_id: "personal_stylist_mumbai",
  content_cluster: "local_personal_styling",
  audience: "women" as const,
  hook_type: "mumbai_wardrobe_system",
  content_source: "seo_personal_stylist_mumbai",
};

export const metadata: Metadata = buildMetadata({
  title: "Online Personal Stylist in Mumbai for Women",
  description:
    "A transparent guide to ICONIK's online personal styling for Mumbai women: what the ₹2,699 Blueprint includes, how it works, and how it handles humidity, commutes, work and occasion wear.",
  path,
  keywords: [
    "personal stylist Mumbai",
    "online personal stylist Mumbai",
    "style consultation Mumbai",
    "wardrobe consultation Mumbai",
    "personal fashion stylist Mumbai",
  ],
  image: {
    path: "/images/seo/personal-stylist-mumbai-hero-iconik-og.webp",
    width: 1200,
    height: 630,
    alt: "Personal styling for Mumbai work, commute, social and occasion wardrobes",
  },
});

const faqs = [
  {
    q: "Does ICONIK have an in-person studio in Mumbai?",
    a: "No Mumbai studio or home-visit service is advertised on this page. ICONIK delivers the Blueprint online through intake, a 30-minute consultation, stylist analysis, and a documented report. That format is useful for wardrobe strategy; it is not a substitute for someone physically shopping, fitting, or organizing your wardrobe in person.",
  },
  {
    q: "What does the ₹2,699 ICONIK Blueprint include?",
    a: "The current offer includes a 30-minute consultation, colour analysis, body-proportion and facial-architecture guidance, hairstyle and eyewear direction, and 20 outfit formulas. The documented Blueprint is delivered within five working days after the consultation.",
  },
  {
    q: "Can the recommendations account for Mumbai humidity and monsoon travel?",
    a: "Yes, when you include those constraints in your intake. Ask the stylist to prioritise breathable non-cling fabrics, quick-drying hems, commute-friendly footwear, easy-care layers, and pieces that still look polished in air-conditioned offices.",
  },
  {
    q: "Can I use the service for sarees, kurtas, and wedding wear?",
    a: "Yes. The wardrobe brief can include Indian, western, and fusion categories. For occasion wear, guidance can cover colour, neckline, blouse or kurta shape, drape direction, jewellery scale, and how the outfit relates to your real proportions.",
  },
  {
    q: "What if I disagree with part of my Blueprint?",
    a: BLUEPRINT_OFFER.revisionPromise,
  },
  {
    q: "How do I contact ICONIK before buying?",
    a: `Email ${SUPPORT_EMAIL} or WhatsApp ${SUPPORT_WHATSAPP_DISPLAY} during ${BUSINESS_HOURS.display}.`,
  },
];

const tableOfContents = [
  { href: "#is-online-right", label: "Is an online stylist right for you?" },
  { href: "#mumbai-wardrobe", label: "Mumbai wardrobe realities" },
  { href: "#what-we-analyse", label: "What ICONIK analyses" },
  { href: "#how-it-works", label: "How the service works" },
  { href: "#outfit-contexts", label: "Four Mumbai outfit contexts" },
  { href: "#included", label: "What the Blueprint includes" },
  { href: "#before-you-book", label: "Before you book" },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Service",
      "@id": `${canonical}#service`,
      name: `${BLUEPRINT_OFFER.name} for Mumbai`,
      serviceType: "Online personal styling consultation and personalised style blueprint",
      provider: {
        "@type": "Organization",
        name: LEGAL_ENTITY_NAME,
        url: SITE_URL,
        email: SUPPORT_EMAIL,
      },
      areaServed: { "@type": "City", name: "Mumbai" },
      availableChannel: {
        "@type": "ServiceChannel",
        serviceUrl: `${SITE_URL}${BLUEPRINT_OFFER.offerPath}`,
        availableLanguage: ["English", "Hindi"],
      },
      description:
        "Online personal styling for Mumbai women, including colour, body proportion, facial architecture, hairstyle, eyewear, and 20 outfit formulas.",
      offers: {
        "@type": "Offer",
        price: String(BLUEPRINT_OFFER.currentPriceInr),
        priceCurrency: "INR",
        url: `${SITE_URL}${BLUEPRINT_OFFER.offerPath}`,
      },
    },
    {
      "@type": "WebPage",
      "@id": canonical,
      url: canonical,
      name: "Online Personal Stylist in Mumbai for Women",
      dateModified: "2026-07-24",
      reviewedBy: {
        "@type": "Person",
        name: FOUNDERS[0].name,
        jobTitle: FOUNDERS[0].title,
        sameAs: FOUNDERS[0].linkedIn,
      },
      mainEntity: { "@id": `${canonical}#service` },
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
        { "@type": "ListItem", position: 2, name: "Personal Stylist in Mumbai", item: canonical },
      ],
    },
  ],
};

export default function MumbaiPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleGrowthTracker {...growthTracking} />
      <SeoArticleLayout
        hero={{
          eyebrow: "Online Personal Styling · Mumbai",
          title: "A Personal Stylist for Mumbai Life—Delivered Online",
          summary:
            "A practical wardrobe system for humidity, commutes, air-conditioned offices, social plans, and Indian occasion wear. This page explains exactly what ICONIK can—and cannot—do for a Mumbai client.",
          breadcrumbs: [
            { href: "/", label: "Home" },
            { label: "Personal Stylist in Mumbai" },
          ],
          published: "24 July 2026",
          updated: "24 July 2026",
          reviewer: `${FOUNDERS[0].name}, ${FOUNDERS[0].title}`,
          readingTime: "10 minute read",
        }}
        quickAnswer={
          <>
            <SeoQuickAnswer
              title="The transparent answer"
              answer={
                <>
                  ICONIK is an online styling service, not a Mumbai home-visit stylist or physical
                  studio. It is designed for women who want a documented wardrobe strategy they can
                  use while shopping locally or online.
                </>
              }
              detail={
                <>
                  The current ₹{BLUEPRINT_OFFER.currentPriceInr.toLocaleString("en-IN")} Blueprint
                  includes a {BLUEPRINT_OFFER.consultationMinutes}-minute consultation, colour,
                  silhouette and face-level guidance, hairstyle and eyewear direction, and{" "}
                  {BLUEPRINT_OFFER.outfitFormulas} outfit formulas. Delivery is within{" "}
                  {BLUEPRINT_OFFER.deliveryWorkingDays} working days after the consultation.
                </>
              }
            />
            <SeoTeachingVisual
              src="/images/seo/personal-stylist-mumbai-hero-iconik.webp"
              alt="Mumbai professional woman in a breathable structured outfit beside a visual wardrobe system for work, commute, social and occasion wear."
              caption="Personal styling becomes useful when it connects your body, face, colour palette, climate and real calendar."
              width={1672}
              height={941}
              priority
            />
          </>
        }
        tableOfContents={[...tableOfContents]}
        afterArticle={
          <>
            <SeoFaqSection faqs={faqs} />
            <SeoAuthorReview>
              Jasmine reviews ICONIK&apos;s styling guidance across Indian and western wardrobe
              categories. This page describes an online service truthfully; it does not claim a
              physical Mumbai location or in-person shopping accompaniment.
            </SeoAuthorReview>
            <SeoRelatedGuides
              links={[
                {
                  href: "/personal-stylist-india",
                  title: "Personal Stylist India",
                  description: "Compare ICONIK's national online service, scope, and process.",
                },
                {
                  href: "/style-guides/office-wear-indian-women",
                  title: "Office Wear for Indian Women",
                  description: "Build climate-aware Indian and western professional outfits.",
                },
                {
                  href: "/methodology",
                  title: "ICONIK Methodology",
                  description: "See how silhouette, colour, and facial framing are combined.",
                },
              ]}
            />
            <SeoBlueprintCta
              title="Build a wardrobe system for your life in Mumbai."
              description={`The ${BLUEPRINT_OFFER.name} is currently ₹${BLUEPRINT_OFFER.currentPriceInr.toLocaleString("en-IN")} and includes ${BLUEPRINT_OFFER.outfitFormulas} personalised outfit formulas.`}
            />
          </>
        }
      >
        <section id="is-online-right">
          <p className="seo-eyebrow">Choose the right service format</p>
          <h2>Do You Need an Online Personal Stylist or an In-Person Mumbai Stylist?</h2>
          <p>
            Choose an online stylist when your main problem is decision-making: you buy pieces but
            cannot combine them, repeat the same safe outfits, struggle with colour or fit, or need
            a clear brief before investing in workwear or occasion wear. A documented system can
            travel with you across stores, tailors, and e-commerce sites.
          </p>
          <p>
            Choose an in-person stylist when you specifically need someone to edit your wardrobe in
            your home, accompany you through stores, coordinate alterations on site, or style you
            physically for an event. ICONIK does not advertise those Mumbai services here.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <SeoInsightCard title="ICONIK is useful when…" tone="bone">
              <ul>
                <li>You want rules you can reuse after the consultation.</li>
                <li>You shop both online and across different Mumbai stores.</li>
                <li>You need Indian, western, and fusion outfits in one plan.</li>
                <li>You prefer a documented output over verbal advice alone.</li>
              </ul>
            </SeoInsightCard>
            <SeoInsightCard title="Look for in-person help when…" tone="slate">
              <ul>
                <li>You need a physical wardrobe clean-out.</li>
                <li>You want live store accompaniment.</li>
                <li>You need fittings and alterations managed for you.</li>
                <li>You are styling a one-day shoot or event on location.</li>
              </ul>
            </SeoInsightCard>
          </div>
        </section>

        <section id="mumbai-wardrobe">
          <p className="seo-eyebrow">Local wardrobe intelligence</p>
          <h2>Mumbai Clothes Have to Survive More Than the Mirror</h2>
          <p>
            Mumbai dressing often moves through heat, humidity, rain, a cab or train, cold office
            air-conditioning, and an evening plan in one day. The right outfit cannot be judged
            only at home. It has to retain its shape, remain comfortable, and recover after travel.
          </p>
          <SeoTeachingVisual
            src="/images/seo/mumbai-wardrobe-climate-commute-guide-iconik.webp"
            alt="Mumbai wardrobe guide mapping humidity, monsoon commute, air-conditioned office and evening plans to practical clothing choices."
            caption="The Mumbai test: breathable at noon, composed after the commute, layerable in office air-conditioning, and adaptable after work."
            width={1003}
            height={1568}
          />
          <h3>What to ask your stylist to prioritise</h3>
          <ul>
            <li>
              <strong>Humidity:</strong> breathable weaves, non-cling cuts, washable layers, and
              enough ease around high-friction areas.
            </li>
            <li>
              <strong>Monsoon:</strong> controlled hems, quick-recovery fabrics, practical shoe
              options, and darker or patterned lower pieces where splash marks are a concern.
            </li>
            <li>
              <strong>Commutes:</strong> fabrics that resist crushing, bags that work with your
              shoulder line, and layers that can be removed without dismantling the outfit.
            </li>
            <li>
              <strong>Office-to-evening:</strong> one base outfit whose formality changes through a
              jacket, earring, shoe, lip colour, or bag—not a complete second wardrobe.
            </li>
          </ul>
          <p>
            Avoid treating “linen,” “cotton,” or “rayon” as automatic guarantees. Fibre, weave,
            weight, lining, and construction determine whether a garment breathes, clings, creases,
            or dries well. Test the actual fabric by sitting, walking, and holding it up to light.
          </p>
        </section>

        <section id="what-we-analyse">
          <p className="seo-eyebrow">The ICONIK framework</p>
          <h2>What a Personal Styling Analysis Should Connect</h2>
          <p>
            A useful wardrobe recommendation should not come from one label such as “pear,”
            “wheatish,” or “round face.” ICONIK combines four information layers, then checks the
            result against your work, comfort, modesty, budget, and repeat-wear needs.
          </p>
          <SeoTeachingVisual
            src="/images/seo/mumbai-personal-stylist-analysis-framework-iconik.webp"
            alt="ICONIK personal styling framework connecting body geometry, facial architecture, colour relationships and Mumbai lifestyle."
            caption="Four inputs become one wardrobe brief: proportion, facial framing, colour behaviour, and the life the clothes must serve."
            width={1672}
            height={941}
          />
          <ol>
            <li>
              <strong>Body proportions:</strong> shoulder, waist, hip, rise, leg-to-torso ratio,
              garment length, and where volume should be placed.
            </li>
            <li>
              <strong>Facial architecture:</strong> neckline, collar, eyewear, earring, and hair
              direction considered as one frame around the face.
            </li>
            <li>
              <strong>Colour relationships:</strong> undertone, depth, clarity, and useful contrast
              tested without treating Indian skin as one warm category.
            </li>
            <li>
              <strong>Lifestyle constraints:</strong> dress codes, commute, climate, occasions,
              comfort, cultural context, and the pieces you will actually repeat.
            </li>
          </ol>
        </section>

        <section id="how-it-works">
          <p className="seo-eyebrow">From intake to document</p>
          <h2>How the Online Personal Styling Process Works</h2>
          <SeoTeachingVisual
            src="/images/seo/mumbai-online-styling-process-iconik.webp"
            alt="Five-step online styling process from goals and photos to consultation, analysis, outfit formulas and delivered Blueprint."
            caption="The service separates data collection, conversation, analysis, outfit construction, and documented delivery."
            width={1024}
            height={1536}
          />
          <ol>
            <li>
              <strong>Complete the intake:</strong> share measurements, suitable photos, wardrobe
              goals, dress codes, preferences, and the situations you need to dress for.
            </li>
            <li>
              <strong>Attend the {BLUEPRINT_OFFER.consultationMinutes}-minute consultation:</strong>{" "}
              clarify priorities, comfort boundaries, and the difference between aspirational style
              and your day-to-day reality.
            </li>
            <li>
              <strong>Stylist analysis:</strong> the team maps proportion, colour, and facial framing
              without using a single label as the whole answer.
            </li>
            <li>
              <strong>Outfit construction:</strong> the analysis is translated into{" "}
              {BLUEPRINT_OFFER.outfitFormulas} formulas across the categories chosen in your brief.
            </li>
            <li>
              <strong>Delivery and revision:</strong> receive the Blueprint within{" "}
              {BLUEPRINT_OFFER.deliveryWorkingDays} working days after the consultation.{" "}
              {BLUEPRINT_OFFER.revisionPromise}
            </li>
          </ol>
        </section>

        <section id="outfit-contexts">
          <p className="seo-eyebrow">One wardrobe, several lives</p>
          <h2>Four Mumbai Outfit Contexts Worth Planning Together</h2>
          <SeoTeachingVisual
            src="/images/seo/mumbai-outfit-contexts-iconik.webp"
            alt="Four outfit formulas for a Mumbai woman covering commute, client meeting, weekend and Indian occasion wear."
            caption="A coherent wardrobe repeats colour, proportion and accessories across work, commute, weekend and occasion dressing."
            width={1672}
            height={941}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              ["Commute + desk", "A breathable base, clean straight bottom, practical shoe, structured bag, and removable office layer."],
              ["Client-facing work", "One authority line—jacket, saree, structured kurta, or strong collar—supported by quiet accessories."],
              ["Weekend + social", "The same palette and proportion logic in softer fabrics, lower formality, and one expressive detail."],
              ["Wedding + occasion", "Colour, drape, neckline, jewellery scale, and embellishment organised around one visual hero."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-3xl border border-[#2c2622]/10 bg-[#f7f3ed] p-6">
                <h3 className="!m-0">{title}</h3>
                <p className="!mt-3">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="included">
          <p className="seo-eyebrow">Scope and deliverables</p>
          <h2>What Is Included in the ICONIK Blueprint?</h2>
          <SeoTeachingVisual
            src="/images/seo/iconik-blueprint-inclusions-mumbai-iconik.webp"
            alt="Saveable overview of ICONIK Blueprint inclusions: consultation, colour, proportion, face, hair, eyewear and 20 outfit formulas."
            caption="The Blueprint combines analysis with wearable output; it is more than a face-shape result or colour palette."
            width={1024}
            height={1535}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["20 outfit formulas", "Work, ethnic, casual, and occasion categories shaped around your chosen brief."],
              ["Colour analysis", "A practical palette and colour-combination logic for clothing and near-face decisions."],
              ["Body-proportion guidance", "Rise, hem, silhouette, volume, and fit direction translated into clothing choices."],
              ["Facial framing", "Neckline, collar, earring, hairstyle direction, and eyewear considerations."],
              ["30-minute consultation", "A live conversation to clarify your goals, preferences, and real-life constraints."],
              ["Documented delivery", "A personal report delivered within five working days after the consultation."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-[#2c2622]/10 p-5">
                <h3 className="!m-0 !text-xl">{title}</h3>
                <p className="!mt-2 !text-sm">{description}</p>
              </div>
            ))}
          </div>
          <p>
            ICONIK reports having styled more than {CLIENT_PROOF.womenStyled.toLocaleString("en-IN")}{" "}
            women and {CLIENT_PROOF.menStyled.toLocaleString("en-IN")} men across{" "}
            {CLIENT_PROOF.countriesServed}+ countries. Treat those figures as company-reported
            service history; your own outcome still depends on accurate intake, clear priorities,
            and applying the recommendations.
          </p>
        </section>

        <section id="before-you-book">
          <p className="seo-eyebrow">Make the consultation more useful</p>
          <h2>What to Prepare Before You Book</h2>
          <ol>
            <li>List the five situations you dress for most often.</li>
            <li>Photograph three outfits you repeat and three that never feel right.</li>
            <li>Set a realistic shopping or tailoring budget for the next three months.</li>
            <li>Write down non-negotiables: sleeves, heel height, modesty, fabrics, or dress code.</li>
            <li>Choose whether you need wardrobe rescue, a new role wardrobe, or occasion planning first.</li>
          </ol>
          <SeoInsightCard eyebrow="Support" title="Ask before paying if anything is unclear" tone="bone">
            <p>
              Contact{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or{" "}
              <a href={SUPPORT_WHATSAPP_URL}>WhatsApp {SUPPORT_WHATSAPP_DISPLAY}</a>. Business hours
              are {BUSINESS_HOURS.display}. The current offer is ₹
              {BLUEPRINT_OFFER.currentPriceInr.toLocaleString("en-IN")} through the{" "}
              <Link href={BLUEPRINT_OFFER.offerPath}>offer page</Link>.
            </p>
            <p>
              Refunds are not presented as unconditional. {BLUEPRINT_OFFER.refundSummary} Read the{" "}
              <Link href="/refund-policy">Refund &amp; Cancellation Policy</Link> before purchase.
            </p>
          </SeoInsightCard>
          <p className="text-sm">
            Cite this page: Rana, Jasmine. “Online Personal Stylist in Mumbai for Women.” {BRAND_NAME},{" "}
            {LEGAL_ENTITY_NAME}. Updated 24 July 2026.
          </p>
        </section>
      </SeoArticleLayout>
    </>
  );
}
