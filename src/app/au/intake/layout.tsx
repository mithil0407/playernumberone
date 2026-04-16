import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function AUIntakeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
