import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About Iconik",
  description:
    "Learn what Iconik is, who it serves, and how its scientific styling methodology is designed for Indian women.",
  path: "/about",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
