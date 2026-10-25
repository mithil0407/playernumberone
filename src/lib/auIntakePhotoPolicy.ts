export function getAUPrivatePhotoPath(value: unknown, orderId: string, supabaseUrl: string): string | null {
  if (typeof value !== 'string' || !orderId || !supabaseUrl || /%(?:2e|2f|5c)/i.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.origin !== new URL(supabaseUrl).origin || !url.searchParams.has('token')) return null;
    const prefix = `/storage/v1/object/sign/au-intake-private/orders/${orderId}/`;
    if (!url.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(url.pathname.slice('/storage/v1/object/sign/au-intake-private/'.length));
    return new RegExp(`^orders/${orderId}/[0-9a-f-]{36}\\.(jpg|png|webp|heic|heif)$`, 'i').test(path) ? path : null;
  } catch { return null; }
}
