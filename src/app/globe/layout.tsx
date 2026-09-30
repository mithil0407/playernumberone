import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Iconik Global Blueprint",
  description:
    "Online personal styling for women outside India: a 30-minute video consultation, then a Style Blueprint with 20 outfits and your colour palette. $97.",
  path: "/globe",
});

export default function GlobeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
