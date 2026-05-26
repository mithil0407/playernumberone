import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Free ICONIK Style Score + Personal Mood Board',
    description: 'Get your free ICONIK Style Score and Personal Mood Board based on your colours, body proportions, style goals, and outfit struggles. Takes 3 minutes.',
    openGraph: {
        title: 'Free ICONIK Style Score + Personal Mood Board',
        description: 'Discover why your clothes don\'t feel like you. Get your free ICONIK Style Score in 3 minutes.',
        type: 'website',
    },
};

export default function StyleScoreLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
