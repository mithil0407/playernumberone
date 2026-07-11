import { absoluteUrl, OG_IMAGE_URL, SITE_NAME, SITE_URL } from "@/lib/seo";

export const founderPerson = {
  "@type": "Person",
  "@id": `${SITE_URL}/about#founder`,
  name: "Mithil Navalakha",
  url: `${SITE_URL}/about`,
  jobTitle: "Founder, Iconik",
  worksFor: { "@id": `${SITE_URL}/#organization` },
};

export const organizationNode = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  legalName: "Iconik",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: OG_IMAGE_URL,
  },
  founder: { "@id": `${SITE_URL}/about#founder` },
  areaServed: ["IN", "AE", "AU"],
  serviceType: "Personal Styling",
  sameAs: [
    "https://www.instagram.com/iconik.style/",
    "https://www.instagram.com/iconik.men/",
    "https://www.linkedin.com/company/iconik-llp",
  ],
};

export function graph(nodes: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

export function breadcrumbList(items: { name: string; path?: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}

export function articleNode({
  title,
  description,
  path,
  datePublished = "2025-01-01",
  dateModified = "2026-06-04",
  images,
}: {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
  images?: string[];
}) {
  return {
    "@type": "Article",
    "@id": `${absoluteUrl(path)}#article`,
    headline: title,
    description,
    author: { "@id": `${SITE_URL}/about#founder` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    datePublished,
    dateModified,
    image: images?.length ? images.map(absoluteUrl) : [OG_IMAGE_URL],
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(path) },
  };
}

export function faqPageNode(faqs: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}

export function serviceNode({
  name,
  description,
  path,
  areaServed,
  price = "3299",
  currency = "INR",
}: {
  name: string;
  description: string;
  path: string;
  areaServed?: string;
  price?: string;
  currency?: string;
}) {
  return {
    "@type": "Service",
    "@id": `${absoluteUrl(path)}#service`,
    name,
    description,
    provider: { "@id": `${SITE_URL}/#organization` },
    ...(areaServed ? { areaServed: { "@type": "City", name: areaServed } } : {}),
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
    },
  };
}
