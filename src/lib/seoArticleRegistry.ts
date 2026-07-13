import type { SeoBreadcrumb, SeoRelatedLink, SeoTocItem } from "@/components/seo/SeoEditorial";

export type SeoArticleCluster =
  | "body-type"
  | "colour-analysis"
  | "style-guide"
  | "faq"
  | "methodology"
  | "comparison"
  | "blog";

export type SeoVisualVariant = "comparison" | "palette" | "editorial";

export type SeoArticleVisualConfig = {
  variant: SeoVisualVariant;
  src: string;
  alt: string;
  width: number;
  height: number;
  title: string;
  labels?: [string, string?];
  disclosure?: string;
};

export type SeoArticleRecord = {
  path: `/${string}`;
  articleId: string;
  cluster: SeoArticleCluster;
  eyebrow: string;
  title: string;
  description: string;
  keywords: string[];
  datePublished: `${number}-${number}-${number}`;
  dateModified: `${number}-${number}-${number}`;
  reviewer: string;
  readingTime: string;
  breadcrumbs: SeoBreadcrumb[];
  tableOfContents: SeoTocItem[];
  related: SeoRelatedLink[];
  visual?: SeoArticleVisualConfig;
  growth: {
    contentCluster: string;
    audience: "women" | "men";
    hookType: string;
    visualId?: string;
    visualVariant?: string;
    contentSource: string;
  };
};

const records = {
  "/body-type-styling/how-to-look-taller-clothing": {
    path: "/body-type-styling/how-to-look-taller-clothing",
    articleId: "how_to_look_taller_clothing",
    cluster: "body-type",
    eyebrow: "Silhouette Intelligence · Proportion",
    title: "How to Look Taller in Clothes: 12 Proportion Rules for Indian Women",
    description:
      "Use rise, garment length, colour continuity, shoulder fit, and vertical fall to look taller—without changing your body or relying on heels.",
    keywords: [
      "how to look taller in clothes",
      "how to dress to look taller",
      "petite fashion India",
      "clothes that make you look taller",
      "oversized clothes petite women",
    ],
    datePublished: "2026-03-21",
    dateModified: "2026-07-11",
    reviewer: "Mithil Navalakha, Iconik founder",
    readingTime: "9 minute read",
    breadcrumbs: [
      { href: "/", label: "Home" },
      { href: "/body-type-styling", label: "Body Type Styling" },
      { label: "How to Look Taller with Clothing" },
    ],
    tableOfContents: [
      { href: "#vertical-line-method", label: "The vertical line method" },
      { href: "#fit-direction", label: "Fit direction" },
      { href: "#twelve-rules", label: "The 12 proportion rules" },
      { href: "#indian-outfits", label: "Indian outfit applications" },
    ],
    related: [
      {
        href: "/body-type-styling/petite-india",
        title: "Petite Styling India",
        description: "Scale, length, and proportion guidance for petite Indian women.",
      },
      {
        href: "/body-type-styling/short-torso-styling",
        title: "Short Torso Styling",
        description: "Adjust rise and waist placement to improve vertical balance.",
      },
      {
        href: "/style-guides/kurti-length-guide",
        title: "Kurti Length Guide",
        description: "Choose kurti hems around your full outfit proportions.",
      },
    ],
    visual: {
      variant: "comparison",
      src: "/seo/oversized-vs-intentional-silhouette.webp",
      alt: "The same fictional Indian woman in an oversized outfit and an intentionally fitted outfit, with garment construction details annotated",
      width: 1600,
      height: 2000,
      title: "Oversized vs Intentional",
      labels: ["Oversized", "Intentional"],
    },
    growth: {
      contentCluster: "silhouette_proportions",
      audience: "women",
      hookType: "oversized_vs_intentional",
      visualId: "oversized_intentional_silhouette",
      visualVariant: "article_4x5",
      contentSource: "seo_look_taller_article",
    },
  },
} as const satisfies Record<string, SeoArticleRecord>;

export type RegisteredSeoArticlePath = keyof typeof records;

export function getSeoArticle(path: RegisteredSeoArticlePath): SeoArticleRecord {
  return records[path];
}

export function getSeoArticleOrThrow(path: string): SeoArticleRecord {
  const article = (records as Record<string, SeoArticleRecord>)[path];
  if (!article) throw new Error(`SEO article is not registered: ${path}`);
  return article;
}

export const seoArticleRegistry: readonly SeoArticleRecord[] = Object.values(records);
