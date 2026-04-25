import GlobeAdminShell from '@/components/GlobeAdminShell';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata;

export default function ManAdminLayout({ children }: { children: React.ReactNode }) {
  return <GlobeAdminShell>{children}</GlobeAdminShell>;
}
