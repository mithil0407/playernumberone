import Link from "next/link";
import type { SeoLink } from "@/lib/seoContent";
import { absoluteUrl } from "@/lib/seo";

type Breadcrumb = {
  name: string;
  href?: string;
};

type InfoSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type ServiceInfoPageProps = {
  title: string;
  summary: string;
  breadcrumbs: Breadcrumb[];
  entityNote?: string;
  sections: InfoSection[];
  relatedLinks?: SeoLink[];
  ctaTitle?: string;
  ctaDescription?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export default function ServiceInfoPage({
  title,
  summary,
  breadcrumbs,
  entityNote,
  sections,
  relatedLinks = [],
  ctaTitle,
  ctaDescription,
  ctaHref = "/",
  ctaLabel = "Get My Style Blueprint",
}: ServiceInfoPageProps) {
  const path = breadcrumbs[breadcrumbs.length - 1]?.href ?? "/";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": title,
        "description": summary,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": absoluteUrl(path),
        },
        "author": { "@type": "Organization", "name": "Iconik Styling Team" },
        "publisher": { "@type": "Organization", "name": "Iconik" },
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": crumb.name,
          ...(crumb.href ? { item: absoluteUrl(crumb.href) } : {}),
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-500">
            <ol className="flex flex-wrap items-center gap-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.name}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">›</span>}
                  {crumb.href && index !== breadcrumbs.length - 1 ? (
                    <Link href={crumb.href} className="hover:underline">
                      {crumb.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-gray-800">{crumb.name}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <header className="mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-5 leading-tight">{title}</h1>
            <p className="text-lg text-gray-600 leading-relaxed">{summary}</p>
          </header>

          {entityNote && (
            <div className="mb-10 rounded-xl border border-gray-100 bg-gray-50 p-5 text-sm text-gray-600 leading-relaxed">
              <strong className="text-gray-800">About Iconik:</strong> {entityNote}
            </div>
          )}

          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="text-gray-600 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="space-y-2 list-disc list-inside text-gray-600">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {relatedLinks.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Related Pages</h2>
              <div className="space-y-3">
                {relatedLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="block text-gray-700 underline underline-offset-4">
                    {link.title}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {ctaTitle && ctaDescription && (
            <div className="mt-14 rounded-2xl bg-gray-50 border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{ctaTitle}</h2>
              <p className="text-gray-600 mb-6">{ctaDescription}</p>
              <Link
                href={ctaHref}
                className="inline-block rounded-full bg-black px-8 py-3 text-white font-semibold hover:bg-gray-800 transition-colors"
              >
                {ctaLabel}
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
