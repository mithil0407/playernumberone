import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function AUCheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
