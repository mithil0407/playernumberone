import Link from "next/link";
import {
  breadcrumbList,
  founderPerson,
  graph,
  organizationNode,
} from "@/lib/structuredData";
import {
  BLUEPRINT_OFFER,
  BUSINESS_HOURS,
  CLIENT_PROOF,
  FOUNDERS,
  GOOGLE_BUSINESS_PROFILE_URL,
  LEGAL_ENTITY_NAME,
  SUPPORT_EMAIL,
  SUPPORT_WHATSAPP_DISPLAY,
  SUPPORT_WHATSAPP_URL,
} from "@/lib/siteFacts";
import {
  SeoBlueprintCta,
  SeoEditorialFooter,
  SeoEditorialHeader,
} from "@/components/seo/SeoEditorial";

const proofPoints = [
  `${CLIENT_PROOF.totalClients.toLocaleString("en-IN")}+ women and men styled across ${CLIENT_PROOF.countriesServed}+ countries.`,
  `${BLUEPRINT_OFFER.outfitFormulas} personalised outfit formulas with colour, hairstyle, and eyewear guidance.`,
  `${BLUEPRINT_OFFER.consultationMinutes}-minute stylist consultation before the Blueprint is prepared.`,
  `Delivery within ${BLUEPRINT_OFFER.deliveryWorkingDays} working days after the consultation.`,
  "Revisions included until the Blueprint reflects the original consultation scope.",
];

const methods = [
  {
    title: "Geometric Silhouette Profiling",
    href: "/methodology/geometric-silhouette-profiling",
    description:
      "Maps shoulder, waist, hip, torso, and vertical proportions into practical silhouette and fit decisions.",
  },
  {
    title: "Chromatic Harmony Mapping",
    href: "/methodology/chromatic-harmony-mapping",
    description:
      "Separates undertone, skin depth, and contrast so Indian skin tones are not forced into generic colour lists.",
  },
  {
    title: "Facial Architecture Analysis",
    href: "/methodology/facial-architecture-analysis",
    description:
      "Connects facial proportions to necklines, eyewear, earrings, collars, and hairstyle direction.",
  },
];

export default function AboutPage() {
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    {
      "@type": "AboutPage",
      "@id": "https://www.iconik.pro/about#webpage",
      name: "About ICONIK",
      url: "https://www.iconik.pro/about",
      mainEntity: { "@id": "https://www.iconik.pro/#organization" },
    },
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "About", path: "/about" },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="seo-editorial min-h-screen">
        <SeoEditorialHeader />
        <main>
          <div className="seo-editorial-shell">
            <header className="seo-article-hero">
              <nav aria-label="Breadcrumb" className="seo-breadcrumbs">
                <Link href="/">Home</Link> / <span aria-current="page">About ICONIK</span>
              </nav>
              <p className="seo-eyebrow">About ICONIK</p>
              <h1>Personal styling built to become a usable system.</h1>
              <p className="seo-dek">
                ICONIK combines a human stylist consultation with documented colour, silhouette,
                facial-architecture, hair, eyewear, and outfit guidance—so clients leave with a
                reference they can use while dressing and shopping.
              </p>
            </header>

            <section className="seo-quick-answer">
              <p className="seo-eyebrow text-white/70">What we deliver</p>
              <div className="seo-quick-answer-lead">
                A personal Blueprint, not a generic quiz result.
              </div>
              <div className="seo-quick-answer-detail">
                Every Blueprint is shaped by the client&apos;s photos, measurements, preferences,
                lifestyle, goals, and a conversation with an ICONIK stylist.
              </div>
            </section>

            <section className="mb-24">
              <p className="seo-eyebrow">Leadership</p>
              <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-4xl font-light tracking-[-0.04em] md:text-6xl">
                The people accountable for the work
              </h2>
              <div className="mt-10 grid gap-5 md:grid-cols-2">
                {FOUNDERS.map((founder) => (
                  <article
                    id="jasmine-rana"
                    key={founder.name}
                    className="rounded-[1.6rem] border border-[#2C2622]/10 bg-white/35 p-7"
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-[#1A2228] font-[family-name:var(--font-fraunces)] text-lg text-[#B79A67]">
                      {founder.name.split(/\s+/).map((part) => part[0]).join("")}
                    </div>
                    <h3 className="mt-7 font-[family-name:var(--font-fraunces)] text-3xl font-light">{founder.name}</h3>
                    <p className="mt-2 text-sm text-[#9A7D4A]">{founder.title}</p>
                    <p className="mt-5 leading-7 text-[#2C2622]/65">
                      Jasmine leads the styling perspective behind ICONIK&apos;s client recommendations and editorial review.
                    </p>
                    <a
                      href={founder.linkedIn}
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex text-sm underline decoration-[#B79A67] underline-offset-4"
                    >
                      LinkedIn profile →
                    </a>
                  </article>
                ))}
              </div>
            </section>

            <section className="mb-24 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.6rem] bg-[#EDE5D2] p-7 md:p-10">
                <p className="seo-eyebrow">Service facts</p>
                <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-4xl font-light tracking-[-0.04em]">
                  What clients can verify before paying
                </h2>
                <ul className="mt-7 space-y-4">
                  {proofPoints.map((point) => (
                    <li key={point} className="flex gap-3 leading-7 text-[#2C2622]/70">
                      <span className="text-[#9A7D4A]">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[1.6rem] bg-[#1A2228] p-7 text-[#F7F3ED] md:p-10">
                <p className="seo-eyebrow text-white/55">Business identity</p>
                <dl className="mt-7 space-y-5 text-sm">
                  <div>
                    <dt className="text-white/45">Registered name</dt>
                    <dd className="mt-1 text-base">{LEGAL_ENTITY_NAME}</dd>
                  </div>
                  <div>
                    <dt className="text-white/45">Support</dt>
                    <dd className="mt-1"><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></dd>
                    <dd><a href={SUPPORT_WHATSAPP_URL}>WhatsApp {SUPPORT_WHATSAPP_DISPLAY}</a></dd>
                  </div>
                  <div>
                    <dt className="text-white/45">Business hours</dt>
                    <dd className="mt-1">{BUSINESS_HOURS.display}</dd>
                  </div>
                  <div>
                    <dt className="text-white/45">Public business profile</dt>
                    <dd className="mt-1"><a href={GOOGLE_BUSINESS_PROFILE_URL}>View Google profile →</a></dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="mb-24">
              <p className="seo-eyebrow">Methodology</p>
              <h2 className="mt-3 font-[family-name:var(--font-fraunces)] text-4xl font-light tracking-[-0.04em] md:text-6xl">
                Observable inputs, practical decisions
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-[#2C2622]/65">
                ICONIK&apos;s named methods organise what a stylist observes. They are a styling
                framework—not a medical diagnosis—and each method must end in a wardrobe decision
                the client can understand and reuse.
              </p>
              <div className="seo-related-grid">
                {methods.map((method) => (
                  <Link key={method.href} href={method.href}>
                    <span className="seo-related-arrow" aria-hidden="true">↗</span>
                    <h3>{method.title}</h3>
                    <p>{method.description}</p>
                  </Link>
                ))}
              </div>
            </section>

            <SeoBlueprintCta
              title="See exactly what the ICONIK Blueprint includes."
              description={`${BLUEPRINT_OFFER.outfitFormulas} outfit formulas, colour analysis, hairstyle and eyewear guidance, plus a ${BLUEPRINT_OFFER.consultationMinutes}-minute consultation.`}
            />
          </div>
        </main>
        <SeoEditorialFooter />
      </div>
    </>
  );
}
