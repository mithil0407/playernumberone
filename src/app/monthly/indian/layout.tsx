import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Iconik Monthly Styling India",
  description:
    "Ongoing personal styling support for Indian women with monthly guidance, seasonal updates, and subscription tiers.",
  path: "/monthly/indian",
  locale: "en_IN",
});

export default function MonthlyIndianLayout({ children }: { children: React.ReactNode }) {
  return children;
}
