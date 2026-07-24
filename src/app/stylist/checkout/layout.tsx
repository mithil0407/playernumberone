import type { Metadata } from 'next';
import { noIndexMetadata } from '@/lib/seo';

export const metadata: Metadata = {
    title: 'Get Your ICONIK Blueprint — $149',
    description: 'Complete your ICONIK Style Blueprint purchase. Includes 20 outfit formulas, a 30-minute consultation, and delivery within 5 working days after consultation.',
    robots: noIndexMetadata.robots,
};

export default function StylistCheckoutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
