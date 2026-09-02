import { Suspense } from 'react';
import StylistWorkspaceDashboard from '@/components/StylistWorkspaceDashboard';
export default function AdminWorkspacePage() {
  return <Suspense fallback={<p className="luxury-body p-6">Opening the report studio…</p>}><StylistWorkspaceDashboard admin /></Suspense>;
}
