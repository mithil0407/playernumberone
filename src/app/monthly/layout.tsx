import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Iconik Monthly Styling",
  description:
    "Monthly styling support from ICONIK: regular outfit guidance, seasonal updates and stylist access, with plans for different levels of help.",
  path: "/monthly",
});

export default function MonthlyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
