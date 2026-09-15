import StylistWorkspaceDashboard from '@/components/StylistWorkspaceDashboard';
import { getStylistWorkspaceIdentity, getWorkspaceStylistBySlug, isAdminCookieAuthenticated } from '@/lib/stylistWorkspaceAuth';
import { loadWorkspaceQueue } from '@/lib/stylistWorkspaceQueue';
import { workspaceCounts } from '@/lib/stylistWorkspaceQueueModel';

export default async function WorkspaceDashboardContent({ stylistSlug }: { stylistSlug: string }) {
  const admin = await isAdminCookieAuthenticated();
  const stylist = admin ? await getWorkspaceStylistBySlug(stylistSlug) : null;
  const identity = stylist ? { stylistId: stylist.id, slug: stylist.slug, name: stylist.name } : await getStylistWorkspaceIdentity();
  // The layout performs the redirect. Never serialize data for a different
  // stylist, even though the page and layout can render concurrently.
  if (!identity || identity.slug !== stylistSlug) return null;
  try {
    const items = await loadWorkspaceQueue(identity.stylistId);
    return <StylistWorkspaceDashboard stylistSlug={stylistSlug} initialResult={{
      stylist: { name: identity.name, slug: identity.slug },
      snapshotItems: items, items: [], counts: workspaceCounts(items), total: items.length, page: 1, limit: 24,
    }} />;
  } catch {
    // Keep the interactive retry UI available if the initial database read fails.
    return <StylistWorkspaceDashboard stylistSlug={stylistSlug} />;
  }
}
