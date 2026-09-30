import type { Metadata } from "next";
import Link from "next/link";

// Overrides the root layout's `index, follow`, which otherwise sat beside
// Next's default `noindex` on every 404.
export const metadata: Metadata = {
  title: "Page not found | Iconik",
  robots: { index: false, follow: true },
};

const links = [
  { href: "/", label: "Iconik Style Blueprint" },
  { href: "/pricing", label: "Pricing" },
  { href: "/colour-analysis", label: "Colour analysis guides" },
  { href: "/body-type-styling", label: "Body type styling guides" },
  { href: "/style-guides", label: "Style guides" },
  { href: "/contact", label: "Contact us" },
];

export default function NotFound() {
  return (
    <main className="min-h-screen bg-luxury-warm-white px-6 py-24 text-luxury-charcoal">
      <div className="mx-auto max-w-xl">
        <p className="luxury-body text-xs uppercase tracking-[0.2em] text-luxury-charcoal/70">404</p>
        <h1 className="luxury-heading mt-3 text-4xl leading-tight">This page doesn&apos;t exist</h1>
        <p className="luxury-body mt-4 text-base leading-relaxed text-luxury-charcoal/80">
          The link may be old or mistyped. These pages are a good place to continue.
        </p>
        <ul className="mt-8 flex flex-col gap-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="luxury-body text-base text-luxury-accent underline underline-offset-4">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
