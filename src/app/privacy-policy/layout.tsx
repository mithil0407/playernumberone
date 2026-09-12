import { buildMetadata } from "@/lib/seo";
import SeoSectionChrome from "@/components/seo/SeoSectionChrome";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How Iconik collects, uses, and protects your information.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <SeoSectionChrome>{children}</SeoSectionChrome>;
}
