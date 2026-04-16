import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Delivery Policy",
  description:
    "How Iconik delivers digital styling services, reports, and related support timelines.",
  path: "/shipping",
});

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
