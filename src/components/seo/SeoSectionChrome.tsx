import type { ReactNode } from "react";
import { SeoEditorialFooter, SeoEditorialHeader } from "@/components/seo/SeoEditorial";

/**
 * Gives older SEO pages the same site chrome and editorial canvas as the
 * canonical article template. Pages already using SeoArticleLayout keep their
 * own header and footer; CSS suppresses this outer pair for those routes.
 */
export default function SeoSectionChrome({ children }: { children: ReactNode }) {
  return (
    <div className="seo-editorial seo-section-chrome min-h-screen">
      <SeoEditorialHeader />
      <div className="seo-section-page">{children}</div>
      <SeoEditorialFooter />
    </div>
  );
}
