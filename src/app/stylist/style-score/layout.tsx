import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'The Color Mirror · ICONIK',
    description: 'Find the colors quietly fighting your face in 90 seconds. No upload. No account. Free color diagnosis from ICONIK.',
    openGraph: {
        title: 'The Color Mirror · ICONIK',
        description: 'Find the colors quietly fighting your face in 90 seconds with a free ICONIK color diagnosis.',
        type: 'website',
    },
    robots: noIndexMetadata.robots,
};

export default function StyleScoreLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
