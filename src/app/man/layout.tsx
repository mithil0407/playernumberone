import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: "Personal Styling for Indian Men",
  description:
    "Iconik's styling experience for Indian men who want a more structured approach to fit, grooming, and presentation.",
  path: "/man",
});

export default function ManLayout({ children }: { children: React.ReactNode }) {
  return children;
}
