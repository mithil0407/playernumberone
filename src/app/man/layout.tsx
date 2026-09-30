import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: "Personal Styling for Indian Men",
  description:
    "Online personal styling for Indian men: a 30-minute stylist call, then a Blueprint with 20 outfits, your colours, fit and grooming guidance. ₹2,699.",
  path: "/man",
});

export default function ManLayout({ children }: { children: React.ReactNode }) {
  return children;
}
