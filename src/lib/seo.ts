import type { Metadata } from "next";

export const SITE_NAME = "Iconik";
export const SITE_URL = "https://www.iconik.pro";
export const SUPPORT_EMAIL = "support@iconik.pro";
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
};

export function absoluteUrl(path: string) {
  if (!path || path === "/") return SITE_URL;
  return `${SITE_URL}${path}`;
}

export function buildMetadata({
  title,
  description,
  path,
  keywords,
  locale,
  type = "website",
  noIndex = false,
}: BuildMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
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
      images: [
        {
          url: OG_IMAGE_URL,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [OG_IMAGE_URL],
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
