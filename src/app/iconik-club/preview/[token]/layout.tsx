import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function ClubPreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
