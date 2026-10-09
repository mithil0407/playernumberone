import type { Metadata } from 'next';
import { JoinView } from '@/components/membership/JoinView';
import { GUARANTEE, MEMBERSHIP_PLANS, rupees } from '@/lib/styleMembershipConfig';

export const metadata: Metadata = {
  title: 'ICONIK Style Membership · Your personal stylist on WhatsApp',
  description: `Your colours, your body shape and outfits for your real calendar, from ${rupees(MEMBERSHIP_PLANS.subscribe.pricePaise)} every 3 months. ${GUARANTEE.headline}.`,
  alternates: { canonical: '/style-membership/join' },
  robots: { index: false, follow: true },
};

export default function StyleMembershipJoinPage() {
  return <JoinView />;
}
