import 'server-only';

// Runs Claude's browser toolset (browser_toolset_20260801) against our own
// headless Chrome. Claude decides what to do on a retailer's product page; this
// class does it with puppeteer and reports back in the toolset's result format.
//
// Safety: top-level navigation is limited to the retailer domains the job allows,
// only https is followed, and nothing here can log in, upload files or run
// scripts (those members are disabled in the toolset config). Page content is
// untrusted data — the verifier's prompt says so and only a structured report
// tool ends the task.

import type {
  BetaBrowserStateBlockParam,
  BetaImageBlockParam,
  BetaTextBlockParam,
} from '@anthropic-ai/sdk/resources/beta/messages/messages';
import type { Browser, KeyInput, Page } from 'puppeteer-core';
import { isSafeRetailUrl } from '@/lib/agentLookLinks';
import { launchHeadlessBrowser } from '@/lib/headlessBrowser';

export type BrowserResultContent = Array<BetaTextBlockParam | BetaImageBlockParam | BetaBrowserStateBlockParam>;

export interface BrowserMemberResult {
  content: BrowserResultContent | string;
  isError?: boolean;
}

/** Members we implement; everything else is switched off in the toolset config. */
export const ENABLED_BROWSER_MEMBERS = [
  'navigate', 'screenshot', 'zoom', 'left_click', 'right_click', 'double_click', 'triple_click', 'hover',
  'scroll', 'scroll_to', 'type', 'key', 'wait', 'read_page', 'find', 'get_page_text', 'form_input',
  'new_tab', 'list_tabs', 'switch_tab', 'close_tab',
] as const;

export const DISABLED_BROWSER_MEMBERS = [
  'left_click_drag', 'left_mouse_down', 'left_mouse_up', 'mouse_move', 'hold_key', 'middle_click',
  'file_upload', 'javascript_exec', 'read_console', 'read_network',
] as const;

const VIEWPORT = { width: 1280, height: 800 };
const MAX_TEXT_CHARS = 24_000;
const NAVIGATION_TIMEOUT_MS = 30_000;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

type AnyRecord = Record<string, unknown>;
type Target = { type: 'ref'; ref: string } | { type: 'coordinate'; x: number; y: number };

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as AnyRecord : {};
}

function parseTarget(value: unknown): Target {
  const target = asRecord(value);
  if (target.type === 'ref' && typeof target.ref === 'string' && /^ref_\d+$/.test(target.ref)) {
    return { type: 'ref', ref: target.ref };
  }
  if (target.type === 'coordinate' && typeof target.x === 'number' && typeof target.y === 'number') {
    return { type: 'coordinate', x: target.x, y: target.y };
  }
  throw new Error('target must be {"type":"ref","ref":"ref_N"} or {"type":"coordinate","x":…,"y":…}');
}

function truncate(text: string, max = MAX_TEXT_CHARS) {
  return text.length > max ? `${text.slice(0, max)}\n… (truncated)` : text;
}

const KEY_ALIASES: Record<string, KeyInput> = {
  return: 'Enter', enter: 'Enter', tab: 'Tab', escape: 'Escape', esc: 'Escape', backspace: 'Backspace',
  delete: 'Delete', space: 'Space', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight',
  arrowup: 'ArrowUp', arrowdown: 'ArrowDown', arrowleft: 'ArrowLeft', arrowright: 'ArrowRight',
  page_down: 'PageDown', pagedown: 'PageDown', page_up: 'PageUp', pageup: 'PageUp', home: 'Home', end: 'End',
  ctrl: 'Control', control: 'Control', shift: 'Shift', alt: 'Alt', option: 'Alt',
  cmd: 'Meta', meta: 'Meta', super: 'Meta', command: 'Meta',
};

function toKey(name: string): KeyInput {
  const alias = KEY_ALIASES[name.toLowerCase()];
  if (alias) return alias;
  if (name.length === 1) return name as KeyInput;
  if (/^F\d{1,2}$/i.test(name)) return name.toUpperCase() as KeyInput;
  return name as KeyInput;
}

function modifierKeys(value: unknown): KeyInput[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  return value.split('+').map(part => toKey(part.trim())).filter(Boolean);
}

/** Runs in the page: builds an accessibility-style outline and tags elements with refs. */
function readPageInBrowser(args: { filter: string | null; depth: number; ref: string | null }) {
  const win = window as unknown as { __iconikRef?: number };
  win.__iconikRef ??= 0;
  const INTERACTIVE = 'a[href],button,input,select,textarea,summary,label,[role=button],[role=link],[role=tab],'
    + '[role=option],[role=radio],[role=checkbox],[role=menuitem],[role=combobox],[onclick],[tabindex]:not([tabindex="-1"])';
  const TAG_ROLES: Record<string, string> = {
    A: 'link', BUTTON: 'button', SELECT: 'combobox', TEXTAREA: 'textbox', IMG: 'img', H1: 'heading', H2: 'heading',
    H3: 'heading', H4: 'heading', LABEL: 'label', LI: 'listitem', UL: 'list', OL: 'list', NAV: 'navigation',
    MAIN: 'main', FORM: 'form', TABLE: 'table', P: 'paragraph', SUMMARY: 'button', DIALOG: 'dialog',
  };
  const roleOf = (el: HTMLElement) => {
    const explicit = el.getAttribute('role');
    if (explicit) return explicit;
    if (el instanceof HTMLInputElement) {
      if (el.type === 'checkbox' || el.type === 'radio') return el.type;
      if (el.type === 'submit' || el.type === 'button') return 'button';
      return 'textbox';
    }
    return TAG_ROLES[el.tagName] ?? 'generic';
  };
  const visible = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      && Number(style.opacity) > 0.05;
  };
  const onScreen = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
  };
  const nameOf = (el: HTMLElement) => {
    const field = el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement;
    return (el.getAttribute('aria-label') || el.getAttribute('alt') || el.getAttribute('title')
      || el.getAttribute('placeholder') || (field ? '' : el.innerText) || (field ? (el as HTMLInputElement).value : '') || '')
      .replace(/\s+/g, ' ').trim().slice(0, 100).replace(/"/g, "'");
  };
  const refOf = (el: HTMLElement) => {
    let ref = el.getAttribute('data-iconik-ref');
    if (!ref) {
      win.__iconikRef = (win.__iconikRef ?? 0) + 1;
      ref = `ref_${win.__iconikRef}`;
      el.setAttribute('data-iconik-ref', ref);
    }
    return ref;
  };

  const root = args.ref ? document.querySelector<HTMLElement>(`[data-iconik-ref="${args.ref}"]`) : document.body;
  if (!root) return `No element has ${args.ref}. Call read_page or find again to get fresh refs.`;
  const lines: string[] = [];
  const skip = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'TEMPLATE', 'IFRAME', 'PATH']);

  const walk = (el: Element, depth: number) => {
    if (depth > args.depth || lines.length > 1_200 || !(el instanceof HTMLElement)) return;
    if (skip.has(el.tagName.toUpperCase()) || (el !== root && !visible(el))) return;
    const interactive = el.matches(INTERACTIVE);
    const role = roleOf(el);
    const isTextLeaf = el.childElementCount === 0 && Boolean(el.innerText?.trim());
    const include = args.filter === 'interactive' ? interactive : interactive || role !== 'generic' || isTextLeaf;
    let childDepth = depth;
    if (include && (args.filter === 'all' || onScreen(el))) {
      let extra = '';
      if ((el instanceof HTMLInputElement) && (el.type === 'checkbox' || el.type === 'radio') && el.checked) extra += ' (checked)';
      if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') extra += ' (disabled)';
      // Stores often mark sold-out sizes only visually: a class name or struck-through text.
      else if (/(?:^|[-_\s])(?:disabled|sold-?out|soldout|unavailable|oos|out-?of-?stock|strike)(?:$|[-_\s])/i.test(el.className?.toString() ?? '')
        || getComputedStyle(el).textDecorationLine.includes('line-through')) extra += ' (looks unavailable)';
      if (el.getAttribute('aria-selected') === 'true' || el.getAttribute('aria-pressed') === 'true') extra += ' (selected)';
      if (el instanceof HTMLSelectElement) extra += ` value="${el.options[el.selectedIndex]?.text ?? ''}"`;
      if (el instanceof HTMLAnchorElement && el.getAttribute('href')) extra += ` href="${el.getAttribute('href')!.slice(0, 120)}"`;
      const name = nameOf(el);
      lines.push(`${'  '.repeat(Math.min(depth, 10))}${role}${name ? ` "${name}"` : ''}${extra} [${refOf(el)}]`);
      childDepth = depth + 1;
      if (el instanceof HTMLAnchorElement || el instanceof HTMLButtonElement) return;
    }
    for (const child of Array.from(el.children)) walk(child, childDepth);
  };
  walk(root, 0);
  return lines.join('\n') || 'No matching elements are visible. Try filter "all" or scroll.';
}

export class AgentBrowser {
  private tabs = new Map<string, Page>();
  private activeTab = '';
  private tabCounter = 0;
  private stateChanges: Array<{ type: 'tab_opened'; tab_id: string }> = [];

  private browser: Browser;
  private allowedDomains: string[];

  private constructor(browser: Browser, allowedDomains: string[]) {
    this.browser = browser;
    this.allowedDomains = allowedDomains;
  }

  static async open(allowedDomains: string[]) {
    const browser = process.env.AGENT_BROWSER_WS_ENDPOINT
      ? await (await import('puppeteer-core')).default.connect({ browserWSEndpoint: process.env.AGENT_BROWSER_WS_ENDPOINT })
      : await launchHeadlessBrowser('the agent browser');
    const agentBrowser = new AgentBrowser(browser, allowedDomains.map(domain => domain.toLowerCase()));
    const initial = (await browser.pages())[0] ?? await browser.newPage();
    await agentBrowser.registerTab(initial, true);
    // Pages opened by a click on one of ours (target=_blank) become new tabs.
    // new_tab registers its own page, so pages without an opener are ignored here.
    browser.on('targetcreated', async target => {
      if (target.type() !== 'page' || !target.opener()) return;
      const page = await target.page();
      if (page && ![...agentBrowser.tabs.values()].includes(page)) {
        const tabId = await agentBrowser.registerTab(page);
        agentBrowser.stateChanges.push({ type: 'tab_opened', tab_id: tabId });
      }
    });
    return agentBrowser;
  }

  async close() {
    await this.browser.close().catch(() => undefined);
  }

  isAllowedUrl(value: string) {
    if (value === 'about:blank') return true;
    if (!isSafeRetailUrl(value)) return false;
    const host = new URL(value).hostname.toLowerCase();
    return this.allowedDomains.some(domain => host === domain || host.endsWith(`.${domain}`));
  }

  private async registerTab(page: Page, activate = false) {
    this.tabCounter += 1;
    const tabId = `tab-${this.tabCounter}`;
    this.tabs.set(tabId, page);
    await page.setViewport(VIEWPORT);
    await page.setUserAgent(USER_AGENT);
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.isInterceptResolutionHandled()) return;
      const blocked = request.isNavigationRequest()
        && request.frame() === page.mainFrame()
        && !this.isAllowedUrl(request.url());
      void (blocked ? request.abort('blockedbyclient') : request.continue());
    });
    page.on('close', () => {
      this.tabs.delete(tabId);
      if (this.activeTab === tabId) this.activeTab = this.tabs.keys().next().value ?? '';
    });
    if (activate || !this.activeTab) this.activeTab = tabId;
    return tabId;
  }

  private page(tabId?: unknown) {
    const id = typeof tabId === 'string' && tabId ? tabId : this.activeTab;
    const page = this.tabs.get(id);
    if (!page) throw new Error(`No open tab ${id}`);
    return page;
  }

  private async browserState(): Promise<BetaBrowserStateBlockParam> {
    const tabs = await Promise.all([...this.tabs.entries()].map(async ([tabId, page]) => ({
      tab_id: tabId,
      title: (await page.title().catch(() => '')).slice(0, 200),
      url: page.url(),
      active: tabId === this.activeTab,
    })));
    const changes = this.stateChanges.splice(0);
    return {
      type: 'browser_state',
      tabs,
      ...(changes.length ? { state_changes: changes } : {}),
    };
  }

  private async withState(text: string): Promise<BrowserResultContent> {
    return [{ type: 'text', text }, await this.browserState()];
  }

  private async point(page: Page, target: Target) {
    if (target.type === 'coordinate') return { x: target.x, y: target.y };
    const handle = await page.$(`[data-iconik-ref="${target.ref}"]`);
    if (!handle) throw new Error(`${target.ref} is not on the page any more. Call read_page or find for fresh refs.`);
    await handle.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' }));
    const box = await handle.boundingBox();
    await handle.dispose();
    if (!box) throw new Error(`${target.ref} is not visible.`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  private async settle(page: Page) {
    await Promise.race([
      page.waitForNetworkIdle({ idleTime: 500, timeout: 4_000 }).catch(() => undefined),
      new Promise(resolve => setTimeout(resolve, 4_000)),
    ]);
  }

  private async readPage(page: Page, filter: string | null, depth: number, ref: string | null) {
    return page.evaluate(readPageInBrowser, { filter, depth, ref });
  }

  /** Executes one toolset member call. Throws on failure; the loop turns that into an error result. */
  async execute(name: string, rawInput: unknown): Promise<BrowserMemberResult> {
    const input = asRecord(rawInput);
    switch (name) {
      case 'navigate': {
        const page = this.page(input.tab_id);
        const url = typeof input.url === 'string' ? input.url.trim() : '';
        if (url === 'back') await page.goBack({ timeout: NAVIGATION_TIMEOUT_MS }).catch(() => null);
        else if (url === 'forward') await page.goForward({ timeout: NAVIGATION_TIMEOUT_MS }).catch(() => null);
        else if (url === 'reload') await page.reload({ timeout: NAVIGATION_TIMEOUT_MS, waitUntil: 'domcontentloaded' });
        else {
          if (!this.isAllowedUrl(url)) {
            throw new Error(`Navigation to ${url} is not allowed. Stay on ${this.allowedDomains.join(', ')}.`);
          }
          await page.goto(url, { timeout: NAVIGATION_TIMEOUT_MS, waitUntil: 'domcontentloaded' });
        }
        await this.settle(page);
        return { content: await this.withState(`Navigated to ${page.url()}`) };
      }
      case 'screenshot': {
        const page = this.page(input.tab_id);
        const data = await page.screenshot({ type: 'png', encoding: 'base64' });
        return { content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data } }] };
      }
      case 'zoom': {
        const page = this.page(input.tab_id);
        const region = Array.isArray(input.region) ? input.region.map(Number) : [];
        if (region.length !== 4 || region.some(value => !Number.isFinite(value))) throw new Error('region must be [x0, y0, x1, y1]');
        const [x0, y0, x1, y1] = region;
        const width = Math.max(1, x1 - x0);
        const height = Math.max(1, y1 - y0);
        const scale = Math.min(4, Math.max(1, Math.floor(1_280 / Math.max(width, height))));
        const data = await page.screenshot({ type: 'png', encoding: 'base64', clip: { x: x0, y: y0, width, height, scale } });
        return { content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data } }] };
      }
      case 'left_click':
      case 'right_click':
      case 'double_click':
      case 'triple_click': {
        const page = this.page(input.tab_id);
        const { x, y } = await this.point(page, parseTarget(input.target));
        const modifiers = modifierKeys(input.modifiers);
        for (const key of modifiers) await page.keyboard.down(key);
        await page.mouse.click(x, y, {
          button: name === 'right_click' ? 'right' : 'left',
          count: name === 'double_click' ? 2 : name === 'triple_click' ? 3 : 1,
        });
        for (const key of modifiers.reverse()) await page.keyboard.up(key);
        await this.settle(page);
        return { content: await this.withState(`Clicked at (${Math.round(x)}, ${Math.round(y)}).`) };
      }
      case 'hover': {
        const page = this.page(input.tab_id);
        const { x, y } = await this.point(page, parseTarget(input.target));
        await page.mouse.move(x, y);
        return { content: [{ type: 'text', text: `Hovering at (${Math.round(x)}, ${Math.round(y)}).` }] };
      }
      case 'scroll': {
        const page = this.page(input.tab_id);
        const target = input.target ? parseTarget(input.target) : { type: 'coordinate' as const, x: 640, y: 400 };
        const { x, y } = await this.point(page, target);
        const amount = Math.max(1, Math.min(10, Number(input.scroll_amount ?? 3))) * 120;
        const direction = String(input.scroll_direction ?? 'down');
        await page.mouse.move(x, y);
        await page.mouse.wheel({
          deltaX: direction === 'left' ? -amount : direction === 'right' ? amount : 0,
          deltaY: direction === 'up' ? -amount : direction === 'down' ? amount : 0,
        });
        await new Promise(resolve => setTimeout(resolve, 600));
        return { content: [{ type: 'text', text: `Scrolled ${direction}.` }] };
      }
      case 'scroll_to': {
        const page = this.page(input.tab_id);
        await this.point(page, parseTarget(input.target));
        return { content: [{ type: 'text', text: 'Scrolled the element into view.' }] };
      }
      case 'type': {
        const page = this.page(input.tab_id);
        await page.keyboard.type(String(input.text ?? ''), { delay: 20 });
        return { content: [{ type: 'text', text: 'Typed.' }] };
      }
      case 'key': {
        const page = this.page(input.tab_id);
        const repeat = Math.max(1, Math.min(100, Number(input.repeat ?? 1)));
        const sequence = String(input.text ?? '').trim().split(/\s+/).filter(Boolean);
        for (let index = 0; index < repeat; index += 1) {
          for (const chord of sequence) {
            const keys = chord.split('+').map(part => toKey(part));
            for (const key of keys.slice(0, -1)) await page.keyboard.down(key);
            await page.keyboard.press(keys[keys.length - 1]);
            for (const key of keys.slice(0, -1).reverse()) await page.keyboard.up(key);
          }
        }
        await this.settle(page);
        return { content: await this.withState(`Pressed ${sequence.join(' ')}.`) };
      }
      case 'wait': {
        const seconds = Math.max(0, Math.min(10, Number(input.duration ?? 1)));
        await new Promise(resolve => setTimeout(resolve, seconds * 1_000));
        return { content: [{ type: 'text', text: `Waited ${seconds}s.` }] };
      }
      case 'read_page': {
        const page = this.page(input.tab_id);
        const filter = input.filter === 'interactive' || input.filter === 'all' ? input.filter : null;
        const depth = Math.max(1, Math.min(15, Number(input.depth ?? 15)));
        const ref = typeof input.ref === 'string' ? input.ref : null;
        return { content: [{ type: 'text', text: truncate(await this.readPage(page, filter, depth, ref)) }] };
      }
      case 'find': {
        const page = this.page(input.tab_id);
        const query = String(input.query ?? '').toLowerCase();
        const terms = query.split(/\W+/).filter(term => term.length > 1);
        const lines = (await this.readPage(page, 'all', 15, null)).split('\n');
        const matches = lines
          .map(line => ({ line: line.trim(), score: terms.filter(term => line.toLowerCase().includes(term)).length }))
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 20)
          .map(item => item.line);
        return { content: [{ type: 'text', text: matches.length ? matches.join('\n') : `Nothing on the page matches "${query}".` }] };
      }
      case 'get_page_text': {
        const page = this.page(input.tab_id);
        const text = await page.evaluate(() => {
          const main = document.querySelector('main') ?? document.querySelector('article') ?? document.body;
          return (main as HTMLElement).innerText.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
        });
        return { content: [{ type: 'text', text: truncate(text) }] };
      }
      case 'form_input': {
        const page = this.page(input.tab_id);
        const target = parseTarget(input.target);
        if (target.type !== 'ref') throw new Error('form_input needs a ref target');
        const result = await page.evaluate(({ ref, value }) => {
          const el = document.querySelector(`[data-iconik-ref="${ref}"]`);
          if (!el) return `No element has ${ref}.`;
          if (el instanceof HTMLSelectElement) {
            const wanted = String(value).toLowerCase();
            const option = Array.from(el.options).find(item => item.value.toLowerCase() === wanted || item.text.trim().toLowerCase() === wanted);
            if (!option) return `No option "${value}" in this select.`;
            el.value = option.value;
          } else if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
            if (el.checked !== Boolean(value)) el.click();
            return 'OK';
          } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            const proto = el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
            Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, String(value));
            el.dispatchEvent(new Event('input', { bubbles: true }));
          } else {
            return `${ref} is not a form field.`;
          }
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return 'OK';
        }, { ref: target.ref, value: input.value as string | number | boolean });
        if (result !== 'OK') throw new Error(result);
        await this.settle(page);
        return { content: await this.withState('Value set.') };
      }
      case 'new_tab': {
        await this.registerTab(await this.browser.newPage(), true);
        return { content: [await this.browserState()] };
      }
      case 'list_tabs':
        return { content: [await this.browserState()] };
      case 'switch_tab': {
        const page = this.page(input.tab_id);
        await page.bringToFront();
        this.activeTab = String(input.tab_id);
        return { content: [await this.browserState()] };
      }
      case 'close_tab': {
        const page = this.page(input.tab_id);
        if (this.tabs.size <= 1) throw new Error('Cannot close the last tab.');
        await page.close();
        return { content: [await this.browserState()] };
      }
      default:
        throw new Error(`The ${name} action is not available.`);
    }
  }

  /**
   * Text search for screenshot-driven models: matching elements with the
   * viewport coordinates of their centre, so a click lands exactly.
   */
  async findWithPositions(query: string) {
    const page = this.page();
    const terms = query.toLowerCase().split(/\W+/).filter(term => term.length > 0);
    const lines = (await this.readPage(page, 'all', 15, null)).split('\n')
      .map(line => ({ line: line.trim(), score: terms.filter(term => line.toLowerCase().includes(term)).length }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    const described = await Promise.all(lines.map(async ({ line }) => {
      const ref = line.match(/\[(ref_\d+)\]$/)?.[1];
      const handle = ref ? await page.$(`[data-iconik-ref="${ref}"]`) : null;
      const box = handle ? await handle.boundingBox() : null;
      await handle?.dispose();
      const label = line.replace(/\s*\[ref_\d+\]$/, '');
      if (!box) return `${label} — not visible`;
      const x = Math.round(box.x + box.width / 2);
      const y = Math.round(box.y + box.height / 2);
      const onScreen = y >= 0 && y <= VIEWPORT.height && x >= 0 && x <= VIEWPORT.width;
      return `${label} — ${onScreen ? `at (${x}, ${y})` : `off-screen at y=${y}; scroll to reach it`}`;
    }));
    return described.length ? described.join('\n') : `Nothing on the page matches "${query}".`;
  }

  async scrollPixels(x: number, y: number, deltaX: number, deltaY: number) {
    const page = this.page();
    await page.mouse.move(x, y);
    await page.mouse.wheel({ deltaX, deltaY });
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  /** Deterministic product facts from schema.org JSON-LD and Open Graph tags, before any model runs. */
  async extractStructuredProduct() {
    const page = this.page();
    return page.evaluate(() => {
      const products: unknown[] = [];
      const visit = (node: unknown) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) { node.forEach(visit); return; }
        const record = node as Record<string, unknown>;
        const type = record['@type'];
        if (type === 'Product' || (Array.isArray(type) && type.includes('Product'))) products.push(record);
        if (record['@graph']) visit(record['@graph']);
      };
      for (const script of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
        try { visit(JSON.parse(script.textContent || 'null')); } catch { /* malformed JSON-LD is common */ }
      }
      const meta = (property: string) => document.querySelector<HTMLMetaElement>(
        `meta[property="${property}"], meta[name="${property}"]`,
      )?.content ?? null;
      return {
        url: location.href,
        title: document.title,
        ogTitle: meta('og:title'),
        ogImage: meta('og:image'),
        ogPrice: meta('product:price:amount') ?? meta('og:price:amount'),
        products: JSON.stringify(products).slice(0, 6_000),
      };
    });
  }
}
