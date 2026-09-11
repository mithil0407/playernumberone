export const ROOT_DESIGN_VARIANTS = ['precision'] as const;

export type RootDesignVariant = (typeof ROOT_DESIGN_VARIANTS)[number];

export function parseRootDesignVariant(value?: string): RootDesignVariant | undefined {
  return ROOT_DESIGN_VARIANTS.find((variant) => variant === value);
}

export function addRootDesignToHref(href: string, design?: RootDesignVariant) {
  if (!design) return href;
  const separator = href.includes('?') ? '&' : '?';
  return `${href}${separator}design=${design}`;
}
