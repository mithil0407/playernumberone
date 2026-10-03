import 'server-only';

import type { Browser } from 'puppeteer-core';

const LOCAL_CHROME_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

/**
 * Headless Chrome for server work: the bundled Chromium on Vercel, the local
 * Chrome install in development. Report PDFs and the agent's browser share it.
 */
export async function launchHeadlessBrowser(purpose = 'headless rendering'): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default;
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({ args: chromium.args, headless: 'shell' }),
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    });
  }
  const { existsSync } = await import('node:fs');
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || LOCAL_CHROME_PATHS.find(path => existsSync(path));
  if (!executablePath) throw new Error(`No local Chrome found for ${purpose}; set CHROME_EXECUTABLE_PATH`);
  return puppeteer.launch({ executablePath, headless: true });
}
