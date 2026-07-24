import type { ReactNode } from "react";
import SeoSectionChrome from "@/components/seo/SeoSectionChrome";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <SeoSectionChrome>{children}</SeoSectionChrome>;
}
