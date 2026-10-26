import type { Metadata } from 'next';
import ClientUploadForm from '@/components/ClientUploadForm';
import { loadClientUploadLink } from '@/lib/consultationClientUpload';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Upload your photos | ICONIK',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

export default async function ClientUploadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await loadClientUploadLink(token).catch(() => null);
  return <ClientUploadForm
    token={token}
    state={link ? link.state : 'error'}
    firstName={link && link.state !== 'invalid' ? link.firstName : ''}
    expiresAt={link && link.state !== 'invalid' ? link.expiresAt : null}
  />;
}
