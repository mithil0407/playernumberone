import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: "Join Iconik Club",
  description:
    "Join Iconik Club for ongoing styling support, curated outfits, and client-facing wardrobe guidance.",
  path: "/iconik-club/join",
});

export default function IconikClubJoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
