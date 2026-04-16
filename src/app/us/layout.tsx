import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Personal Styling for Women in the US",
  description:
    "Iconik's style blueprint for women in the United States. Personal styling, colour analysis, and outfit direction delivered online.",
  path: "/us",
  locale: "en_US",
});

export default function USLayout({ children }: { children: React.ReactNode }) {
  return children;
}
