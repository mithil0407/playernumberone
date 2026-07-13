import Link from "next/link";
import type { ReactNode } from "react";

export type SeoBreadcrumb = {
  href?: string;
  label: string;
};

export type SeoTocItem = {
  href: `#${string}`;
  label: string;
};

export type SeoRelatedLink = {
  href: string;
  title: string;
  description: string;
};

const primaryNavigation = [
  { href: "/methodology", label: "Methodology" },
  { href: "/colour-analysis", label: "Colour" },
  { href: "/body-type-styling", label: "Silhouette" },
  { href: "/style-guides", label: "Style Guides" },
];

export function SeoEditorialHeader() {
  return (
    <header className="seo-editorial-header">
      <div className="seo-editorial-shell flex h-[4.5rem] items-center justify-between gap-5">
        <Link href="/" className="seo-wordmark" aria-label="Iconik home">
          ICONIK
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {primaryNavigation.map((item) => (
            <Link key={item.href} href={item.href} className="seo-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/checkout" className="seo-header-cta">
          Get My Blueprint
        </Link>
      </div>
      <nav aria-label="Article categories" className="seo-mobile-nav md:hidden">
        {primaryNavigation.map((item) => (
          <Link key={item.href} href={item.href} className="seo-nav-link shrink-0">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SeoBreadcrumbs({ items }: { items: SeoBreadcrumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="seo-breadcrumbs">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

type SeoArticleHeroProps = {
  eyebrow: string;
  title: string;
  summary: string;
  breadcrumbs: SeoBreadcrumb[];
  published?: string;
  updated?: string;
  reviewer?: string;
  readingTime?: string;
};

export function SeoArticleHero({
  eyebrow,
  title,
  summary,
  breadcrumbs,
  published,
  updated,
  reviewer,
  readingTime,
}: SeoArticleHeroProps) {
  const meta = [
    published ? `Published ${published}` : undefined,
    updated ? `Updated ${updated}` : undefined,
    reviewer ? `Reviewed by ${reviewer}` : undefined,
    readingTime,
  ].filter(Boolean) as string[];

  return (
    <header className="seo-article-hero">
      <SeoBreadcrumbs items={breadcrumbs} />
      <p className="seo-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="seo-dek">{summary}</p>
      {meta.length > 0 && (
        <ul className="seo-article-meta" aria-label="Article information">
          {meta.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
    </header>
  );
}

export function SeoQuickAnswer({
  title = "The short answer",
  answer,
  detail,
}: {
  title?: string;
  answer: ReactNode;
  detail?: ReactNode;
}) {
  return (
    <aside className="seo-quick-answer" aria-label={title}>
      <p className="seo-eyebrow text-white/70">{title}</p>
      <div className="seo-quick-answer-lead">{answer}</div>
      {detail && <div className="seo-quick-answer-detail">{detail}</div>}
    </aside>
  );
}

export function SeoTableOfContents({ items }: { items: SeoTocItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="On this page" className="seo-toc">
      <p className="seo-eyebrow">On this page</p>
      <ol>
        {items.map((item, index) => (
          <li key={item.href}>
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <a href={item.href}>{item.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function SeoInsightCard({
  eyebrow,
  title,
  children,
  tone = "bone",
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  tone?: "bone" | "ivory" | "slate";
}) {
  return (
    <aside className={`seo-insight-card seo-insight-card-${tone}`}>
      {eyebrow && <p className="seo-eyebrow">{eyebrow}</p>}
      <h3>{title}</h3>
      <div>{children}</div>
    </aside>
  );
}

export function SeoFaqSection({ faqs }: { faqs: { q: string; a: string }[] }) {
  return (
    <section className="seo-faq" aria-labelledby="frequently-asked-questions">
      <p className="seo-eyebrow">Reader questions</p>
      <h2 id="frequently-asked-questions">Frequently Asked Questions</h2>
      <div className="seo-faq-list">
        {faqs.map((faq) => (
          <details key={faq.q}>
            <summary>{faq.q}</summary>
            <p>{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function SeoAuthorReview({
  name = "Mithil Navalakha",
  role = "Founder, Iconik",
  children,
}: {
  name?: string;
  role?: string;
  children?: ReactNode;
}) {
  return (
    <aside className="seo-author-review">
      <div aria-hidden="true" className="seo-author-monogram">MN</div>
      <div>
        <p className="seo-eyebrow">Expert review</p>
        <h2>{name}</h2>
        <p className="seo-author-role">{role}</p>
        {children && <div className="seo-author-copy">{children}</div>}
        <Link href="/about">About Iconik&apos;s methodology →</Link>
      </div>
    </aside>
  );
}

export function SeoRelatedGuides({ links }: { links: SeoRelatedLink[] }) {
  return (
    <section className="seo-related" aria-labelledby="related-guides">
      <p className="seo-eyebrow">Continue exploring</p>
      <h2 id="related-guides">Related Guides</h2>
      <div className="seo-related-grid">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <span className="seo-related-arrow" aria-hidden="true">↗</span>
            <h3>{link.title}</h3>
            <p>{link.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function SeoBlueprintCta({
  title = "Turn the guidance into your personal style system.",
  description = "Your Iconik Style Blueprint maps silhouette, colour, face architecture, and real outfit formulas to you.",
  href = "/checkout",
  label = "Get My Style Blueprint",
}: {
  title?: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <aside className="seo-blueprint-cta">
      <p className="seo-eyebrow text-white/60">Your next step</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link href={href}>{label}<span aria-hidden="true">→</span></Link>
    </aside>
  );
}

export function SeoEditorialFooter() {
  return (
    <footer className="seo-editorial-footer">
      <div className="seo-editorial-shell flex flex-col justify-between gap-4 py-8 md:flex-row md:items-center">
        <Link href="/" className="seo-wordmark">ICONIK</Link>
        <p>Scientific personal styling for Indian women.</p>
        <div className="flex gap-5">
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/privacy-policy">Privacy</Link>
        </div>
      </div>
    </footer>
  );
}

export function SeoArticleLayout({
  hero,
  quickAnswer,
  tableOfContents,
  children,
  afterArticle,
}: {
  hero: SeoArticleHeroProps;
  quickAnswer?: ReactNode;
  tableOfContents?: SeoTocItem[];
  children: ReactNode;
  afterArticle?: ReactNode;
}) {
  return (
    <div className="seo-editorial min-h-screen">
      <a href="#article-content" className="seo-skip-link">Skip to article</a>
      <SeoEditorialHeader />
      <main>
        <div className="seo-editorial-shell">
          <SeoArticleHero {...hero} />
          {quickAnswer}
          <div className="seo-article-grid">
            {tableOfContents && <SeoTableOfContents items={tableOfContents} />}
            <article id="article-content" className="seo-article-prose">
              {children}
            </article>
          </div>
          {afterArticle}
        </div>
      </main>
      <SeoEditorialFooter />
    </div>
  );
}
