import { noIndexMetadata } from '@/lib/seo';

// Keep the login page excluded in its HTML as well as the middleware header.
export const metadata = noIndexMetadata;

export default function StylistLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
