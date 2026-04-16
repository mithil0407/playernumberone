import Link from "next/link";
import type { SeoLink } from "@/lib/seoContent";

type ExploreLinksSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  groups: {
    title: string;
    links: SeoLink[];
  }[];
  className?: string;
};

export default function ExploreLinksSection({
  eyebrow,
  title,
  description,
  groups,
  className = "",
}: ExploreLinksSectionProps) {
  return (
    <section className={`py-16 md:py-20 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          {eyebrow && (
            <p className="text-xs uppercase tracking-[0.3em] text-luxury-charcoal/40 mb-3">
              {eyebrow}
            </p>
          )}
          <h2 className="text-3xl md:text-4xl luxury-heading text-luxury-charcoal mb-4">
            {title}
          </h2>
          {description && (
            <p className="luxury-body text-luxury-charcoal/70 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.title}
              className="rounded-3xl border border-luxury-cream bg-white/80 p-6 md:p-7"
            >
              <h3 className="luxury-heading text-xl text-luxury-charcoal mb-5">
                {group.title}
              </h3>
              <div className="space-y-4">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-2xl border border-luxury-cream/80 bg-luxury-cream/20 p-4 transition-colors hover:bg-luxury-cream/40"
                  >
                    <p className="text-sm font-semibold text-luxury-charcoal mb-1">
                      {link.title}
                    </p>
                    <p className="text-sm text-luxury-charcoal/65 leading-relaxed">
                      {link.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
