import type { Metadata } from "next";
export { SUPPORT_EMAIL } from "@/lib/siteFacts";

export const SITE_NAME = "Iconik";
export const SITE_URL = "https://www.iconik.pro";
export const PRIVACY_EMAIL = "privacy@iconik.pro";
export const OG_IMAGE_URL = `${SITE_URL}/og-image.webp`;

type BuildMetadataOptions = {
  title: string;
  description: string;
  path: string;
  keywords?: string[] | string;
  locale?: string;
  type?: "website" | "article";
  noIndex?: boolean;
  image?: {
    path: string;
    width: number;
    height: number;
    alt: string;
  };
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
};

export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path}`;
}

export function withSiteTitle(title: string) {
  return /\biconik\b/i.test(title) ? title : `${title} | ${SITE_NAME}`;
}

export function buildMetadata({
  title,
  description,
  path,
  keywords,
  locale,
  type = "website",
  noIndex = false,
  image,
  publishedTime,
  modifiedTime,
  authors,
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = withSiteTitle(title);
  const socialImage = image
    ? {
        url: absoluteUrl(image.path),
        width: image.width,
        height: image.height,
        alt: image.alt,
      }
    : {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: fullTitle,
      };

  return {
    title: fullTitle,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      type,
      siteName: SITE_NAME,
      locale,
      images: [socialImage],
      ...(type === "article"
        ? {
            publishedTime,
            modifiedTime,
            authors: authors?.map(absoluteUrl),
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [socialImage.url],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : undefined,
  };
}

export type BuildArticleMetadataOptions = Omit<
  BuildMetadataOptions,
  "type" | "publishedTime" | "modifiedTime" | "authors"
> & {
  datePublished: string;
  dateModified: string;
  authorPath?: string;
};

export function buildArticleMetadata({
  datePublished,
  dateModified,
  authorPath = "/about#founder",
  ...options
}: BuildArticleMetadataOptions): Metadata {
  return buildMetadata({
    ...options,
    type: "article",
    publishedTime: datePublished,
    modifiedTime: dateModified,
    authors: [authorPath],
  });
}

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
