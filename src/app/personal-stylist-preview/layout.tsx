import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'ICONIK Personal Stylist Membership — Preview',
  robots: { index: false, follow: false },
};
export default function MembershipLayout({ children }: { children: React.ReactNode }) { return children; }
