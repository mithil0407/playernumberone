import type { Metadata } from 'next';
import { ResultView } from '@/components/membership/ResultView';

export const metadata: Metadata = {
  title: 'Your Style Plan · ICONIK',
  robots: { index: false, follow: false },
};

export default function StyleMembershipResultPage() {
  return <ResultView />;
}
