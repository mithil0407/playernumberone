import type { GrowthEventParameters } from "@/lib/growthAnalytics";
import { buildArticleMetadata } from "@/lib/seo";
import type { SeoArticleRecord } from "@/lib/seoArticleRegistry";
import {
  articleNode,
  breadcrumbList,
  faqPageNode,
  founderPerson,
  graph,
  organizationNode,
} from "@/lib/structuredData";

function openGraphPath(article: SeoArticleRecord) {
  if (!article.visual) return undefined;
  return article.visual.src.replace(/\.webp$/, "-og.webp");
}

export function buildSeoArticleMetadata(article: SeoArticleRecord) {
  const ogPath = openGraphPath(article);
  return buildArticleMetadata({
    title: article.title,
    description: article.description,
    path: article.path,
    keywords: article.keywords,
    locale: "en_IN",
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    ...(ogPath
      ? {
          image: {
            path: ogPath,
            width: 1200,
            height: 630,
            alt: article.visual?.alt ?? article.title,
          },
        }
      : {}),
  });
}

export function buildSeoArticleGraph(
  article: SeoArticleRecord,
  options: {
    faqs?: { q: string; a: string }[];
    about?: string[];
  } = {},
) {
  const visualImages = article.visual
    ? [article.visual.src, openGraphPath(article)].filter((item): item is string => Boolean(item))
    : undefined;

  return graph([
    organizationNode,
    founderPerson,
    articleNode({
      title: article.title,
      description: article.description,
      path: article.path,
      datePublished: article.datePublished,
      dateModified: article.dateModified,
      images: visualImages,
      about: options.about ?? [article.cluster],
    }),
    ...(options.faqs?.length ? [faqPageNode(options.faqs)] : []),
    breadcrumbList(
      article.breadcrumbs.map((item) => ({
        name: item.label,
        path: item.href,
      })),
    ),
  ]);
}

export function growthTrackingForArticle(article: SeoArticleRecord) {
  return {
    article_id: article.articleId,
    content_cluster: article.growth.contentCluster,
    audience: article.growth.audience,
    hook_type: article.growth.hookType,
    visual_id: article.growth.visualId,
    visual_variant: article.growth.visualVariant,
    content_source: article.growth.contentSource,
  } satisfies GrowthEventParameters & {
    article_id: string;
    content_cluster: string;
    audience: "women" | "men";
  };
}
