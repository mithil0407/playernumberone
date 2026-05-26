import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Get Your ICONIK Blueprint — $149',
    description: 'Complete your ICONIK Style Blueprint purchase. Personalised to your body, face, and colour profile. 72-hour delivery. 30-day guarantee.',
};

export default function StylistCheckoutLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
