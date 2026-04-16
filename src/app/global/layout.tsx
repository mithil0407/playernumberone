import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Global Style Blueprint",
  description:
    "Iconik's global Blueprint offer for clients outside the primary India, UAE, and Australia flows.",
  path: "/global",
});

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
