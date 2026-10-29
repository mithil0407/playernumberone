/**
 * Getting a picture ready to upload, in the browser. Report images show at
 * about 700px, so anything bigger than MAX_UPLOAD_EDGE is shrunk first: a
 * 4000px phone photo goes up as ~300 KB instead of several MB.
 */

export const MAX_UPLOAD_EDGE = 1600;
/** Files at or under this size and edge go up untouched. */
const KEEP_AS_IS_BYTES = 1.5 * 1024 * 1024;
const JPEG_QUALITY = 0.88;

export function loadImageElement(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This image could not be opened.'));
    image.src = url;
  });
}

export function canvasToJpeg(canvas: HTMLCanvasElement, quality = JPEG_QUALITY) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create the image.')), 'image/jpeg', quality);
  });
}

/** The same picture, shrunk to MAX_UPLOAD_EDGE as a JPEG when it is larger than the report needs. */
export async function shrinkImageForUpload(file: File, image: HTMLImageElement) {
  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  if (longest <= MAX_UPLOAD_EDGE && file.size <= KEEP_AS_IS_BYTES) return file;
  const scale = Math.min(1, MAX_UPLOAD_EDGE / longest);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) return file;
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await canvasToJpeg(canvas);
  // Re-encoding a small, already-compressed file can make it bigger.
  if (blob.size >= file.size && longest <= MAX_UPLOAD_EDGE) return file;
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' });
}

/** A newly chosen, dropped or pasted picture, ready to upload: shrunk when it is larger than the report needs. */
export async function prepareImageForUpload(file: File) {
  const url = URL.createObjectURL(file);
  try {
    return await shrinkImageForUpload(file, await loadImageElement(url));
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const UPLOADABLE_IMAGE_TYPE = /^image\/(jpeg|png|webp)$/;

/**
 * The picture on the clipboard, if there is one. "Copy image" in Chrome (from
 * Flow, ChatGPT or any page) puts a PNG there, which is what Gamma pastes.
 */
export function imageFileFromClipboard(data: DataTransfer | null | undefined) {
  if (!data) return null;
  for (const item of Array.from(data.items ?? [])) {
    if (item.kind !== 'file' || !UPLOADABLE_IMAGE_TYPE.test(item.type)) continue;
    const file = item.getAsFile();
    if (file) return file.name && file.name !== 'image.png' ? file : new File([file], `pasted-${Date.now()}.png`, { type: file.type });
  }
  return null;
}

/**
 * Flow (Google's image tool) stamps a small ✦ in the bottom-right corner, about
 * 9–16% of the short side in from each edge. Cropping clears a square this
 * fraction of the short side, which leaves a little room around it.
 */
export const FLOW_WATERMARK_FRACTION = 0.18;

/** Which corner of the picture as shown holds the original bottom-right corner, after a clockwise turn. */
export function watermarkCorner(rotation: number) {
  const turn = ((rotation % 360) + 360) % 360;
  return { right: turn === 0 || turn === 270, bottom: turn === 0 || turn === 90 };
}

/**
 * The biggest crop of the given shape that leaves out the watermark corner,
 * kept as close to the centre as possible. Works in the picture as shown (after
 * rotation): `width` and `height` are its size there.
 */
export function cropAvoidingCorner(input: {
  width: number;
  height: number;
  aspect: number;
  corner: { right: boolean; bottom: boolean };
  fraction?: number;
}) {
  const { width: W, height: H, aspect, corner } = input;
  const mark = (input.fraction ?? FLOW_WATERMARK_FRACTION) * Math.min(W, H);
  const fit = (x0: number, y0: number, rw: number, rh: number) => {
    const w = Math.min(rw, rh * aspect);
    const h = w / aspect;
    const left = Math.min(Math.max(W / 2 - w / 2, x0), x0 + rw - w);
    const top = Math.min(Math.max(H / 2 - h / 2, y0), y0 + rh - h);
    return { left, top, width: w, height: h };
  };
  // Either drop the rows the mark sits in, or the columns. Keep whichever loses less.
  const rows = fit(0, corner.bottom ? 0 : mark, W, H - mark);
  const columns = fit(corner.right ? 0 : mark, 0, W - mark, H);
  return columns.width * columns.height > rows.width * rows.height * 1.001 ? columns : rows;
}
