import Link from "next/link";
import type { SeoLink } from "@/lib/seoContent";
import { absoluteUrl } from "@/lib/seo";
import { BLUEPRINT_OFFER, FOUNDERS } from "@/lib/siteFacts";
import {
  SeoBreadcrumbs,
  SeoEditorialFooter,
  SeoEditorialHeader,
} from "@/components/seo/SeoEditorial";

type Breadcrumb = {
  name: string;
  href?: string;
};

type HubSection = {
  title: string;
  description?: string;
  links: SeoLink[];
};

type CollectionHubPageProps = {
  eyebrow?: string;
  title: string;
  summary: string;
  breadcrumbs: Breadcrumb[];
  sections: HubSection[];
  entityNote?: string;
  updated?: string;
  reviewedBy?: string;
  ctaTitle?: string;
  ctaDescription?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export default function CollectionHubPage({
  eyebrow = "ICONIK resource library",
  title,
  summary,
  breadcrumbs,
  sections,
  entityNote,
  updated = "24 July 2026",
  reviewedBy = FOUNDERS[0].name,
  ctaTitle,
  ctaDescription,
  ctaHref = BLUEPRINT_OFFER.offerPath,
  ctaLabel = "Get My Style Blueprint",
}: CollectionHubPageProps) {
  const path = breadcrumbs[breadcrumbs.length - 1]?.href ?? "/";
  const allLinks = sections.flatMap((section) => section.links);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${absoluteUrl(path)}#collection`,
        "name": title,
        "description": summary,
        "url": absoluteUrl(path),
        "dateModified": "2026-07-24",
        "about": sections.map((section) => section.title),
        "hasPart": allLinks.map((link) => ({
          "@type": "WebPage",
          "name": link.title,
          "url": absoluteUrl(link.href),
        })),
        "reviewedBy": {
          "@type": "Person",
          "name": FOUNDERS[0].name,
          "jobTitle": FOUNDERS[0].title,
          "sameAs": FOUNDERS[0].linkedIn,
        },
      },
      {
        "@type": "ItemList",
        "@id": `${absoluteUrl(path)}#resources`,
        "name": `${title} resources`,
        "numberOfItems": allLinks.length,
        "itemListElement": allLinks.map((link, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": link.title,
          "url": absoluteUrl(link.href),
        })),
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
    <div className="seo-editorial min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <a href="#hub-content" className="seo-skip-link">Skip to resources</a>
      <SeoEditorialHeader />
      <main id="hub-content">
        <div className="seo-editorial-shell pb-20">
          <header className="max-w-5xl pb-12 pt-14 md:pb-16 md:pt-24">
            <SeoBreadcrumbs
              items={breadcrumbs.map((crumb, index) => ({
                label: crumb.name,
                href: index === breadcrumbs.length - 1 ? undefined : crumb.href,
              }))}
            />
            <p className="seo-eyebrow">{eyebrow}</p>
            <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-fraunces)] text-[clamp(2.9rem,7vw,5.8rem)] font-light leading-[0.98] tracking-[-0.045em] text-[var(--seo-ink)]">
              {title}
            </h1>
            <p className="seo-dek">{summary}</p>
            <ul className="seo-article-meta" aria-label="Page information">
              <li>Updated {updated}</li>
              <li>Reviewed by {reviewedBy}</li>
              <li>{allLinks.length} resources</li>
            </ul>
          </header>

          {entityNote && (
            <aside className="mb-16 grid gap-3 rounded-[1.75rem] border border-white/40 bg-[linear-gradient(145deg,var(--seo-slate),var(--seo-slate-deep))] p-7 text-white shadow-[0_28px_72px_rgba(65,80,86,0.18)] md:grid-cols-[10rem_1fr] md:p-10">
              <p className="seo-eyebrow text-white/70">How to use this hub</p>
              <p className="max-w-3xl text-base leading-8 text-white/90 md:text-lg">{entityNote}</p>
            </aside>
          )}

          <div className="space-y-16">
            {sections.map((section, sectionIndex) => (
              <section key={section.title} aria-labelledby={`hub-section-${sectionIndex}`}>
                <div className="mb-7 max-w-3xl border-t border-[rgba(44,38,34,0.14)] pt-7">
                  <p className="seo-eyebrow">0{sectionIndex + 1}</p>
                  <h2
                    id={`hub-section-${sectionIndex}`}
                    className="mt-3 font-[family-name:var(--font-fraunces)] text-3xl font-light tracking-[-0.025em] text-[var(--seo-ink)] md:text-4xl"
                  >
                    {section.title}
                  </h2>
                  {section.description && (
                    <p className="mt-3 leading-7 text-[rgba(44,38,34,0.68)]">{section.description}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {section.links.map((link, linkIndex) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group flex min-h-52 flex-col rounded-[1.5rem] border border-[rgba(44,38,34,0.12)] bg-white/35 p-6 transition duration-200 hover:-translate-y-1 hover:border-[rgba(44,38,34,0.26)] hover:bg-white/60 hover:shadow-[0_18px_45px_rgba(44,38,34,0.08)]"
                    >
                      <span className="seo-eyebrow">Guide {String(linkIndex + 1).padStart(2, "0")}</span>
                      <h3 className="mt-8 font-[family-name:var(--font-fraunces)] text-2xl font-normal leading-tight text-[var(--seo-ink)]">
                        {link.title}
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-[rgba(44,38,34,0.64)]">{link.description}</p>
                      <span className="mt-6 text-sm font-semibold text-[var(--seo-ink)]">
                        Read resource <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {ctaTitle && ctaDescription && (
            <aside className="mt-20 rounded-[2rem] bg-[var(--seo-ink)] p-8 text-[var(--seo-warm-white)] md:p-12">
              <p className="seo-eyebrow text-white/55">Personal guidance</p>
              <h2 className="mt-4 max-w-3xl font-[family-name:var(--font-fraunces)] text-3xl font-light leading-tight md:text-5xl">{ctaTitle}</h2>
              <p className="mt-5 max-w-2xl leading-7 text-white/70">{ctaDescription}</p>
              <Link
                href={ctaHref}
                className="mt-7 inline-flex items-center gap-3 rounded-full bg-[var(--seo-warm-white)] px-6 py-3 text-sm font-semibold text-[var(--seo-ink)] transition-transform hover:-translate-y-0.5"
              >
                {ctaLabel} <span aria-hidden="true">→</span>
              </Link>
            </aside>
          )}
        </div>
      </main>
      <SeoEditorialFooter />
    </div>
  );
}
