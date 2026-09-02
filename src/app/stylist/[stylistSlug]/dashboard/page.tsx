'use client';
import { useParams } from 'next/navigation';
import StylistWorkspaceDashboard from '@/components/StylistWorkspaceDashboard';
export default function WorkspaceDashboardPage() {
  const { stylistSlug } = useParams<{ stylistSlug: string }>();
  return <StylistWorkspaceDashboard stylistSlug={stylistSlug} />;
}
