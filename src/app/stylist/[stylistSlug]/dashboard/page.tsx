import { Suspense } from 'react';
import WorkspaceLoading from '../loading';
import WorkspaceDashboardContent from './WorkspaceDashboardContent';

export default async function WorkspaceDashboardPage({ params }: { params: Promise<{ stylistSlug: string }> }) {
  const { stylistSlug } = await params;
  return <Suspense fallback={<WorkspaceLoading />}>
    <WorkspaceDashboardContent stylistSlug={stylistSlug} />
  </Suspense>;
}
