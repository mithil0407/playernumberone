import type { Metadata } from 'next';
import { loadAgentAnalytics } from '@/lib/agentAnalyticsLoader';
import AgentDashboard from './AgentDashboard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ICONIK Agent · Analytics', robots: { index: false, follow: false } };

export default async function AgentAdminPage() {
  const data = await loadAgentAnalytics();
  const fxRate = Number(process.env.REVENUE_FX_USD_TO_INR) || 88;
  return <AgentDashboard data={data} fxRate={fxRate} />;
}
