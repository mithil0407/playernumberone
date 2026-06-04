import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { leadMagnetDefinitions } from "@/lib/leadMagnets";
import { articleNode, breadcrumbList, graph, organizationNode, founderPerson } from "@/lib/structuredData";

export const metadata: Metadata = buildMetadata({
  title: "Free Style Tools by Iconik",
  description:
    "Free interactive style tools from Iconik: contrast scan, glow test, body shape calculator, proportion code, and face architecture scan.",
  path: "/tools",
  keywords: [
    "free style tools",
    "body shape calculator India",
    "colour analysis quiz",
    "face shape test",
    "personal styling tools",
  ],
});

export default function ToolsHubPage() {
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    articleNode({
      title: "Free Style Tools by Iconik",
      description: "A hub of free interactive personal styling diagnostics by Iconik.",
      path: "/tools",
      datePublished: "2026-06-04",
      dateModified: "2026-06-04",
    }),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Tools", path: "/tools" },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <header className="mb-12 max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">Iconik Tools</p>
            <h1 className="mb-5 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
              Free interactive style diagnostics
            </h1>
            <p className="text-lg leading-relaxed text-gray-600">
              Each tool gives you one immediate, personal styling reveal: colour contrast, closet glow, geometric silhouette, vertical proportion, or face architecture. The core result is free; email unlocks the deeper rule list.
            </p>
          </header>

          <section className="mb-12 rounded-3xl border border-gray-200 bg-gray-50 p-6 md:p-8">
            <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-gray-400">Current colour tool</p>
                <h2 className="mb-3 text-2xl font-bold text-gray-900">Start with the Color Mirror</h2>
                <p className="leading-relaxed text-gray-600">
                  The existing free colour analysis quiz is still live and remains the fastest way to start the Iconik funnel.
                </p>
              </div>
              <div className="md:text-right">
                <Link href="/free-colour-analysis-quiz" className="inline-flex rounded-full bg-black px-7 py-3 font-semibold text-white">
                  Take the Free Colour Quiz
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {leadMagnetDefinitions.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="rounded-3xl border border-gray-200 bg-white p-6 transition hover:bg-gray-50"
              >
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">{tool.eyebrow}</p>
                <h2 className="mb-3 text-2xl font-bold text-gray-900">{tool.title}</h2>
                <p className="mb-5 leading-relaxed text-gray-600">{tool.description}</p>
                <p className="text-sm font-semibold text-gray-900">Start tool →</p>
              </Link>
            ))}
          </section>
        </div>
      </main>
    </>
  );
}
