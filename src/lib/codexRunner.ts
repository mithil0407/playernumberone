import 'server-only';

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// Runs one prompt through the Codex CLI signed in with the operator's ChatGPT
// account. Local-only by design: the ChatGPT login lives on the operator's Mac,
// so this never runs on Vercel (see isCodexAvailable).
//
// Every call is a fresh, ephemeral, read-only Codex session in an empty temp
// directory, with the user's config, rules, apps, plugins, hooks and sub-agents
// switched off so it behaves like a plain model call.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_CODEX_BIN = '/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex';
const DEFAULT_MODEL = 'gpt-6-sol';
const MAX_CONCURRENT_RUNS = Math.max(1, Number(process.env.CODEX_MAX_CONCURRENCY) || 3);

export interface CodexImageInput {
  data: string; // base64, no data URI prefix
  mimeType: string;
}

export interface CodexRunOptions {
  prompt: string;
  images?: CodexImageInput[];
  /** 'image' expects exactly one generated image back; 'text' returns the final message. */
  output: 'text' | 'image';
  timeoutMs: number;
  reasoningEffort?: 'minimal' | 'low' | 'medium' | 'high';
  label?: string;
}

export interface CodexRunResult {
  text: string;
  image: CodexImageInput | null;
  threadId: string | null;
  durationMs: number;
}

/** The ChatGPT plan's usage window is exhausted, or Codex is not signed in. Retrying now is pointless. */
export class CodexUnavailableError extends Error {
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.retryAfterMs = retryAfterMs;
    this.name = 'CodexUnavailableError';
  }
}

export function resolveCodexBinary(): string | null {
  const configured = process.env.CODEX_BIN?.trim();
  if (configured) return existsSync(configured) ? configured : null;
  return existsSync(DEFAULT_CODEX_BIN) ? DEFAULT_CODEX_BIN : null;
}

/** True only on a machine with the Codex CLI installed, and never on Vercel. */
export function isCodexAvailable(): boolean {
  if (process.env.VERCEL) return false;
  return resolveCodexBinary() !== null;
}

// ── Concurrency gate ─────────────────────────────────────────────────────────
// Report generation fans out (3 outfit images at once, plus face grids), and
// several reports can run back to back. Cap live Codex processes machine-wide
// for this server so the ChatGPT plan isn't hammered.

let activeRuns = 0;
const waiting: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeRuns < MAX_CONCURRENT_RUNS) {
    activeRuns++;
    return;
  }
  await new Promise<void>(resolve => waiting.push(resolve));
  activeRuns++;
}

function releaseSlot() {
  activeRuns--;
  waiting.shift()?.();
}

// ── Argument building (exported for tests) ───────────────────────────────────

export function buildCodexArgs(input: {
  model: string;
  reasoningEffort: string;
  outputFile: string;
  imagePaths: string[];
}): string[] {
  const args = [
    'exec',
    '--ephemeral',
    '--skip-git-repo-check',
    '--ignore-user-config',
    '--ignore-rules',
    '-s', 'read-only',
    '-m', input.model,
    '-c', `model_reasoning_effort="${input.reasoningEffort}"`,
    '-c', 'features.apps=false',
    '-c', 'features.plugins=false',
    '-c', 'features.hooks=false',
    '-c', 'features.multi_agent=false',
    '--json',
    '-o', input.outputFile,
  ];
  // `-i` takes several files, so `--` ends the list before the stdin marker.
  if (input.imagePaths.length > 0) args.push('-i', ...input.imagePaths, '--');
  args.push('-');
  return args;
}

interface CodexEvent {
  type?: string;
  thread_id?: string;
  message?: string;
  error?: { message?: string };
}

export function parseCodexEvents(stdout: string): { threadId: string | null; errorMessage: string | null } {
  let threadId: string | null = null;
  let errorMessage: string | null = null;
  for (const line of stdout.split('\n')) {
    if (!line.trim().startsWith('{')) continue;
    let event: CodexEvent;
    try {
      event = JSON.parse(line) as CodexEvent;
    } catch {
      continue;
    }
    if (event.type === 'thread.started' && event.thread_id) threadId = event.thread_id;
    if (event.type === 'error' || event.type === 'turn.failed') {
      errorMessage = event.error?.message ?? event.message ?? errorMessage;
    }
  }
  return { threadId, errorMessage };
}

const USAGE_LIMIT_PATTERN = /usage limit|rate limit|too many requests|\b429\b|quota/i;
const SIGNED_OUT_PATTERN = /not logged in|login required|\b401\b|unauthori[sz]ed|refresh token/i;

export function classifyCodexFailure(message: string): CodexUnavailableError | null {
  if (USAGE_LIMIT_PATTERN.test(message)) {
    return new CodexUnavailableError(`ChatGPT usage limit reached: ${message.slice(0, 300)}`, 15 * 60_000);
  }
  if (SIGNED_OUT_PATTERN.test(message)) {
    return new CodexUnavailableError(`Codex is not signed in to ChatGPT: ${message.slice(0, 300)}`, 60 * 60_000);
  }
  return null;
}

function extensionFor(mimeType: string): string {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

async function readGeneratedImage(threadId: string): Promise<CodexImageInput | null> {
  const dir = path.join(process.env.CODEX_HOME || path.join(homedir(), '.codex'), 'generated_images', threadId);
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return null;
  }
  const imageFile = files.filter(name => /\.(png|jpe?g|webp)$/i.test(name)).sort().at(-1);
  if (!imageFile) return null;
  const buffer = await readFile(path.join(dir, imageFile));
  // Client-derived images should not pile up in ~/.codex once the report has them.
  await rm(dir, { recursive: true, force: true });
  const mimeType = /\.png$/i.test(imageFile) ? 'image/png' : /\.webp$/i.test(imageFile) ? 'image/webp' : 'image/jpeg';
  return { data: buffer.toString('base64'), mimeType };
}

export async function runCodex(options: CodexRunOptions): Promise<CodexRunResult> {
  const bin = resolveCodexBinary();
  if (!bin || process.env.VERCEL) throw new Error('Codex CLI is not available on this machine');

  await acquireSlot();
  const startedAt = Date.now();
  const workDir = await mkdtemp(path.join(tmpdir(), 'iconik-codex-'));
  try {
    const imagePaths: string[] = [];
    for (const [index, image] of (options.images ?? []).entries()) {
      const file = path.join(workDir, `image-${index + 1}.${extensionFor(image.mimeType)}`);
      await writeFile(file, Buffer.from(image.data, 'base64'));
      imagePaths.push(file);
    }

    const outputFile = path.join(workDir, 'last-message.txt');
    const args = buildCodexArgs({
      model: process.env.CODEX_MODEL?.trim() || DEFAULT_MODEL,
      reasoningEffort: options.reasoningEffort ?? (options.output === 'image' ? 'low' : 'medium'),
      outputFile,
      imagePaths,
    });

    const { code, stdout, stderr, timedOut } = await new Promise<{ code: number | null; stdout: string; stderr: string; timedOut: boolean }>((resolve, reject) => {
      const child = spawn(bin, args, { cwd: workDir, stdio: ['pipe', 'pipe', 'pipe'] });
      let out = '';
      let err = '';
      let didTimeOut = false;
      const timer = setTimeout(() => {
        didTimeOut = true;
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 5_000).unref();
      }, options.timeoutMs);
      child.stdout.on('data', chunk => { out += chunk; });
      child.stderr.on('data', chunk => { err += chunk; });
      child.on('error', error => {
        clearTimeout(timer);
        reject(error);
      });
      child.on('close', exitCode => {
        clearTimeout(timer);
        resolve({ code: exitCode, stdout: out, stderr: err, timedOut: didTimeOut });
      });
      child.stdin.end(options.prompt);
    });

    const { threadId, errorMessage } = parseCodexEvents(stdout);
    const label = options.label ? ` ${options.label}` : '';

    if (timedOut) throw new Error(`Codex${label} timed out after ${Math.round(options.timeoutMs / 1000)}s`);
    if (code !== 0) {
      const detail = errorMessage ?? stderr.split('\n').filter(line => line.trim() && !line.includes('failed to load skill')).slice(-3).join(' | ');
      throw classifyCodexFailure(detail) ?? new Error(`Codex${label} exited with code ${code}: ${detail.slice(0, 400)}`);
    }

    const text = existsSync(outputFile) ? (await readFile(outputFile, 'utf8')).trim() : '';
    const image = options.output === 'image' && threadId ? await readGeneratedImage(threadId) : null;
    if (options.output === 'image' && !image) {
      throw new Error(`Codex${label} returned no image: ${text.slice(0, 300) || errorMessage || 'no message'}`);
    }
    if (options.output === 'text' && !text) {
      throw new Error(`Codex${label} returned an empty response`);
    }

    return { text, image, threadId, durationMs: Date.now() - startedAt };
  } finally {
    releaseSlot();
    await rm(workDir, { recursive: true, force: true });
  }
}
