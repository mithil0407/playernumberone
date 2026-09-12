// Resolver hooks for `node --test`, registered via module.register().
//
// Several server modules start with `import 'server-only'` — a Next.js guard
// that stops them being pulled into a client bundle. Next resolves that
// specifier itself; bare node cannot, so any test importing those modules dies
// on ERR_MODULE_NOT_FOUND before a single assertion runs.
//
// This maps the specifier to an empty module for tests only. The guard stays in
// the source, and nothing about the app build changes.
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('./node-test-resolver.mjs', pathToFileURL(import.meta.filename));
