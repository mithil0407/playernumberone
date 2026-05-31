import StylistAdminShell from '@/components/StylistAdminShell';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata;

export default function StylistAdminLayout({ children }: { children: React.ReactNode }) {
  return <StylistAdminShell>{children}</StylistAdminShell>;
}
