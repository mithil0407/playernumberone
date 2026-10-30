import type { Metadata } from 'next';
import { QuizProvider } from '@/components/membership/QuizProvider';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <QuizProvider>{children}</QuizProvider>;
}
