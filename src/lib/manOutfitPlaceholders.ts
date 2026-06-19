const PLACEHOLDER_PATTERNS = [
  /^[-\u2013\u2014]+$/,
  /^n\/?a$/,
  /^not\s+visible\s+in\s+(?:the\s+)?reference\.?$/,
  /^not\s+(?:visible|provided|specified|available|given)(?:\s+(?:by|from)\s+(?:admin|stylist|client|reference))?\.?$/,
  /^not\s+specified\s+by\s+(?:the\s+)?(?:admin|stylist|client)\.?$/,
  /^not\s+provided\s+by\s+(?:the\s+)?(?:admin|stylist|client)\.?$/,
  /^unspecified\.?$/,
  /^to\s+be\s+(?:specified|confirmed|decided)\.?$/,
  /^tbd\.?$/,
];

export function isPlaceholderOutfitValue(value: string | null | undefined): boolean {
  const cleaned = String(value ?? '')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (!cleaned) return true;
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(cleaned));
}

export function hasPlaceholderOutfitValue(value: string | null | undefined): boolean {
  const cleaned = String(value ?? '')
    .replace(/\*+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (!cleaned) return true;
  return cleaned
    .split(/[.;]\s*/)
    .some(part => part && PLACEHOLDER_PATTERNS.some(pattern => pattern.test(part)));
}
