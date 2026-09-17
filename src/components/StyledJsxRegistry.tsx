'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { StyleRegistry, createStyleRegistry } from 'styled-jsx';

/**
 * Sends styled-jsx styles in the server HTML. Without it, App Router pages add
 * those styles only after JavaScript loads, so a report arrived as unstyled
 * text for the first second or two on a phone.
 * https://nextjs.org/docs/app/guides/css-in-js#styled-jsx
 */
export default function StyledJsxRegistry({ children }: { children: ReactNode }) {
  const [registry] = useState(() => createStyleRegistry());
  useServerInsertedHTML(() => {
    const styles = registry.styles();
    registry.flush();
    return <>{styles}</>;
  });
  return <StyleRegistry registry={registry}>{children}</StyleRegistry>;
}
