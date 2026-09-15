import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import StylistWorkspaceShell from '@/components/StylistWorkspaceShell';
import { getStylistWorkspaceIdentity, isAdminCookieAuthenticated, getWorkspaceStylistBySlug } from '@/lib/stylistWorkspaceAuth';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata;

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ stylistSlug: string }>;
}) {
  const { stylistSlug: previewSlug } = await params;
  if (await isAdminCookieAuthenticated()) {
    const stylist = await getWorkspaceStylistBySlug(previewSlug);
    if (!stylist) redirect('/stylist/admin/workspace');
    return <StylistWorkspaceShell stylist={{ name: stylist.name, slug: stylist.slug }} adminPreview>{children}</StylistWorkspaceShell>;
  }
  const [{ stylistSlug }, identity] = await Promise.all([params, getStylistWorkspaceIdentity()]);
  if (!identity) {
    const destination = (await headers()).get('x-iconik-workspace-path') || `/stylist/${stylistSlug}/dashboard`;
    redirect(`/stylist/login?redirectTo=${encodeURIComponent(destination)}`);
  }
  if (identity.slug !== stylistSlug) redirect(`/stylist/${identity.slug}/dashboard`);
  return <StylistWorkspaceShell stylist={{ name: identity.name, slug: identity.slug }}>{children}</StylistWorkspaceShell>;
}
