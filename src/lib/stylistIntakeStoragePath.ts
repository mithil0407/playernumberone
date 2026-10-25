export const CONSULTATION_PHOTO_BUCKET = 'consultation-client-uploads';
export const PRIVATE_STYLIST_PHOTO_BUCKET = 'stylist-intake-private';

export function classifyIntakePhotoStoragePath(rawPath: string): { bucket: string; path: string } | null {
  const privatePrefix = `${PRIVATE_STYLIST_PHOTO_BUCKET}/`;
  const consultationPrefix = `${CONSULTATION_PHOTO_BUCKET}/`;
  const bucket = rawPath.startsWith(privatePrefix) ? PRIVATE_STYLIST_PHOTO_BUCKET : CONSULTATION_PHOTO_BUCKET;
  const normalized = rawPath.replace(/^\/+/, '');
  const path = rawPath.startsWith(privatePrefix)
    ? rawPath.slice(privatePrefix.length)
    : normalized.startsWith(consultationPrefix) ? normalized.slice(consultationPrefix.length) : normalized;
  if (!path || path.includes('%') || path.includes('\\') || path.startsWith('/') || path.split('/').some(segment => !segment || segment === '.' || segment === '..')) return null;
  return { bucket, path };
}
