import IconikClubClientShell from '@/components/IconikClubClientShell';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata;

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <IconikClubClientShell>{children}</IconikClubClientShell>;
}
