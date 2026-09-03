export const MAN_INTAKE_MAX_PHOTO_BYTES = 20 * 1024 * 1024;

export const MAN_INTAKE_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
]);

export const MAN_INTAKE_PHOTO_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'heic', 'heif']);

export type ManIntakePhotoLike = Pick<File, 'name' | 'size' | 'type'>;

function extensionForContentType(contentType: string): string | null {
  switch (contentType.toLowerCase()) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    default:
      return null;
  }
}

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

export function getManIntakePhotoExtension(file: Pick<ManIntakePhotoLike, 'name' | 'type'>): string | null {
  // The browser-provided MIME is the best available indication of the bytes it
  // will upload (Safari may transcode a selected image). Fall back to the name
  // only when the browser omits the MIME type.
  const typeExtension = extensionForContentType(file.type);
  if (typeExtension) return typeExtension;

  const rawExtension = file.name.split('.').pop()?.toLowerCase() || '';
  if (MAN_INTAKE_PHOTO_EXTENSIONS.has(rawExtension)) {
    return rawExtension === 'jpeg' ? 'jpg' : rawExtension;
  }
  return null;
}

export function getManIntakePhotoContentType(file: Pick<ManIntakePhotoLike, 'name' | 'type'>): string | null {
  const normalizedType = file.type.toLowerCase();
  if (MAN_INTAKE_PHOTO_TYPES.has(normalizedType)) {
    return normalizedType === 'image/jpg' ? 'image/jpeg' : normalizedType;
  }

  switch (getManIntakePhotoExtension(file)) {
    case 'jpg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'heic': return 'image/heic';
    case 'heif': return 'image/heif';
    default: return null;
  }
}

export function withManIntakePhotoContentType(file: Blob, contentType: string): Blob {
  return file.type === contentType ? file : new Blob([file], { type: contentType });
}

export function getManIntakePhotoFingerprintSource(file: {
  kind: string;
  name: string;
  size: number;
  type: string;
  last_modified: number;
}): string {
  return [file.kind, file.name, file.size, file.type.toLowerCase(), file.last_modified].join(':');
}
