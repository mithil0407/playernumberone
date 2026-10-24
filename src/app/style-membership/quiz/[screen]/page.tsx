import { notFound } from 'next/navigation';
import { QUIZ_SCREENS, screenById } from '@/lib/styleMembershipQuiz';
import { QuizScreenView } from '@/components/membership/QuizScreens';

export function generateStaticParams() {
  return QUIZ_SCREENS.map(screen => ({ screen: screen.id }));
}

export const dynamicParams = false;

export default async function QuizScreenPage({ params }: { params: Promise<{ screen: string }> }) {
  const { screen } = await params;
  if (!screenById(screen)) notFound();
  return <QuizScreenView id={screen} />;
}
