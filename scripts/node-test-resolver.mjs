// Test doubles for framework modules that only exist inside the Next runtime.
//
// These are cache and bundling primitives with no meaning in a unit test:
// `revalidateTag` is a no-op outside a request, and `unstable_cache` is an
// identity wrapper. Stubbing them lets tests exercise the real business logic in
// modules that happen to sit behind a Next import, without changing the source.
const EMPTY = 'data:text/javascript,export{}';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const NEXT_CACHE = 'data:text/javascript,'
  + encodeURIComponent([
    'export function revalidateTag(){}',
    'export function revalidatePath(){}',
    'export function unstable_cache(fn){return fn;}',
    'export const unstable_noStore=()=>{};',
  ].join('\n'));

const STUBS = new Map([
  ['server-only', EMPTY],
  ['client-only', EMPTY],
  ['next/cache', NEXT_CACHE],
]);

export async function resolve(specifier, context, nextResolve) {
  const stub = STUBS.get(specifier);
  if (stub) return { url: stub, format: 'module', shortCircuit: true };
  if (specifier.startsWith('@/') || specifier.startsWith('./') || specifier.startsWith('../')) {
    const base = specifier.startsWith('@/')
      ? new URL(`../src/${specifier.slice(2)}`, import.meta.url)
      : new URL(specifier, context.parentURL);
    if (base.protocol === 'file:') {
      for (const suffix of ['', '.ts', '.tsx', '/index.ts']) {
        const candidate = fileURLToPath(base) + suffix;
        if (/\.(ts|tsx)$/.test(candidate) && existsSync(candidate)) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
      }
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.tsx')) {
    const source = await readFile(new URL(url), 'utf8');
    return { format: 'module', shortCircuit: true, source: ts.transpileModule(source, {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText };
  }
  return nextLoad(url, context);
}
