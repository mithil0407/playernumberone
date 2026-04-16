import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function USCheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
