'use client';

interface MetaPixelProviderProps {
  children: React.ReactNode;
}

// Pixel is initialised once in layout.tsx via the <Script> tag.
// This provider exists purely as a wrapper so layout can stay a server component.
export default function MetaPixelProvider({ children }: MetaPixelProviderProps) {
  return <>{children}</>;
}
