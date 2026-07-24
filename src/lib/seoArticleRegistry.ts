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
  fallbackSrc?: string;
  fallbackIsComposed?: boolean;
  isComposed?: boolean;
  alt: string;
  width: number;
  height: number;
  title: string;
  labels?: readonly string[];
  disclosure?: string;
};

export type SeoArticleRecord = {
  path: `/${string}`;
  articleId: string;
  cluster: SeoArticleCluster;
  eyebrow: string;
  title: string;
  description: string;
  heroSummary?: string;
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
    title: "How to Look Taller in Clothes: A Practical Proportion Guide for Indian Women",
    description:
      "Use rise, garment length, colour continuity, shoulder fit, and vertical fall to look taller—without changing your body or relying on heels.",
    heroSummary:
      "Looking taller in clothes is not about hiding your body. It is about controlling where garments divide it so the eye can travel through one intentional vertical line.",
    keywords: [
      "how to look taller in clothes",
      "how to dress to look taller",
      "petite fashion India",
      "clothes that make you look taller",
      "oversized clothes petite women",
    ],
    datePublished: "2026-03-21",
    dateModified: "2026-07-24",
    reviewer: "Jasmine Rana, Co-Founder and Head Stylist",
    readingTime: "12 minute read",
    breadcrumbs: [
      { href: "/", label: "Home" },
      { href: "/body-type-styling", label: "Body Type Styling" },
      { label: "How to Look Taller with Clothing" },
    ],
    tableOfContents: [
      { href: "#start-with-proportions", label: "Start with proportions" },
      { href: "#vertical-continuity", label: "Build vertical continuity" },
      { href: "#waist-and-rise", label: "Place the waist and rise" },
      { href: "#jeans-and-trousers", label: "Choose jeans and trousers" },
      { href: "#tops-and-layers", label: "Control tops and layers" },
      { href: "#indian-wear", label: "Apply it to Indian wear" },
      { href: "#shopping-checklist", label: "Shopping-room checklist" },
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
      variant: "editorial",
      src: "/images/seo/how-to-look-taller-clothing-hero-iconik.webp",
      isComposed: true,
      alt: "Indian woman beside a visual line diagram explaining how continuous garment lines can create a taller impression",
      width: 1672,
      height: 941,
      title: "Dress The Line",
      labels: ["Continuity", "Proportion", "Vertical Fall"],
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
  "/style-guides/office-wear-indian-women": {
    path: "/style-guides/office-wear-indian-women",
    articleId: "office_wear_indian_women",
    cluster: "style-guide",
    eyebrow: "Wardrobe Intelligence · Work",
    title: "Office Wear for Indian Women: The Complete Professional Style Guide",
    description:
      "Body-specific office outfit formulas, climate-aware fabrics, Indian and western workwear, and a practical 10-piece professional wardrobe.",
    heroSummary:
      "Indian office wear sits at the intersection of professionalism, cultural context, climate, and body-specific fit. Build a wardrobe around your silhouette, undertone, and actual work environment.",
    keywords: [
      "office wear Indian women",
      "professional fashion India",
      "work clothes Indian women",
      "corporate outfit Indian women",
      "what to wear work India",
    ],
    datePublished: "2025-01-01",
    dateModified: "2026-07-24",
    reviewer: "Jasmine Rana, Co-Founder and Head Stylist",
    readingTime: "10 minute read",
    breadcrumbs: [
      { href: "/", label: "Home" },
      { href: "/style-guides", label: "Style Guides" },
      { label: "Office Wear for Indian Women" },
    ],
    tableOfContents: [
      { href: "#why-generic-advice-fails", label: "Why generic advice fails" },
      { href: "#body-type-formulas", label: "Body-type office formulas" },
      { href: "#ethnic-office-wear", label: "Indian ethnic workwear" },
      { href: "#professional-capsule", label: "The 10-piece capsule" },
    ],
    related: [
      { href: "/style-guides/capsule-wardrobe-india", title: "Capsule Wardrobe India", description: "Build a smaller wardrobe where every piece earns its place." },
      { href: "/faq/how-to-dress-for-job-interview-india", title: "Job Interview Dressing", description: "Choose the right level of formality for an Indian interview." },
      { href: "/colour-analysis", title: "Colour Analysis", description: "Choose professional neutrals and accents around your undertone." },
    ],
    visual: {
      variant: "editorial",
      src: "/seo/style-guide/office-wear-indian-women.webp",
      alt: "A fictional Indian professional woman shown in three polished office outfit formulas spanning tailored western and structured ethnic workwear",
      width: 1003,
      height: 1568,
      title: "Professional, Not Generic",
      labels: ["Structured Ethnic", "Modern Corporate"],
    },
    growth: {
      contentCluster: "professional_wardrobe",
      audience: "women",
      hookType: "office_formula",
      visualId: "office_wear_formula",
      visualVariant: "article_4x5",
      contentSource: "seo_office_wear_article",
    },
  },
  "/colour-analysis/olive-skin-india": {
    path: "/colour-analysis/olive-skin-india",
    articleId: "olive_skin_india",
    cluster: "colour-analysis",
    eyebrow: "Chromatic Intelligence · Olive Skin",
    title: "Best Colours for Olive Skin Indian Women",
    description:
      "Olive skin is a surface quality, not an undertone. Identify the warm, cool, or neutral base beneath it and build the right colour palette.",
    heroSummary:
      "Olive skin can have a warm, cool, or neutral undertone beneath its green-grey surface cast. Until that underlying direction is clear, colour recommendations are only guesses.",
    keywords: [
      "olive skin colour guide India",
      "best colours for olive skin Indian women",
      "olive complexion colours India",
      "olive skin undertone India",
      "olive skin palette Indian women",
    ],
    datePublished: "2025-04-01",
    dateModified: "2026-07-15",
    reviewer: "Jasmine Rana, Co-Founder and Head Stylist",
    readingTime: "9 minute read",
    breadcrumbs: [
      { href: "/", label: "Home" },
      { href: "/colour-analysis", label: "Colour Analysis" },
      { label: "Olive Skin India" },
    ],
    tableOfContents: [
      { href: "#olive-is-a-surface-quality", label: "Olive is a surface quality" },
      { href: "#identify-olive-undertone", label: "Identify your undertone" },
      { href: "#warm-olive-colours", label: "Warm olive palette" },
      { href: "#cool-olive-colours", label: "Cool olive palette" },
      { href: "#neutral-olive-colours", label: "Neutral olive palette" },
    ],
    related: [
      { href: "/colour-analysis/how-to-find-undertone", title: "How to Find Your Undertone", description: "Use fabric, jewellery, and natural-light comparisons more reliably." },
      { href: "/colour-analysis/warm-cool-neutral-undertone-india", title: "Warm, Cool or Neutral?", description: "Understand the three undertone directions in Indian skin." },
      { href: "/colour-analysis/saree-colours-by-undertone", title: "Saree Colours by Undertone", description: "Apply your undertone to saree body colour, border, and zari." },
    ],
    visual: {
      variant: "palette",
      src: "/seo/colour-analysis/olive-skin-india.webp",
      alt: "A fictional olive-skinned Indian woman beside warm, cool, and neutral fabric drapes that demonstrate how undertone changes colour harmony",
      width: 1003,
      height: 1568,
      title: "Olive Is Not One Palette",
      labels: ["Warm Olive", "Cool Olive", "Neutral Olive"],
    },
    growth: {
      contentCluster: "indian_skin_tones",
      audience: "women",
      hookType: "olive_undertone",
      visualId: "olive_skin_palette",
      visualVariant: "article_4x5",
      contentSource: "seo_olive_skin_article",
    },
  },
  "/body-type-styling/apple-body-shape-india": {
    path: "/body-type-styling/apple-body-shape-india",
    articleId: "apple_body_shape_india",
    cluster: "body-type",
    eyebrow: "Silhouette Intelligence · Apple",
    title: "What Is an Apple Body Shape? Complete Indian Women's Guide",
    description:
      "Identify an apple silhouette and use Indian garment formulas, structured drape, neckline direction, and clean vertical lines to dress it intentionally.",
    heroSummary:
      "An apple silhouette carries more volume through the midsection relative to the shoulders and hips, often with proportionally slimmer legs. It is a geometry to understand—not a body problem to hide.",
    keywords: [
      "apple body shape India",
      "apple body type Indian women",
      "how to dress apple body shape India",
      "apple body shape kurta India",
      "apple body shape saree",
    ],
    datePublished: "2025-01-01",
    dateModified: "2026-07-24",
    reviewer: "Jasmine Rana, Co-Founder and Head Stylist",
    readingTime: "9 minute read",
    breadcrumbs: [
      { href: "/", label: "Home" },
      { href: "/body-type-styling", label: "Body Type Styling" },
      { label: "Apple Body Shape India" },
    ],
    tableOfContents: [
      { href: "#define-apple-shape", label: "What defines an apple shape" },
      { href: "#identify-apple-shape", label: "How it is identified" },
      { href: "#apple-ethnic-wear", label: "Indian ethnic formulas" },
      { href: "#apple-western-wear", label: "Western wear formulas" },
      { href: "#apple-saree", label: "Saree draping" },
    ],
    related: [
      { href: "/body-type-styling/how-to-dress-tummy", title: "How to Dress a Tummy", description: "Use structure and drape without defaulting to concealment." },
      { href: "/style-guides/saree-draping-body-type", title: "Saree Draping by Body Type", description: "Adjust pleats, pallu, and blouse construction around proportion." },
      { href: "/body-type-styling", title: "Body Type Styling Hub", description: "Compare the complete Iconik silhouette framework." },
    ],
    visual: {
      variant: "editorial",
      src: "/body-type-diagram.webp",
      alt: "Five broad body-proportion patterns used as descriptive starting points in ICONIK styling guidance.",
      width: 1200,
      height: 500,
      title: "Start With Proportion",
      labels: ["Shape Is Descriptive", "Size Is Separate", "Preference Leads"],
    },
    growth: {
      contentCluster: "body_shape_styling",
      audience: "women",
      hookType: "apple_structure",
      visualId: "apple_shape_structure",
      visualVariant: "article_4x5",
      contentSource: "seo_apple_shape_article",
    },
  },
  "/colour-analysis/saree-colours-by-undertone": {
    path: "/colour-analysis/saree-colours-by-undertone",
    articleId: "saree_colours_by_undertone",
    cluster: "colour-analysis",
    eyebrow: "Chromatic Intelligence · Sarees",
    title: "Saree Colours by Undertone: The Complete Indian Guide",
    description:
      "Choose saree body colours, borders, and zari for warm, cool, or neutral Indian undertones—including bridal and occasion palettes.",
    heroSummary:
      "Skin depth tells you how light or deep a colour can be. Undertone tells you which version of that colour will harmonise—and whether gold, silver, or antique zari completes it.",
    keywords: [
      "saree colour by skin tone",
      "best saree colour for warm undertone",
      "saree for cool undertone India",
      "which saree colour suits me",
      "saree colour guide Indian women",
    ],
    datePublished: "2025-04-01",
    dateModified: "2026-07-15",
    reviewer: "Jasmine Rana, Co-Founder and Head Stylist",
    readingTime: "10 minute read",
    breadcrumbs: [
      { href: "/", label: "Home" },
      { href: "/colour-analysis", label: "Colour Analysis" },
      { label: "Saree Colours by Undertone" },
    ],
    tableOfContents: [
      { href: "#undertone-over-depth", label: "Undertone over skin depth" },
      { href: "#warm-undertone-sarees", label: "Warm undertone sarees" },
      { href: "#cool-undertone-sarees", label: "Cool undertone sarees" },
      { href: "#neutral-undertone-sarees", label: "Neutral undertone sarees" },
      { href: "#bridal-sarees", label: "Bridal palettes" },
    ],
    related: [
      { href: "/colour-analysis/how-to-find-undertone", title: "How to Find Your Undertone", description: "Identify warm, cool, or neutral before choosing your saree." },
      { href: "/style-guides/saree-draping-body-type", title: "Saree Draping by Body Type", description: "Pair chromatic harmony with proportion-aware draping." },
      { href: "/colour-analysis/colour-analysis-for-indian-weddings", title: "Wedding Colour Analysis", description: "Coordinate bridal and occasion palettes around undertone and contrast." },
    ],
    visual: {
      variant: "palette",
      src: "/seo/colour-analysis/saree-colours-by-undertone.webp",
      alt: "Three fictional Indian women with varied skin depths wearing warm, cool, and neutral undertone saree palettes with matching zari direction",
      width: 1003,
      height: 1568,
      title: "One Saree Hue, Three Directions",
      labels: ["Warm + Gold", "Cool + Silver", "Neutral + Antique Gold"],
    },
    growth: {
      contentCluster: "saree_colour",
      audience: "women",
      hookType: "undertone_palette",
      visualId: "saree_undertone_palette",
      visualVariant: "article_4x5",
      contentSource: "seo_saree_colour_article",
    },
  },
  "/faq/how-much-does-personal-stylist-cost-india": {
    path: "/faq/how-much-does-personal-stylist-cost-india",
    articleId: "personal_stylist_cost_india",
    cluster: "faq",
    eyebrow: "Service Intelligence · Pricing",
    title: "Personal Stylist Cost in India: 2026 Price Guide",
    description:
      "Compare indicative 2026 prices for virtual styling, wardrobe consultations, personal shopping, occasion styling, and ongoing support in India.",
    heroSummary:
      "Personal styling in India ranges from entry-level digital guidance to multi-session shopping and wardrobe engagements. Price only makes sense when compared with scope, personalisation, and reusable deliverables.",
    keywords: [
      "personal stylist cost India",
      "personal styling price India",
      "wardrobe consultation cost India",
      "online personal stylist India price",
    ],
    datePublished: "2026-03-23",
    dateModified: "2026-07-15",
    reviewer: "Jasmine Rana, Co-Founder and Head Stylist",
    readingTime: "7 minute read",
    breadcrumbs: [
      { href: "/", label: "Home" },
      { href: "/faq", label: "FAQ" },
      { label: "Personal Stylist Cost in India" },
    ],
    tableOfContents: [
      { href: "#styling-costs", label: "Service types and prices" },
      { href: "#price-factors", label: "What determines the price" },
      { href: "#price-sources", label: "Sources and limitations" },
      { href: "#choose-service", label: "Choose the right service" },
    ],
    related: [
      { href: "/online-personal-stylist-india", title: "Online Personal Stylist India", description: "See how a fully remote styling engagement works." },
      { href: "/blog/is-personal-stylist-worth-it-india", title: "Is a Personal Stylist Worth It?", description: "Evaluate the return based on your wardrobe problem." },
      { href: "/pricing", title: "Iconik Pricing", description: "Review current deliverables, service terms, and pricing." },
    ],
    visual: {
      variant: "editorial",
      src: "/seo/faq/personal-stylist-cost-india.webp",
      alt: "A fictional Indian client and personal stylist reviewing a structured wardrobe plan, colour palette, and outfit selections during a premium consultation",
      width: 1003,
      height: 1568,
      title: "What Are You Paying For?",
      labels: ["Analysis", "Outfit Direction", "Ongoing Support"],
    },
    growth: {
      contentCluster: "personal_styling_service",
      audience: "women",
      hookType: "price_comparison",
      visualId: "styling_service_scope",
      visualVariant: "article_4x5",
      contentSource: "seo_personal_stylist_cost_article",
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
