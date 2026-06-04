import Image from "next/image";
import Link from "next/link";
import {
  breadcrumbList,
  founderPerson,
  graph,
  organizationNode,
} from "@/lib/structuredData";

const proofPoints = [
  "Personalised Style Blueprint delivered digitally after intake and stylist review.",
  "Three-part analysis: body geometry, colour harmony, and face-shape guidance.",
  "Recommendations built for Indian wardrobes, including ethnic, western, fusion, work, and occasion wear.",
  "Clear business identity, support contact, privacy policy, terms, and refund policy.",
];

const methods = [
  {
    title: "Geometric Silhouette Profiling",
    href: "/methodology/geometric-silhouette-profiling",
    description:
      "Maps shoulder, waist, hip, limb, and soft-tissue proportions into practical silhouette rules for Indian garments.",
  },
  {
    title: "Chromatic Harmony Mapping",
    href: "/methodology/chromatic-harmony-mapping",
    description:
      "Separates undertone, skin depth, and contrast so Indian skin tones are not forced into generic colour advice.",
  },
  {
    title: "Facial Architecture Analysis",
    href: "/methodology/facial-architecture-analysis",
    description:
      "Connects face shape to necklines, earrings, collars, and hair direction so outfits work close to the face.",
  },
];

export default function AboutPage() {
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    {
      "@type": "AboutPage",
      "@id": "https://www.iconik.pro/about#webpage",
      name: "About Iconik",
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
      <main className="min-h-screen bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
            <ol className="flex items-center gap-2">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li aria-hidden="true">›</li>
              <li className="font-medium text-gray-800">About Iconik</li>
            </ol>
          </nav>

          <header className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-gray-400">
                About Iconik
              </p>
              <h1 className="mb-5 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
                A personal styling service built around evidence, not guesswork.
              </h1>
              <p className="text-lg leading-relaxed text-gray-600">
                Iconik helps Indian women understand what suits them through a documented Style Blueprint: body-shape analysis, undertone-led colour guidance, face-shape recommendations, and outfit formulas for real wardrobes.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <Image
                src="/tripti.png"
                alt="Iconik founder and stylist profile"
                width={640}
                height={640}
                className="mb-5 aspect-square w-full rounded-xl object-cover"
                priority
              />
              <p className="text-sm font-semibold text-gray-900">Reviewed by Mithil Navalakha</p>
              <p className="text-sm leading-relaxed text-gray-600">
                Founder, Iconik. Responsible for Iconik&apos;s methodology, style report structure, and client experience.
              </p>
            </div>
          </header>

          <section className="mt-16 rounded-2xl border border-gray-200 bg-gray-50 p-7">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">Who is Iconik for?</h2>
            <p className="mb-4 leading-relaxed text-gray-600">
              Iconik is for women who want a repeatable styling system: what colours to wear, which silhouettes to choose, what to avoid, and how to build outfits across work, casual, ethnic, and occasion contexts.
            </p>
            <ul className="grid gap-3 text-gray-600 md:grid-cols-2">
              {proofPoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="font-bold text-green-600">✓</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-14">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">How the methodology works</h2>
            <p className="mb-6 leading-relaxed text-gray-600">
              Iconik&apos;s proprietary terms are backed by a specific styling process. Each method translates an observable variable into wardrobe decisions a client can use while shopping or getting dressed.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {methods.map((method) => (
                <Link key={method.href} href={method.href} className="rounded-xl border border-gray-200 p-5 hover:bg-gray-50">
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">{method.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600">{method.description}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-14 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-7">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Business identity</h2>
              <dl className="space-y-3 text-gray-600">
                <div>
                  <dt className="font-semibold text-gray-900">Brand</dt>
                  <dd>Iconik</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Industry</dt>
                  <dd>Personal styling and wardrobe strategy</dd>
                </div>
                <div>
                  <dt className="font-semibold text-gray-900">Support</dt>
                  <dd><a href="mailto:help.iconikfashion@gmail.com" className="underline">help.iconikfashion@gmail.com</a></dd>
                </div>
              </dl>
            </div>
            <div className="rounded-2xl border border-gray-200 p-7">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Policies and trust</h2>
              <p className="mb-4 leading-relaxed text-gray-600">
                Iconik publishes its core commercial policies so clients can evaluate the service before paying.
              </p>
              <div className="space-y-2 text-gray-700">
                <Link href="/terms" className="block underline">Terms of Service</Link>
                <Link href="/privacy-policy" className="block underline">Privacy Policy</Link>
                <Link href="/refund-policy" className="block underline">Refund Policy</Link>
                <Link href="/contact" className="block underline">Contact</Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
