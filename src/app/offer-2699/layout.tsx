import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "ICONIK Style Blueprint Offer",
  description:
    "Get a personalised ICONIK Style Blueprint with outfit formulas, colour guidance, and a private stylist consultation.",
  path: "/offer-2699",
  locale: "en_IN",
  noIndex: true,
});

export default function Offer2699Layout({ children }: { children: React.ReactNode }) {
  return children;
}
