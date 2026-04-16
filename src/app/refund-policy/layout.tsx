import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Refund Policy",
  description: "Refund, revision, and cancellation rules for Iconik services.",
  path: "/refund-policy",
});

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
