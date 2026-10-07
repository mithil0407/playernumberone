import type { Metadata } from 'next';
import { maskPhone } from '@/lib/agentAnalytics';
import { listOccasionLooks } from '@/lib/agentOccasionLookStore';
import LooksBoard, { type BoardLook } from './LooksBoard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ICONIK Agent · Occasion looks', robots: { index: false, follow: false } };

const CAMPAIGN = 'diwali_2026';

export default async function OccasionLooksPage() {
  const rows = await listOccasionLooks(CAMPAIGN).catch(() => null);
  const looks: BoardLook[] = (rows ?? []).map(row => ({
    id: row.id,
    status: row.status,
    firstName: row.first_name,
    email: row.email,
    phone: row.phone ? maskPhone(row.phone) : null,
    outfit: row.outfit,
    hook: row.hook,
    imageUrl: row.image_url,
    error: row.error,
    whatsappChannel: row.whatsapp_channel,
    whatsappSentAt: row.whatsapp_sent_at,
    whatsappError: row.whatsapp_error,
    emailSentAt: row.email_sent_at,
    emailError: row.email_error,
    response: row.response,
    reportToken: row.share_token,
  }));
  return <LooksBoard campaign={CAMPAIGN} looks={looks} loadError={rows === null} />;
}
