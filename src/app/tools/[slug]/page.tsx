import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LeadMagnetTool from "@/components/LeadMagnetTool";
import { buildMetadata } from "@/lib/seo";
import { getLeadMagnetBySlug, leadMagnetDefinitions } from "@/lib/leadMagnets";
import {
  articleNode,
  breadcrumbList,
  faqPageNode,
  founderPerson,
  graph,
  organizationNode,
} from "@/lib/structuredData";

type ToolPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return leadMagnetDefinitions.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getLeadMagnetBySlug(slug);
  if (!tool) return {};

  return buildMetadata({
    title: tool.seoTitle,
    description: tool.description,
    path: `/tools/${tool.slug}`,
    keywords: [tool.primaryKeyword, ...tool.secondaryKeywords],
  });
}

function howToNode(tool: NonNullable<ReturnType<typeof getLeadMagnetBySlug>>) {
  return {
    "@type": "HowTo",
    name: tool.title,
    description: tool.description,
    step: [
      {
        "@type": "HowToStep",
        name: "Do the physical test",
        text: tool.physicalAction,
      },
      {
        "@type": "HowToStep",
        name: "Choose or enter your observations",
        text: "Use the guided controls to enter what you see or measure.",
      },
      {
        "@type": "HowToStep",
        name: "Read your result",
        text: "Get the free result instantly, then unlock the deeper rule list by email.",
      },
    ],
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getLeadMagnetBySlug(slug);
  if (!tool) notFound();

  const path = `/tools/${tool.slug}`;
  const jsonLd = graph([
    organizationNode,
    founderPerson,
    articleNode({
      title: tool.seoTitle,
      description: tool.description,
      path,
      datePublished: "2026-06-04",
      dateModified: "2026-06-04",
    }),
    faqPageNode(tool.faq),
    howToNode(tool),
    breadcrumbList([
      { name: "Home", path: "/" },
      { name: "Tools", path: "/tools" },
      { name: tool.title, path },
    ]),
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LeadMagnetTool tool={tool} />
    </>
  );
}
