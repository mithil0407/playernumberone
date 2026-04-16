import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function GlobalThankYouLayout({ children }: { children: React.ReactNode }) {
  return children;
}
