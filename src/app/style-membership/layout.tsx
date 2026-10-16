import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Inter } from 'next/font/google';
import s from '@/components/membership/membership.module.css';

const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-sm-serif' });
const sans = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sm-sans' });

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  title: 'ICONIK Style Membership · Your stylist on WhatsApp',
  description: 'A free 3-minute style quiz built for Indian women: your colours, your body shape and outfits for your real calendar, then a personal stylist on WhatsApp.',
  openGraph: {
    title: 'Your personal stylist on WhatsApp · ICONIK',
    description: 'A free 3-minute style quiz built for Indian women.',
    images: [{ url: '/membership/hero-trio.webp', width: 960, height: 1200 }],
  },
};

export const viewport: Viewport = {
  themeColor: '#F7F3EC',
  viewportFit: 'cover',
};

export default function StyleMembershipLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${s.root} ${serif.variable} ${sans.variable}`}>
      {children}
      <div id="sm-overlay" />
    </div>
  );
}
