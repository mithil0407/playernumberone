const PRIVATE_BUCKET = 'stylist-intake-private';

export function getPrivateStylistPhotoPath(value: unknown, orderId: string, supabaseUrl: string): string | null {
  if (typeof value !== 'string' || !orderId || !supabaseUrl) return null;
  try {
    const url = new URL(value);
    if (url.origin !== new URL(supabaseUrl).origin) return null;
    const prefix = `/storage/v1/object/sign/${PRIVATE_BUCKET}/orders/${orderId}/`;
    if (!url.pathname.startsWith(prefix) || !url.searchParams.has('token')) return null;
    const path = decodeURIComponent(url.pathname.slice(`/storage/v1/object/sign/${PRIVATE_BUCKET}/`.length));
    if (!/^orders\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|heic|heif)$/i.test(path)) return null;
    return path;
  } catch {
    return null;
  }
}

export function isAllowedStylistPhotoValue(input: {
  value: unknown;
  existingValue?: unknown;
  orderId: string;
  supabaseUrl: string;
}): boolean {
  if (typeof input.value !== 'string' || !input.value) return false;
  if (getPrivateStylistPhotoPath(input.value, input.orderId, input.supabaseUrl)) return true;
  // Existing public URLs remain valid only when the same order already saved them.
  return input.value === input.existingValue;
}
