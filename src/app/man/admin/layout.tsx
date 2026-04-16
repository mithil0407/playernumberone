import ManAdminShell from '@/components/ManAdminShell';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata;

export default function ManAdminLayout({ children }: { children: React.ReactNode }) {
  return <ManAdminShell>{children}</ManAdminShell>;
}
