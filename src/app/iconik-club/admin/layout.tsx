import IconikClubAdminShell from '@/components/IconikClubAdminShell';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <IconikClubAdminShell>{children}</IconikClubAdminShell>;
}
