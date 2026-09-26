/**
 * Browser helpers for printing a Blueprint report. Report images load lazily
 * and distant pages sit in content-visibility shells (women) or unmounted
 * deferred sections (men), so printing straight away produced a PDF with empty
 * image frames and placeholder pages.
 */

/** Deferred report sections listen for this and mount immediately. */
export const REPORT_PRINT_EVENT = 'iconik:report-print';

/** Measured on screen, a report page is laid out at this width and printed one page per A4 portrait sheet. */
export const PRINT_PAGE_WIDTH = 1060;
// 297/210 of the width, less a pixel so rounding never pushes a page onto a second sheet.
export const PRINT_PAGE_HEIGHT = Math.floor((PRINT_PAGE_WIDTH * 297) / 210) - 1;
// Scales the 1060px page onto the 210mm sheet (210mm = 793.7 CSS px).
export const PRINT_PAGE_ZOOM = (210 / 25.4) * 96 / PRINT_PAGE_WIDTH;
// Text wraps slightly differently at print scale (shopping cards came out ~4%
// taller than measured), so pages are fitted with this much room to spare.
const FIT_SLACK = 40;
/** While present on <html>, the print layout applies on screen so pages can be measured. */
export const PRINT_MEASURE_CLASS = 'iconik-print-measure';

const PAGE_SELECTOR = '.iconik-report .iconik-page';

function clearFit(page: HTMLElement) {
  page.style.removeProperty('zoom');
  page.style.removeProperty('width');
  page.style.removeProperty('min-height');
  page.style.removeProperty('height');
  page.style.removeProperty('break-after');
}

/**
 * Gives every page exactly one sheet. A page taller than a sheet is scaled
 * down and widened by the same factor, so it still runs edge to edge and its
 * text reflows onto fewer lines. Shorter pages are stretched to the sheet by
 * the print CSS. Returns an undo.
 */
export function fitReportPagesForPrint() {
  const pages = Array.from(document.querySelectorAll<HTMLElement>(PAGE_SELECTOR));
  pages.forEach(clearFit);
  const html = document.documentElement;
  html.classList.add(PRINT_MEASURE_CLASS);
  try {
    for (const page of pages) {
      const target = PRINT_PAGE_HEIGHT - FIT_SLACK;
      let scale = 1;
      page.style.setProperty('min-height', '0px', 'important');
      for (let pass = 0; pass < 4; pass++) {
        page.style.setProperty('width', `${PRINT_PAGE_WIDTH / scale}px`, 'important');
        const height = page.offsetHeight;
        if (height * scale <= target) break;
        scale = target / height;
      }
      if (scale === 1) {
        clearFit(page);
        continue;
      }
      // The last pass can end on a new scale; the width must match it or the page stops short of the sheet edge.
      page.style.setProperty('width', `${PRINT_PAGE_WIDTH / scale}px`, 'important');
      page.style.setProperty('min-height', `${PRINT_PAGE_HEIGHT / scale}px`, 'important');
      page.style.setProperty('height', `${PRINT_PAGE_HEIGHT / scale}px`, 'important');
      page.style.setProperty('zoom', String(scale));
    }
  } finally {
    html.classList.remove(PRINT_MEASURE_CLASS);
  }
  // A forced break after the last page printed a trailing blank sheet.
  pages.at(-1)?.style.setProperty('break-after', 'auto');
  return () => pages.forEach(clearFit);
}

function waitForImage(image: HTMLImageElement) {
  if (image.complete) return Promise.resolve();
  return new Promise<void>(resolve => {
    image.addEventListener('load', () => resolve(), { once: true });
    image.addEventListener('error', () => resolve(), { once: true });
  });
}

/**
 * Renders deferred pages, starts every report image loading and fits pages to
 * sheets. Synchronous, so the browser's own Print can call it from beforeprint.
 * Returns an undo.
 */
export function releaseReportForPrint() {
  window.dispatchEvent(new Event(REPORT_PRINT_EVENT));
  const shells = Array.from(document.querySelectorAll<HTMLElement>('.blueprint-deferred-shell'));
  for (const shell of shells) shell.style.contentVisibility = 'visible';
  const images = Array.from(document.querySelectorAll<HTMLImageElement>('.iconik-report img'));
  for (const image of images) image.loading = 'eager';
  let unfit = fitReportPagesForPrint();
  return {
    images,
    refit: () => { unfit = fitReportPagesForPrint(); },
    restore: () => {
      for (const shell of shells) shell.style.contentVisibility = '';
      unfit();
    },
  };
}

/**
 * Waits (up to a limit) for every report image and the fonts, so the PDF is
 * complete. A men's report is ~33 full-size images; unscrolled, they took about
 * a minute to arrive on a fast connection, and a 30s limit printed them half drawn.
 */
export async function prepareReportForPrint(timeoutMs = 90_000) {
  const { images, refit, restore } = releaseReportForPrint();
  await Promise.race([
    Promise.all([...images.map(waitForImage), document.fonts?.ready]),
    new Promise(resolve => window.setTimeout(resolve, timeoutMs)),
  ]);
  // Loaded images change page heights, so measure again.
  refit();
  // Two frames so decoded images are painted before the print snapshot.
  await new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
  return restore;
}

/** Cmd+P cannot wait for images, but can still mount, load and fit what it can. Returns a cleanup. */
export function installReportPrintFallback() {
  let restore: (() => void) | null = null;
  const before = () => { if (!restore) restore = releaseReportForPrint().restore; };
  const after = () => { restore?.(); restore = null; };
  window.addEventListener('beforeprint', before);
  window.addEventListener('afterprint', after);
  return () => {
    window.removeEventListener('beforeprint', before);
    window.removeEventListener('afterprint', after);
  };
}

/**
 * The page geometry shared by both reports. Emitted twice: for printing, and
 * under PRINT_MEASURE_CLASS so fitReportPagesForPrint measures the same layout.
 * `hidden` lists selectors that disappear in print; they change page heights,
 * so they must be hidden while measuring too. `pinned` holds [selector,
 * declarations] for anything sized in vw: on paper vw follows the ~794px sheet,
 * on screen the window, so the measurement only holds once they are fixed.
 */
export function reportPrintLayoutCss(hidden: string[] = [], pinned: [selector: string, declarations: string][] = []) {
  const rules = (scope: string) => {
    const s = (selectors: string) => selectors.split(',').map(sel => `${scope}${sel.trim()}`).join(', ');
    return `
      ${s('.iconik-report')} {
        padding: 0 !important;
        margin: 0 !important;
        width: ${PRINT_PAGE_WIDTH}px !important;
        max-width: none !important;
      }
      ${s('.iconik-report .iconik-page-frame')} {
        max-width: none !important;
        margin: 0 !important;
      }
      ${s('.iconik-report .iconik-page')} {
        width: ${PRINT_PAGE_WIDTH}px !important;
        max-width: none !important;
        min-height: ${PRINT_PAGE_HEIGHT}px !important;
        margin: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        /* A page shorter than the sheet sits in the optical middle rather than
           leaving the bottom of the sheet empty. */
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        break-inside: avoid;
        break-after: page;
        page-break-after: always;
      }
      ${hidden.length ? `${s(hidden.join(', '))} { display: none !important; }` : ''}
      ${pinned.map(([selector, declarations]) => `${s(selector)} { ${declarations} }`).join('\n')}
    `;
  };
  return `
    @media print {
      @page { size: A4 portrait; margin: 0; }
      .iconik-report, .iconik-report * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .iconik-report { zoom: ${PRINT_PAGE_ZOOM.toFixed(6)}; }
      ${rules('')}
      /* Exactly one sheet each. If text still reflows taller than measured,
         the bottom padding is clipped rather than a sliver spilling onto a
         second, nearly empty sheet. */
      .iconik-report .iconik-page { height: ${PRINT_PAGE_HEIGHT}px; overflow: hidden !important; }
    }
    ${rules(`html.${PRINT_MEASURE_CLASS} `)}
  `;
}
