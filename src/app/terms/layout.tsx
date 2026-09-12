import { buildMetadata } from "@/lib/seo";
import SeoSectionChrome from "@/components/seo/SeoSectionChrome";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description: "The legal terms governing Iconik services and subscriptions.",
  path: "/terms",
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <SeoSectionChrome>{children}</SeoSectionChrome>;
}
