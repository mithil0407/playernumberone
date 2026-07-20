export const MAN_INTAKE_MAX_PHOTO_BYTES = 20 * 1024 * 1024;

const MAN_INTAKE_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
]);

export type ManIntakePhotoLike = Pick<File, 'name' | 'size' | 'type'>;

export function getManIntakePhotoValidationError(file: ManIntakePhotoLike): string | null {
  if (file.size === 0) return 'This photo is empty. Please choose another image.';
  if (file.size > MAN_INTAKE_MAX_PHOTO_BYTES) return 'This photo is larger than 20 MB. Please choose a smaller image.';

  const extensionIsSupported = /\.(jpe?g|png|heic|heif)$/i.test(file.name);
  const mimeIsSupported = !file.type || MAN_INTAKE_PHOTO_TYPES.has(file.type.toLowerCase());
  if (!extensionIsSupported || !mimeIsSupported) {
    return 'Please choose a JPG, PNG, HEIC, or HEIF image.';
  }
  return null;
}
