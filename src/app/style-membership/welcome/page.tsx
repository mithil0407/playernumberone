import type { Metadata } from 'next';
import { WelcomeView } from '@/components/membership/WelcomeView';

export const metadata: Metadata = {
  title: 'Welcome to your Style Membership · ICONIK',
  robots: { index: false, follow: false },
};

export default function StyleMembershipWelcomePage() {
  return <WelcomeView />;
}
