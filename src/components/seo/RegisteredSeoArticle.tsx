import type { ReactNode } from "react";
import Image from "next/image";
import { ArticleGrowthTracker } from "@/components/ArticleGrowthTracker";
import IconikArticleVisual from "@/components/IconikArticleVisual";
import InstagramReelsForArticle from "@/components/seo/InstagramReelsForArticle";
import type { SeoArticleRecord } from "@/lib/seoArticleRegistry";
import {
  buildSeoArticleGraph,
  growthTrackingForArticle,
  resolveSeoArticleVisual,
} from "@/lib/seoArticle";
import {
  SeoArticleLayout,
  SeoAuthorReview,
  SeoBlueprintCta,
  SeoFaqSection,
  SeoQuickAnswer,
  SeoRelatedGuides,
} from "@/components/seo/SeoEditorial";

type RegisteredSeoArticleProps = {
  article: SeoArticleRecord;
  faqs: { q: string; a: string }[];
  quickAnswer: ReactNode;
  quickAnswerDetail?: ReactNode;
  children: ReactNode;
  beforeFooter?: ReactNode;
  cta?: {
    title?: string;
    description?: string;
    href?: string;
    label?: string;
  };
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function VisualPlaceholder({ article }: { article: SeoArticleRecord }) {
  if (!article.visual) return null;

  return (
    <figure className="my-12 md:my-16">
      <div className="seo-visual-placeholder" role="img" aria-label={article.visual.alt}>
        <div className="seo-visual-placeholder-header">
          <p>ICONIK</p>
          <span>{article.visual.title}</span>
          <small>{article.eyebrow}</small>
        </div>
        <div className="seo-visual-placeholder-stage" aria-hidden="true">
          <span />
          <span />
          <i />
        </div>
        <div className="seo-visual-placeholder-labels">
          {article.visual.labels?.map((label) => <span key={label}>{label}</span>)}
        </div>
      </div>
      <figcaption className="mx-auto mt-3 max-w-5xl px-2 text-xs leading-relaxed text-[#2C2622]/50">
        Editorial visual reserved. The article guidance is complete; the final visual can be added without changing this page.
      </figcaption>
    </figure>
  );
}

function ComposedFallbackVisual({ article, src }: { article: SeoArticleRecord; src: string }) {
  if (!article.visual) return null;

  return (
    <figure className="my-12 md:my-16">
      <Image
        src={src}
        alt={article.visual.alt}
        width={article.visual.width}
        height={article.visual.height}
        sizes="(max-width: 768px) 100vw, 1024px"
        className="mx-auto h-auto w-full max-w-5xl rounded-[2rem] shadow-[0_28px_80px_rgba(38,52,58,0.24)]"
      />
      <figcaption className="mx-auto mt-3 max-w-5xl px-2 text-xs leading-relaxed text-[#2C2622]/50">
        AI-generated editorial visual informed by Iconik&apos;s styling methodology. No real client or celebrity is depicted.
      </figcaption>
    </figure>
  );
}

export default function RegisteredSeoArticle({
  article,
  faqs,
  quickAnswer,
  quickAnswerDetail,
  children,
  beforeFooter,
  cta,
}: RegisteredSeoArticleProps) {
  const jsonLd = buildSeoArticleGraph(article, { faqs });
  const tracking = growthTrackingForArticle(article);
  const visualSrc = resolveSeoArticleVisual(article);
  const usesComposedFallback = Boolean(
    visualSrc &&
    article.visual?.fallbackIsComposed &&
    visualSrc === article.visual.fallbackSrc,
  );
  const usesComposedVisual = Boolean(article.visual?.isComposed || usesComposedFallback);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ArticleGrowthTracker {...tracking} />
      <SeoArticleLayout
        hero={{
          eyebrow: article.eyebrow,
          title: article.title,
          summary: article.heroSummary ?? article.description,
          breadcrumbs: article.breadcrumbs,
          published: formatDate(article.datePublished),
          updated: formatDate(article.dateModified),
          reviewer: article.reviewer,
          readingTime: article.readingTime,
        }}
        quickAnswer={
          <>
            <SeoQuickAnswer answer={quickAnswer} detail={quickAnswerDetail} />
            {article.visual && visualSrc && usesComposedVisual ? (
              <ComposedFallbackVisual article={article} src={visualSrc} />
            ) : article.visual && visualSrc ? (
              <IconikArticleVisual
                variant="editorial"
                imageSrc={visualSrc}
                imageAlt={article.visual.alt}
                title={article.visual.title}
                subtitle={article.eyebrow}
                labels={article.visual.labels?.filter((label): label is string => Boolean(label))}
              />
            ) : article.visual ? <VisualPlaceholder article={article} /> : null}
          </>
        }
        tableOfContents={article.tableOfContents}
        afterArticle={
          <>
            <InstagramReelsForArticle articlePath={article.path} />
            <SeoFaqSection faqs={faqs} />
            <SeoAuthorReview>
              Iconik guidance combines proportion, colour relationships, garment construction, and the practical realities of Indian wardrobes. Recommendations are reviewed before publication and updated when the underlying guidance changes.
            </SeoAuthorReview>
            <SeoRelatedGuides links={article.related} />
            {beforeFooter}
            <SeoBlueprintCta {...cta} />
          </>
        }
      >
        {children}
      </SeoArticleLayout>
    </>
  );
}
