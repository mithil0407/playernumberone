import { existsSync } from "node:fs";
import path from "node:path";
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

function publicAssetExists(assetPath: string | undefined) {
  if (!assetPath?.startsWith("/")) return false;
  return existsSync(path.join(process.cwd(), "public", assetPath.slice(1)));
}

export function resolveSeoArticleVisual(article: SeoArticleRecord) {
  if (!article.visual) return undefined;
  if (publicAssetExists(article.visual.src)) return article.visual.src;
  if (publicAssetExists(article.visual.fallbackSrc)) return article.visual.fallbackSrc;
  return undefined;
}

function openGraphPath(article: SeoArticleRecord) {
  const visualPath = resolveSeoArticleVisual(article);
  if (!visualPath) return undefined;
  const ogPath = visualPath.replace(/\.webp$/, "-og.webp");
  return publicAssetExists(ogPath) ? ogPath : undefined;
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
  const visualPath = resolveSeoArticleVisual(article);
  const visualImages = visualPath
    ? [visualPath, openGraphPath(article)].filter((item): item is string => Boolean(item))
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
