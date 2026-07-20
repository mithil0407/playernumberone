import { redirect } from 'next/navigation';
import StylistWorkspaceShell from '@/components/StylistWorkspaceShell';
import { getStylistWorkspaceIdentity } from '@/lib/stylistWorkspaceAuth';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata;

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ stylistSlug: string }>;
}) {
  const [{ stylistSlug }, identity] = await Promise.all([params, getStylistWorkspaceIdentity()]);
  if (!identity) redirect(`/stylist/login?redirectTo=${encodeURIComponent(`/stylist/${stylistSlug}/dashboard`)}`);
  if (identity.slug !== stylistSlug) redirect(`/stylist/${identity.slug}/dashboard`);
  return <StylistWorkspaceShell stylist={{ name: identity.name, slug: identity.slug }}>{children}</StylistWorkspaceShell>;
}
