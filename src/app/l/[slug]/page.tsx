import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLookSlug } from '@/lib/agentLookLinks';
import { loadLookView, publicLookView } from '@/lib/agentLookView';
import LookPageClient from './LookPageClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getLook(slug: string) {
  if (!isLookSlug(slug)) return null;
  return loadLookView(slug);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const look = await getLook(slug);
  if (!look) return { title: 'ICONIK', robots: { index: false, follow: false } };
  const description = look.intro ?? 'Picked for you by your ICONIK stylist.';
  return {
    title: `${look.title} · ICONIK`,
    description,
    robots: { index: false, follow: false },
    // WhatsApp renders this as the link preview in the chat.
    openGraph: {
      title: look.title,
      description,
      images: look.heroImageUrl ? [{ url: look.heroImageUrl }] : undefined,
    },
  };
}

export default async function LookPage({ params }: PageProps) {
  const { slug } = await params;
  const look = await getLook(slug);
  if (!look) notFound();
  return <LookPageClient initial={publicLookView(look)} />;
}
