import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Complete Your ICONIK Personal Style Blueprint",
  description:
    "Secure checkout for the ICONIK Personal Style Blueprint and optional styling add-ons.",
  path: "/offer-2699/checkout",
  locale: "en_IN",
  noIndex: true,
});

export default function Offer2699CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
