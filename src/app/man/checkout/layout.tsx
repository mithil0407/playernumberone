import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function ManCheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
