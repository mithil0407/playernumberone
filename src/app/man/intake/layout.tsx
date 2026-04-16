import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function ManIntakeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
