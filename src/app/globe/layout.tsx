import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Iconik Global Blueprint",
  description:
    "A global styling funnel for international clients who want Iconik's blueprint-led styling process.",
  path: "/globe",
});

export default function GlobeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
