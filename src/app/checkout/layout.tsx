import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Complete Your ICONIK Personal Style Blueprint",
  description:
    "Secure checkout for the ICONIK Personal Style Blueprint and optional styling add-ons.",
  path: "/checkout",
  locale: "en_IN",
  noIndex: true,
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
