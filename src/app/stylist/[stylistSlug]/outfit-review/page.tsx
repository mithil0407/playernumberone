import OutfitReviewDeck from '@/components/stylistStaff/OutfitReviewDeck';
import { getStylistWorkspaceIdentity, isAdminCookieAuthenticated } from '@/lib/stylistWorkspaceAuth';

export default async function OutfitReviewPage({ params }: { params: Promise<{ stylistSlug: string }> }) {
  const [{ stylistSlug }, identity] = await Promise.all([params, getStylistWorkspaceIdentity()]);
  // The layout signs her in (or redirects). Her own login always swipes for
  // real; only an admin without her login gets the read-only preview.
  const adminPreview = identity?.slug !== stylistSlug && await isAdminCookieAuthenticated();
  return <OutfitReviewDeck stylistSlug={stylistSlug} adminPreview={adminPreview} />;
}
