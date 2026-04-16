import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function GlobalIntakeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
