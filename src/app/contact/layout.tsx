import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact Iconik",
  description:
    "Contact Iconik for support, service questions, and pre-purchase guidance about the Style Blueprint.",
  path: "/contact",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
