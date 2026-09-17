/**
 * Browser helpers for printing a Blueprint report. Report images load lazily
 * and distant pages sit in content-visibility shells, so printing straight away
 * produced a PDF with empty image frames.
 */
function waitForImage(image: HTMLImageElement) {
  if (image.complete) return Promise.resolve();
  return new Promise<void>(resolve => {
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => resolve(), { once: true });
  });
}

/** Starts every report image loading and renders deferred pages. Returns an undo for the shells. */
export function releaseReportForPrint() {
  const shells = Array.from(document.querySelectorAll<HTMLElement>('.blueprint-deferred-shell'));
  for (const shell of shells) shell.style.contentVisibility = 'visible';
  const images = Array.from(document.querySelectorAll<HTMLImageElement>('.iconik-report img'));
  for (const image of images) image.loading = 'eager';
  return {
    images,
    restore: () => { for (const shell of shells) shell.style.contentVisibility = ''; },
  };
}

/** Waits (up to a limit) for every report image and the fonts, so the PDF is complete. */
export async function prepareReportForPrint(timeoutMs = 30_000) {
  const { images, restore } = releaseReportForPrint();
  await Promise.race([
    Promise.all([...images.map(waitForImage), document.fonts?.ready]),
    new Promise(resolve => window.setTimeout(resolve, timeoutMs)),
  ]);
  // Two frames so decoded images are painted before the print snapshot.
  await new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
  return restore;
}
