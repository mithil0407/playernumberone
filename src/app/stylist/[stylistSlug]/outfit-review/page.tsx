import OutfitReviewDeck from '@/components/stylistStaff/OutfitReviewDeck';
import { isAdminCookieAuthenticated } from '@/lib/stylistWorkspaceAuth';

export default async function OutfitReviewPage({ params }: { params: Promise<{ stylistSlug: string }> }) {
  const { stylistSlug } = await params;
  // The layout signs her in (or redirects); an admin sees a read-only preview.
  const adminPreview = await isAdminCookieAuthenticated();
  return <OutfitReviewDeck stylistSlug={stylistSlug} adminPreview={adminPreview} />;
}
