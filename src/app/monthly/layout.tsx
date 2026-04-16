import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Iconik Monthly Styling",
  description:
    "A tiered ongoing styling offer for clients who want regular support, outfit guidance, and stylist access.",
  path: "/monthly",
});

export default function MonthlyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
